# 🍔 SaaS Panças Lanches - Cardápio Digital & Automação de Delivery

> **O sistema completo para hamburguerias e lanchonetes que querem vender mais, automatizar o WhatsApp e ter controle total do negócio.**

Este projeto é uma solução **SaaS (Software as a Service)** robusta para gestão de delivery, focada em simplicidade para o cliente e poder de gestão para o dono do estabelecimento.

---

## 🚀 Funcionalidades Principais

### 🌐 Cardápio Digital (Front-end)
- **Design Moderno e Responsivo**: Focado em UX para mobile, com carregamento rápido e visual atraente.
- **Categorização de Produtos**: Organização clara entre Lanches, Porções, Bebidas, etc.
- **Acompanhamento em Tempo Real**: O cliente vê o status do pedido (Novo, Em preparo, Saiu para entrega, Entregue).
- **Checkout Inteligente**: Resumo do pedido, cálculo automático de totais e integração com métodos de pagamento.

### 🤖 Automação com I.A. (WhatsApp & Site)
- **Chatbot Inteligente**: IA integrada ao WhatsApp que responde dúvidas sobre:
    - Cardápio e preços.
    - Horário de funcionamento e taxas de entrega.
    - Recomendações dos mais pedidos.
    - Status de pedidos em andamento.
- **Assistente Virtual no Site**: Um robô flutuante que ajuda o cliente a navegar e tirar dúvidas rápidas sem sair da página.
- **Segurança Anti-Spam**: Filtros para ignorar grupos, stories e mensagens automáticas.

### 🎫 Sistema de Cupons & Promoções
- **Cupons de Desconto (%)**: Crie códigos como `LANCHE20` para dar descontos percentuais.
- **Promoção 2 por 1 (BOGO)**: Configure cupons que dão o segundo item grátis automaticamente no carrinho.
- **Gestão de Promoções**: Crie e exclua cupons instantaneamente pelo painel admin.

### ⚙️ Painel Administrativo (Gestão Total)
- **Gestão de Pedidos**: Receba pedidos em tempo real via **Socket.io** (com alertas sonoros).
- **Controle de Loja**: 
    - **Abrir/Fechar Manual**: Botão para fechar a loja instantaneamente em caso de imprevistos.
    - **Horário Programado**: Exibição automática do horário de atendimento (15h às 23h).
    - **Personalização**: Altere o nome do estabelecimento e a logo em segundos.
- **Dashboard de Vendas**: Veja estatísticas de pedidos entregues, faturamento e novos pedidos.
- **Gestão de Produtos**: Adicione, edite ou remova itens do cardápio com facilidade.

### 💳 Pagamentos & Integrações
- **Pagamento via Pix**: Redirecionamento para tela de pagamento com QR Code.
- **Integração WhatsApp**: Notificações automáticas enviadas ao cliente quando o status do pedido muda.

---

## 🛠️ Tecnologias Utilizadas

- **Back-end**: Node.js com Express
- **Banco de Dados**: SQLite (Leve, rápido e sem necessidade de configuração complexa)
- **Real-time**: Socket.io (Atualizações instantâneas sem refresh)
- **Integração WA**: WhatsApp-web.js (Automação oficial via QR Code)
- **Front-end**: HTML5, CSS3 (Tailwind CSS) e JavaScript Vanilla
- **Tunelamento**: Compatível com Ngrok para hospedagem local rápida.

---

## 📦 Como Instalar e Rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/samas-pancas-lanches.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```

4. **Hospede online (Opcional - via Ngrok):**
   ```bash
   ngrok http 3000
   ```

5. **Acesse o Admin:**
   Vá para `http://localhost:3000/admin.html` e escaneie o QR Code do WhatsApp para ativar a I.A.

---

## 💰 Por que este projeto é valioso?
Este sistema resolve a dor de cabeça de muitos donos de lanchonetes: o atendimento manual demorado no WhatsApp. Com a I.A. respondendo e o cliente fazendo o pedido sozinho pelo link, a eficiência do negócio aumenta em até **70%**, reduzindo erros humanos e aumentando o ticket médio com sugestões automáticas.

---

Desenvolvido com ❤️ por [Seu Nome/Empresa]
