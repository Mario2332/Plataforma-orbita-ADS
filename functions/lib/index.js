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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificacoesFunctions = exports.metasFunctions = exports.alunoFunctions = exports.mentorFunctions = exports.gestorFunctions = exports.onUserCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
// Carregar variáveis de ambiente
dotenv.config();
// Inicializar Firebase Admin
// Em produção, as credenciais são obtidas automaticamente do ambiente Firebase
// Em desenvolvimento local com emuladores, não precisa de credenciais
admin.initializeApp();
// Exportar todas as funções
var onUserCreated_1 = require("./triggers/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var gestor_1 = require("./callable/gestor");
Object.defineProperty(exports, "gestorFunctions", { enumerable: true, get: function () { return gestor_1.gestorFunctions; } });
var mentor_1 = require("./callable/mentor");
Object.defineProperty(exports, "mentorFunctions", { enumerable: true, get: function () { return mentor_1.mentorFunctions; } });
var aluno_1 = require("./callable/aluno");
Object.defineProperty(exports, "alunoFunctions", { enumerable: true, get: function () { return aluno_1.alunoFunctions; } });
var metas_1 = require("./callable/metas");
Object.defineProperty(exports, "metasFunctions", { enumerable: true, get: function () { return metas_1.metasFunctions; } });
var notificacoes_1 = require("./callable/notificacoes");
Object.defineProperty(exports, "notificacoesFunctions", { enumerable: true, get: function () { return notificacoes_1.notificacoesFunctions; } });
__exportStar(require("./callable/aluno-extras"), exports);
__exportStar(require("./callable/mentor-conteudos"), exports);
__exportStar(require("./callable/conteudos-simples"), exports);
__exportStar(require("./callable/cronograma-anual"), exports);
__exportStar(require("./callable/init-cronograma-templates"), exports);
__exportStar(require("./callable/update-templates-http"), exports);
__exportStar(require("./callable/reset-templates"), exports);
__exportStar(require("./callable/upload-profile-photo"), exports);
__exportStar(require("./webhooks/kiwify"), exports);
__exportStar(require("./triggers/email-sender"), exports);
__exportStar(require("./triggers/updateMetasProgress"), exports);
__exportStar(require("./triggers/processarMetasDiarias"), exports);
//# sourceMappingURL=index.js.map