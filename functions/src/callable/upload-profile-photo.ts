import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Função para fazer upload de foto de perfil
 * Recebe a imagem em base64 e salva no Storage
 */
export const uploadProfilePhoto = functions
  .region("southamerica-east1")
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    const uid = context.auth.uid;
    const { imageData } = data;

    if (!imageData) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Imagem não fornecida"
      );
    }

    try {
      functions.logger.info(`📸 Upload de foto de perfil para usuário ${uid}`);

      // Extrair tipo de imagem e dados base64
      const matches = imageData.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
      
      if (!matches || matches.length !== 3) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Formato de imagem inválido"
        );
      }

      const imageType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Validar tamanho (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Imagem muito grande. Tamanho máximo: 5MB"
        );
      }

      // Validar tipo de imagem
      const allowedTypes = ["jpeg", "jpg", "png", "webp"];
      if (!allowedTypes.includes(imageType.toLowerCase())) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Tipo de imagem não suportado. Use JPEG, PNG ou WebP"
        );
      }

      // Deletar foto antiga se existir
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      
      if (userData?.photoURL) {
        try {
          // Extrair caminho do arquivo da URL
          const oldPhotoPath = `profile-photos/${uid}.${imageType}`;
          const oldFile = bucket.file(oldPhotoPath);
          await oldFile.delete();
          functions.logger.info(`🗑️ Foto antiga deletada: ${oldPhotoPath}`);
        } catch (error) {
          // Ignorar erro se arquivo não existir
          functions.logger.warn("Erro ao deletar foto antiga (pode não existir):", error);
        }
      }

      // Nome do arquivo
      const fileName = `profile-photos/${uid}.${imageType}`;
      const file = bucket.file(fileName);

      // Fazer upload
      await file.save(buffer, {
        metadata: {
          contentType: `image/${imageType}`,
          metadata: {
            firebaseStorageDownloadTokens: uid, // Token para acesso público
          },
        },
      });

      functions.logger.info(`✅ Upload concluído: ${fileName}`);

      // Tornar arquivo público
      await file.makePublic();

      // Obter URL pública
      const photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Atualizar perfil do usuário
      await db.collection("users").doc(uid).update({
        photoURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`✅ Perfil atualizado com nova foto`);

      return {
        success: true,
        photoURL,
      };
    } catch (error: any) {
      functions.logger.error("❌ Erro no upload de foto:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Erro ao fazer upload da foto: " + error.message
      );
    }
  });

/**
 * Função para deletar foto de perfil
 */
export const deleteProfilePhoto = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    const uid = context.auth.uid;

    try {
      functions.logger.info(`🗑️ Deletando foto de perfil do usuário ${uid}`);

      // Buscar URL da foto atual
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      if (!userData?.photoURL) {
        throw new functions.https.HttpsError(
          "not-found",
          "Usuário não possui foto de perfil"
        );
      }

      // Deletar arquivo do Storage
      // Tentar deletar com diferentes extensões
      const extensions = ["jpg", "jpeg", "png", "webp"];
      let deleted = false;

      for (const ext of extensions) {
        try {
          const filePath = `profile-photos/${uid}.${ext}`;
          const file = bucket.file(filePath);
          await file.delete();
          functions.logger.info(`✅ Foto deletada: ${filePath}`);
          deleted = true;
          break;
        } catch (error) {
          // Continuar tentando outras extensões
        }
      }

      if (!deleted) {
        functions.logger.warn("⚠️ Arquivo de foto não encontrado no Storage");
      }

      // Remover URL do perfil
      await db.collection("users").doc(uid).update({
        photoURL: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`✅ Foto removida do perfil`);

      return {
        success: true,
      };
    } catch (error: any) {
      functions.logger.error("❌ Erro ao deletar foto:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Erro ao deletar foto: " + error.message
      );
    }
  });
