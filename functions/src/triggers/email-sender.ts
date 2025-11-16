import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

/**
 * Trigger do Firestore para enviar emails pendentes
 * 
 * Monitora a collection 'emails_pendentes' e envia emails automaticamente
 * quando um novo documento é criado.
 * 
 * Configuração necessária:
 * - EMAIL_USER: Email do remetente (ex: noreply@mentoria.com)
 * - EMAIL_PASS: Senha ou App Password do email
 * - EMAIL_HOST: Servidor SMTP (ex: smtp.gmail.com)
 * - EMAIL_PORT: Porta SMTP (ex: 587)
 */

interface EmailPendente {
  to: string;
  subject: string;
  html: string;
  status: "pending" | "sent" | "failed";
  createdAt: admin.firestore.Timestamp;
  sentAt?: admin.firestore.Timestamp;
  error?: string;
}

/**
 * Cria transporter do Nodemailer
 */
function criarTransport() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = parseInt(process.env.EMAIL_PORT || "587");

  if (!emailUser || !emailPass) {
    throw new Error(
      "Variáveis de ambiente EMAIL_USER e EMAIL_PASS não configuradas"
    );
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
export const enviarEmailPendente = functions
  .region("southamerica-east1")
  .firestore.document("emails_pendentes/{emailId}")
  .onCreate(async (snapshot, context) => {
    const emailId = context.params.emailId;
    const emailData = snapshot.data() as EmailPendente;

    functions.logger.info("Processando email pendente", {
      emailId,
      to: emailData.to,
    });

    try {
      // Criar transporter
      const transporter = criarTransport();

      // Enviar email
      const info = await transporter.sendMail({
        from: `"Mentoria Mário Machado" <${process.env.EMAIL_USER}>`,
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
    } catch (error: any) {
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
export const testEmail = functions
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
    } catch (error: any) {
      functions.logger.error("Erro ao testar email", error);
      res.status(500).json({
        error: "Erro ao adicionar email à fila",
        message: error.message,
      });
    }
  });
