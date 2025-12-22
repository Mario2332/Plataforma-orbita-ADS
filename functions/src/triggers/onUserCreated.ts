import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Trigger executado quando um novo usuário é criado no Firebase Auth
 * Cria o documento correspondente no Firestore APENAS se não existir
 */
export const onUserCreated = functions
  .region("southamerica-east1")
  .auth.user()
  .onCreate(async (user) => {
    const db = admin.firestore();

    try {
      const userDocRef = db.collection("users").doc(user.uid);
      const userDoc = await userDocRef.get();

      // Verificar se o documento já existe
      if (userDoc.exists) {
        functions.logger.info(`Documento de usuário já existe para: ${user.uid}. Pulando criação.`);
        return;
      }

      // Aguardar um momento para o displayName ser atualizado pelo frontend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar dados atualizados do usuário
      const updatedUser = await admin.auth().getUser(user.uid);
      const displayName = updatedUser.displayName || user.displayName || "Usuário";

      // Criar documento do usuário no Firestore apenas se não existir
      await userDocRef.set({
        uid: user.uid,
        email: user.email || "",
        name: displayName,
        role: "aluno", // Role padrão apenas para novos usuários
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Documento de usuário criado para: ${user.uid} com nome: ${displayName}`);

      // Inicializar aluno no ranking (nível 1 - Vestibulando Bronze)
      const rankingRef = db.collection("ranking").doc(user.uid);
      await rankingRef.set({
        nivel: 1,
        pontosSemanais: 0,
        ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Ranking inicializado para: ${user.uid} no nível 1`);
    } catch (error) {
      functions.logger.error("Erro ao criar documento de usuário:", error);
      throw error;
    }
  });
