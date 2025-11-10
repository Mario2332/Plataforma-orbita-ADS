import * as admin from "firebase-admin";

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
