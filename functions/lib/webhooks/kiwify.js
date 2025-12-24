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
exports.kiwifyWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
/**
 * Gera uma senha simples e memorável
 * Formato: Palavra + 4 dígitos (ex: Mentoria2024)
 */
function gerarSenhaInicial() {
    const ano = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `Mentoria${ano}${numero}`;
}
/**
 * Envia email de boas-vindas com credenciais
 */
async function enviarEmailBoasVindas(email, nome, senha) {
    const primeiroNome = nome.split(" ")[0];
    const assunto = "Bem-vindo à Plataforma Órbita! 🎓";
    const corpo = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .credentials { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Bem-vindo à Mentoria!</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${primeiroNome}</strong>!</p>
      
      <p>É com grande alegria que te recebemos na <strong>Mentoria ENEM Mário Machado</strong>! 🎉</p>
      
      <p>Sua conta foi criada com sucesso e você já pode acessar a plataforma.</p>
      
      <div class="credentials">
        <h3>📧 Suas Credenciais de Acesso:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${senha}</code></p>
      </div>
      
      <p><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.</p>
      
      <p style="text-align: center;">
        <a href="https://plataforma-mentoria-mario.web.app/login/aluno" class="button">
          Acessar Plataforma
        </a>
      </p>
      
      <h3>🚀 Próximos Passos:</h3>
      <ol>
        <li>Acesse a plataforma usando suas credenciais</li>
        <li>Complete seu perfil nas Configurações</li>
        <li>Explore os conteúdos disponíveis</li>
        <li>Comece a registrar seu progresso no Diário de Bordo</li>
      </ol>
      
      <p>Se tiver qualquer dúvida, estamos à disposição para ajudar!</p>
      
      <p>Bons estudos! 📚✨</p>
      
      <p><strong>Equipe Plataforma Órbita</strong></p>
    </div>
    <div class="footer">
      <p>Este é um email automático. Por favor, não responda.</p>
      <p>© ${new Date().getFullYear()} Plataforma Órbita. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
    // Enviar email usando Firebase Admin SDK
    // Nota: Requer configuração de serviço de email (SendGrid, Mailgun, etc)
    // Por enquanto, vamos usar o Firestore para armazenar emails pendentes
    // que serão enviados por uma extensão do Firebase ou serviço externo
    await admin.firestore().collection("emails_pendentes").add({
        to: email,
        subject: assunto,
        html: corpo,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
    });
    functions.logger.info("Email de boas-vindas agendado", { email });
}
/**
 * Cria um novo aluno no Firebase Auth e Firestore
 */
async function criarAluno(email, nome, orderId) {
    // Gerar senha inicial
    const senha = gerarSenhaInicial();
    // Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
        email,
        password: senha,
        displayName: nome,
        emailVerified: false,
    });
    functions.logger.info("Usuário criado no Firebase Auth", {
        uid: userRecord.uid,
        email,
    });
    // Criar documento do aluno no Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
        email,
        nome,
        role: "aluno",
        kiwifyOrderId: orderId,
        dataCadastro: admin.firestore.FieldValue.serverTimestamp(),
        primeiroAcesso: true,
        ativo: true,
    });
    functions.logger.info("Documento do aluno criado no Firestore", {
        uid: userRecord.uid,
    });
    return { uid: userRecord.uid, senha };
}
/**
 * Valida a assinatura do webhook da Kiwify (se configurada)
 */
function validarAssinatura(payload, signature, secret) {
    if (!secret || !signature) {
        // Se não houver secret configurado, aceita qualquer requisição
        // (não recomendado para produção)
        functions.logger.warn("Webhook sem validação de assinatura");
        return true;
    }
    const hash = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return hash === signature;
}
/**
 * Cloud Function HTTP para receber webhook da Kiwify
 */
exports.kiwifyWebhook = functions
    .region("southamerica-east1")
    .https.onRequest(async (req, res) => {
    // Configurar CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, X-Kiwify-Signature");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Método não permitido" });
        return;
    }
    try {
        functions.logger.info("Webhook recebido da Kiwify", {
            headers: req.headers,
            body: req.body,
        });
        // Validar assinatura (se configurada)
        const signature = req.headers["x-kiwify-signature"];
        const secret = process.env.KIWIFY_WEBHOOK_SECRET;
        const payload = JSON.stringify(req.body);
        if (!validarAssinatura(payload, signature, secret)) {
            functions.logger.error("Assinatura do webhook inválida");
            res.status(401).json({ error: "Assinatura inválida" });
            return;
        }
        const webhookData = req.body;
        // Verificar se é um evento de pagamento ou assinatura
        if (webhookData.event !== "order.paid" &&
            webhookData.event !== "subscription.started") {
            functions.logger.info("Evento ignorado", { event: webhookData.event });
            res.status(200).json({ message: "Evento ignorado" });
            return;
        }
        const { email, name } = webhookData.data.customer;
        const { order_id } = webhookData.data;
        // Validar dados obrigatórios
        if (!email || !name) {
            functions.logger.error("Dados do cliente incompletos", webhookData);
            res.status(400).json({ error: "Email e nome são obrigatórios" });
            return;
        }
        // Verificar se o aluno já existe
        const existingUser = await admin
            .auth()
            .getUserByEmail(email)
            .catch(() => null);
        if (existingUser) {
            functions.logger.info("Aluno já existe", { email, uid: existingUser.uid });
            // Atualizar status para ativo (caso tenha sido desativado)
            await admin
                .firestore()
                .collection("users")
                .doc(existingUser.uid)
                .update({
                ativo: true,
                ultimaRenovacao: admin.firestore.FieldValue.serverTimestamp(),
            });
            res.status(200).json({
                message: "Aluno já cadastrado, status atualizado",
                uid: existingUser.uid,
            });
            return;
        }
        // Criar novo aluno
        const { uid, senha } = await criarAluno(email, name, order_id);
        // Enviar email de boas-vindas
        await enviarEmailBoasVindas(email, name, senha);
        functions.logger.info("Aluno cadastrado com sucesso", {
            uid,
            email,
            orderId: order_id,
        });
        res.status(201).json({
            message: "Aluno cadastrado com sucesso",
            uid,
        });
    }
    catch (error) {
        functions.logger.error("Erro ao processar webhook", {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            error: "Erro ao processar webhook",
            message: error.message,
        });
    }
});
//# sourceMappingURL=kiwify.js.map