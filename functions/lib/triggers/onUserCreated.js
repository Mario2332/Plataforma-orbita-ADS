"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Trigger executado quando um novo usuário é criado no Firebase Auth
 * Cria o documento correspondente no Firestore APENAS se não existir
 */
exports.onUserCreated = functions
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
    }
    catch (error) {
        functions.logger.error("Erro ao criar documento de usuário:", error);
        throw error;
    }
});
//# sourceMappingURL=onUserCreated.js.map