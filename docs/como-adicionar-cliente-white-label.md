# Como Adicionar um Novo Cliente White-label

Este guia detalha o processo completo para configurar uma nova plataforma white-label para um cliente, desde a criação no painel de gestão até a configuração do domínio personalizado.

---

## Visão Geral do Processo

O processo é dividido em três etapas principais:

| Etapa | Ação | Quem Faz | Ferramenta |
|-------|------|----------|------------|
| **1** | Criar o Cliente (Tenant) | Você | Área do Gestor |
| **2** | Adicionar Domínio Personalizado | Você | Firebase Console |
| **3** | Configurar DNS | Cliente | Painel de Domínio (ex: GoDaddy, Registro.br) |

---

## Etapa 1: Criar o Cliente na Área do Gestor

Nesta etapa, você irá configurar todas as personalizações do cliente, como nome, logo, cores e funcionalidades.

1.  **Acesse a Área do Gestor**:
    -   Vá para [https://plataforma-orbita.web.app/gestor/clientes](https://plataforma-orbita.web.app/gestor/clientes)

2.  **Crie um Novo Cliente**:
    -   Clique no botão **"+ Novo Cliente"**.

3.  **Preencha as Informações**:

    -   **Aba Geral**:
        -   **Nome do Cliente**: O nome da escola ou empresa (ex: "Colégio Alfa").
        -   **Slug**: Será gerado automaticamente a partir do nome (ex: `colegio-alfa`).
        -   **Plano**: Selecione `white-label`.
        -   **Status**: Deixe como `pendente` até o domínio estar no ar.

    -   **Aba Branding**:
        -   **Logo**: Faça o upload do logo do cliente.
        -   **Cores**: Selecione a cor primária, cor de hover e cor secundária da marca do cliente.

    -   **Aba Domínios**:
        -   Adicione o domínio principal do cliente (ex: `app.colegioalfa.com.br`).

    -   **Aba Features**:
        -   Ative ou desative as funcionalidades que o cliente contratou.

4.  **Salve as Configurações**:
    -   Clique em **"Criar Cliente"**.

---

## Etapa 2: Adicionar Domínio no Firebase Hosting

Agora, você precisa informar ao Firebase que o domínio do cliente deve apontar para a sua plataforma.

1.  **Acesse o Firebase Console**:
    -   Vá para [https://console.firebase.google.com/](https://console.firebase.google.com/)
    -   Selecione o projeto **`plataforma-orbita`**.

2.  **Vá para o Hosting**:
    -   No menu lateral, clique em **Build** → **Hosting**.

3.  **Adicione o Domínio Personalizado**:
    -   Clique em **"Adicionar domínio personalizado"**.
    -   Digite o domínio do cliente que você configurou na Etapa 1 (ex: `app.colegioalfa.com.br`).
    -   Clique em **"Continuar"**.

4.  **Receba os Registros DNS**:
    -   O Firebase irá fornecer os registros DNS que o cliente precisa configurar. Geralmente, são dois registros do tipo **A**.
    -   **Copie esses valores** para enviar ao cliente.

    ![Exemplo de Registros DNS no Firebase](https://firebase.google.com/docs/hosting/media/custom-domain-wizard-2.png)

---

## Etapa 3: Cliente Configura o DNS

Esta é a única etapa que depende do cliente.

1.  **Envie as Instruções ao Cliente**:
    -   Envie um e-mail para o cliente com os registros DNS que você copiou do Firebase.

2.  **Cliente Adiciona os Registros**:
    -   O cliente deve acessar o painel de controle do seu serviço de domínio (GoDaddy, Registro.br, Cloudflare, etc.) e adicionar os registros **A** fornecidos.

3.  **Aguarde a Propagação**:
    -   A propagação do DNS pode levar de alguns minutos a 24 horas.
    -   O Firebase irá verificar automaticamente e, quando concluído, emitirá um **certificado SSL gratuito** para o domínio.

---

## Etapa 4: Ativar o Cliente

1.  **Verifique o Status no Firebase**:
    -   No Firebase Hosting, o status do domínio mudará para **"Conectado"**.

2.  **Ative o Cliente na Área do Gestor**:
    -   Volte para a página de **Clientes** na área do gestor.
    -   Edite o cliente e mude o **Status** de `pendente` para `ativo`.

**Pronto!** A plataforma do cliente estará no ar com sua própria identidade visual e domínio personalizado.
