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
exports.testEmail = exports.enviarEmailPendente = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
/**
 * Cria transporter do Nodemailer
 */
function criarTransport() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const emailPort = parseInt(process.env.EMAIL_PORT || "587");
    if (!emailUser || !emailPass) {
        throw new Error("Variáveis de ambiente EMAIL_USER e EMAIL_PASS não configuradas");
    }
    return nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });
}
/**
 * Trigger: Envia email quando um novo documento é criado em 'emails_pendentes'
 */
exports.enviarEmailPendente = functions
    .region("southamerica-east1")
    .firestore.document("emails_pendentes/{emailId}")
    .onCreate(async (snapshot, context) => {
    const emailId = context.params.emailId;
    const emailData = snapshot.data();
    functions.logger.info("Processando email pendente", {
        emailId,
        to: emailData.to,
    });
    try {
        // Criar transporter
        const transporter = criarTransport();
        // Enviar email
        const info = await transporter.sendMail({
            from: `"Plataforma Órbita" <${process.env.EMAIL_USER}>`,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
        });
        functions.logger.info("Email enviado com sucesso", {
            emailId,
            messageId: info.messageId,
        });
        // Atualizar status para 'sent'
        await snapshot.ref.update({
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            messageId: info.messageId,
        });
    }
    catch (error) {
        functions.logger.error("Erro ao enviar email", {
            emailId,
            error: error.message,
            stack: error.stack,
        });
        // Atualizar status para 'failed'
        await snapshot.ref.update({
            status: "failed",
            error: error.message,
        });
    }
});
/**
 * Cloud Function HTTP para testar envio de email
 * Endpoint: /testEmail
 */
exports.testEmail = functions
    .region("southamerica-east1")
    .https.onRequest(async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            res.status(400).json({
                error: "Parâmetros obrigatórios: to, subject, html",
            });
            return;
        }
        // Adicionar email à fila
        const docRef = await admin
            .firestore()
            .collection("emails_pendentes")
            .add({
            to,
            subject,
            html,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({
            message: "Email adicionado à fila",
            emailId: docRef.id,
        });
    }
    catch (error) {
        functions.logger.error("Erro ao testar email", error);
        res.status(500).json({
            error: "Erro ao adicionar email à fila",
            message: error.message,
        });
    }
});
//# sourceMappingURL=email-sender.js.map