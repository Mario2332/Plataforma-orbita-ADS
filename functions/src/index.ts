import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Firebase Admin
// Em produção, as credenciais são obtidas automaticamente do ambiente Firebase
// Em desenvolvimento local com emuladores, não precisa de credenciais
admin.initializeApp();

// Exportar todas as funções
export { onUserCreated } from "./triggers/onUserCreated";
export { gestorFunctions } from "./callable/gestor";
export { mentorFunctions } from "./callable/mentor";
export { alunoFunctions } from "./callable/aluno";
export * from "./callable/aluno-extras";
export * from "./callable/mentor-conteudos";
export * from "./callable/conteudos-simples";
export * from "./callable/cronograma-anual";
export * from "./callable/init-cronograma-templates";
export * from "./callable/update-templates-http";
export * from "./callable/reset-templates";
export * from "./webhooks/kiwify";
export * from "./triggers/email-sender";
