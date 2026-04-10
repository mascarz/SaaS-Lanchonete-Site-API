const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Setup
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "pancas-session"
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'],
        headless: true
    }
});

let whatsappConnected = false;
let lastQr = "";

client.on('qr', (qr) => {
    console.log('--- NOVO QR CODE GERADO ---');
    console.log('Escaneie no seu celular para conectar o WhatsApp:');
    qrcode.generate(qr, { small: true });
    lastQr = qr;
    io.emit('whatsapp_qr', qr);
});

client.on('authenticated', () => {
    console.log('WhatsApp: Autenticado com sucesso! Salvando sessão...');
});

client.on('ready', () => {
    console.log('--- WHATSAPP PRONTO PARA USO ---');
    whatsappConnected = true;
    lastQr = "";
    io.emit('whatsapp_connected', true);
});

client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação do WhatsApp:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    whatsappConnected = false;
    io.emit('whatsapp_connected', false);
});

// IA Chatbot Logic (Apenas mensagens diretas, NUNCA Status/Stories)
client.on('message', async (msg) => {
    // Segurança máxima: Ignorar mensagens de Status/Stories e Grupos
    if (msg.isStatus || msg.from === 'status@broadcast' || msg.from.includes('@g.us')) return;

    const text = msg.body.toLowerCase();
    const siteLink = "https://jeniffer-unfenestrated-lowell.ngrok-free.dev";
    let response = "";

    // Evitar responder a si mesmo (caso o bot envie mensagem para o próprio número)
    if (msg.from === client.info.wid._serialized) return;

    if (text.includes('oi') || text.includes('olá') || text.includes('bom dia') || text.includes('boa tarde') || text.includes('boa noite') || text.includes('opa')) {
        response = "🍔 *Olá! Bem-vindo ao Panças Lanches!* Eu sou seu assistente virtual.\n\nComo posso te ajudar hoje?\n1. Ver Cardápio 📜\n2. Fazer Pedido 🚀\n3. Ver Horários 🕒\n4. Taxa de Entrega 🛵\n5. Formas de Pagamento 💰\n\nOu acesse agora: " + siteLink;
    } else if (text.includes('cardápio') || text.includes('menu') || text.includes('lista') || text.includes('opções')) {
        response = "😋 *Bateu aquela fome?* Temos os melhores lanches artesanais, porções generosas e bebidas geladinhas!\n\nConfira nosso cardápio completo e atualizado com fotos aqui: " + siteLink;
    } else if (text.includes('pedido') || text.includes('pedir') || text.includes('comprar') || text.includes('quero um')) {
        response = "🚀 *É pra já!* Fazer seu pedido é super simples e rápido:\n1. Acesse: " + siteLink + "\n2. Escolha seus itens favoritos\n3. Finalize no checkout e pronto!\n\nEstamos aguardando seu pedido! 🍔";
    } else if (text.includes('horário') || text.includes('horas') || text.includes('aberto') || text.includes('fecha') || text.includes('atendimento')) {
        response = "🕒 *Nosso Horário de Atendimento:*\n📅 Todos os dias\n⏰ Das *15:00 às 23:00*\n\nVocê pode conferir se estamos aceitando pedidos agora no nosso site: " + siteLink;
    } else if (text.includes('entrega') || text.includes('taxa') || text.includes('frete') || text.includes('entregam')) {
        response = "🛵 *Sobre Entregas:*\nEntregamos em toda a região! A taxa de entrega é calculada automaticamente com base na sua localização ao finalizar o pedido no site.\n\nConsulte os valores aqui: " + siteLink;
    } else if (text.includes('pagamento') || text.includes('cartão') || text.includes('pix') || text.includes('dinheiro') || text.includes('paga')) {
        response = "💰 *Formas de Pagamento Aceitas:*\n✅ Pix (com aprovação automática)\n✅ Cartão de Crédito/Débito\n✅ Dinheiro (com opção de troco)\n\nEscolha sua preferência no site: " + siteLink;
    } else if (text.includes('endereço') || text.includes('onde') || text.includes('local') || text.includes('rua') || text.includes('fica')) {
        response = "📍 *Onde estamos:*\nLocalizados na *Rua Nicaragua, 354*.\n\nTrabalhamos principalmente com Delivery e Retirada. Peça online: " + siteLink;
    } else if (text.includes('recomendação') || text.includes('melhor') || text.includes('mais vendido') || text.includes('indica')) {
        response = "🌟 *Nossos Campeões de Venda:*\n1. *X-Panças Especial* (O queridinho da galera!)\n2. *Combo Família* (Ideal para compartilhar)\n3. *Batata com Cheddar e Bacon*\n\nVeja as fotos dessas delícias no site: " + siteLink;
    } else if (text.includes('cupom') || text.includes('promoção') || text.includes('desconto')) {
        response = "🎁 *Quer desconto?*\nFique de olho no nosso site! Sempre postamos cupons e promoções relâmpago por lá.\n\nAproveite agora: " + siteLink;
    } else {
        // Resposta padrão curta apenas para evitar deixar o cliente no vácuo
        if (text.length > 0 && text.length < 50) {
            response = "🤖 *Eu sou a IA do Panças Lanches!*\nNão entendi sua dúvida, mas você pode encontrar TUDO (preços, cardápio, pedidos e horários) no nosso site oficial:\n" + siteLink;
        }
    }

    if (response) {
        try {
            await msg.reply(response);
        } catch (e) {
            console.error('❌ [WA] Erro ao responder mensagem:', e);
        }
    }
});

client.initialize();

// Helper to send WhatsApp messages
async function sendWAMessage(number, text) {
    if (!whatsappConnected) {
        console.log('⚠️ [WA] WhatsApp não conectado. Mensagem não enviada.');
        return;
    }
    try {
        // Limpa o número: remove tudo que não é dígito
        let cleanNumber = number.replace(/\D/g, '');
        
        // Garante que o número brasileiro tenha o 55 no início
        if (!cleanNumber.startsWith('55')) {
            cleanNumber = '55' + cleanNumber;
        }

        // Tenta encontrar o ID do WhatsApp (trata o problema do 9º dígito automaticamente)
        const contactId = await client.getNumberId(cleanNumber);
        
        if (contactId) {
            await client.sendMessage(contactId._serialized, text);
            console.log(`✅ [WA] Mensagem enviada para: ${contactId._serialized}`);
        } else {
            // Fallback caso getNumberId falhe
            const chatId = `${cleanNumber}@c.us`;
            await client.sendMessage(chatId, text);
            console.log(`✅ [WA] Mensagem enviada via fallback para: ${chatId}`);
        }
    } catch (err) {
        console.error('❌ [WA] Erro ao enviar mensagem:', err);
    }
}

// Database Setup
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT,
        client_whatsapp TEXT,
        address TEXT,
        payment_method TEXT,
        items TEXT,
        total REAL,
        status TEXT DEFAULT '🟡 Novo',
        coupon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (!err) {
            // Garante que a coluna 'coupon' exista caso a tabela já tenha sido criada anteriormente sem ela
            db.run(`ALTER TABLE orders ADD COLUMN coupon TEXT`, (alterErr) => {
                if (alterErr) {
                    // console.log("Coluna coupon já existe ou erro ao adicionar.");
                } else {
                    console.log("✅ Coluna 'coupon' adicionada à tabela 'orders'.");
                }
            });
        }
    });

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        category TEXT,
        image TEXT,
        description TEXT
    )`, () => {
        // Initial Seed
        db.get("SELECT count(*) as count FROM products", (err, row) => {
            if (row.count === 0) {
                const initialProducts = [
                    // X'S DO PANÇA
                    ['Misto Quente', 10.00, 'burger', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, presunto e muçarela.'],
                    ['Panças Burguer', 13.00, 'burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, hambúrguer artesanal, presunto e muçarela.'],
                    ['Panças Salada', 17.00, 'burger', 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, hambúrguer artesanal, presunto e muçarela.'],
                    ['Salada Especial do Pança', 19.00, 'burger', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, cebola caramelizada, hambúrguer artesanal, presunto e muçarela.'],
                    ['Panças EGG', 19.00, 'burger', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, hambúrguer artesanal, ovo, presunto e muçarela.'],
                    ['Panças Frango', 19.00, 'burger', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, frango em cubos, presunto e muçarela.'],
                    ['Panças Calabresa', 20.00, 'burger', 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, hambúrguer artesanal, calabresa, presunto e muçarela.'],
                    ['Panças Bacon', 22.00, 'burger', 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, hambúrguer artesanal, bacon, presunto e muçarela.'],
                    ['Bacon EGG do Pança', 24.00, 'burger', 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, hambúrguer artesanal, bacon, ovo, presunto e muçarela.'],
                    
                    // ESPECIAL DO PANÇA
                    ['CatuFrango do Pança', 22.00, 'special', 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, frango em cubos, catupiry, presunto e muçarela.'],
                    ['Especial do Pança', 24.00, 'special', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, hambúrguer artesanal, cebola caramelizada, bacon e cheddar.'],
                    ['Alcatra do Pança', 26.00, 'special', 'https://images.unsplash.com/photo-1582196016295-f8c499b3a7f1?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, alcatra em tiras, cebola caramelizada, presunto e muçarela.'],
                    ['Especial do Pança (DUPLO)', 28.00, 'special', 'https://images.unsplash.com/photo-1534790566855-4cb788d389ec?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, 2 hambúrguer artesanal, cebola caramelizada, bacon e cheddar.'],
                    ['Robusto do Pança (TUDO)', 32.00, 'special', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, hambúrguer artesanal, bacon, ovo, calabresa, presunto e muçarela.'],
                    ['Supremo do Pança', 36.00, 'special', 'https://images.unsplash.com/photo-1550317144-b3bfc503d736?q=80&w=800&auto=format&fit=crop', 'Pão, maionese da casa, alface, tomate, milho, hambúrguer artesanal, bacon, ovo, calabresa, salsicha, frango desfiado, presunto e muçarela.'],
                    
                    // PORÇÕES
                    ['Batata Frita (Meia 350g)', 22.00, 'portion', 'https://images.unsplash.com/photo-1573082810397-59c9f4a3aa6c?q=80&w=800&auto=format&fit=crop', 'Meia porção de batata frita crocante (350g).'],
                    ['Batata Frita (Inteira 700g)', 35.00, 'portion', 'https://images.unsplash.com/photo-1573082810397-59c9f4a3aa6c?q=80&w=800&auto=format&fit=crop', 'Porção inteira de batata frita crocante (700g).'],
                    ['Batata Frita c/ Bacon e Cheddar (Meia)', 30.00, 'portion', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop', 'Meia porção de fritas com bacon crocante e cheddar cremoso.'],
                    ['Batata Frita c/ Bacon e Cheddar (Inteira)', 42.00, 'portion', 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop', 'Porção inteira de fritas com bacon crocante e cheddar cremoso.'],
                    ['Mandioca Frita (palito) 500g', 30.00, 'portion', 'https://images.unsplash.com/photo-1628191139360-4083564d03fd?q=80&w=800&auto=format&fit=crop', 'Mandioca frita sequinha e crocante (500g).'],
                    ['Anel de Cebola 500g', 30.00, 'portion', 'https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=800&auto=format&fit=crop', 'Anéis de cebola empanados e fritos (500g).'],
                    ['Frango Frito (Filé Panko) 450g', 37.00, 'portion', 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop', 'Filé de frango suculento empanado na farinha panko (450g).'],
                    ['Filé de Tilápia (Panko) 450g', 50.00, 'portion', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=800&auto=format&fit=crop', 'Filé de tilápia empanado na farinha panko (450g).'],
                    
                    // SOBREMESAS
                    ['Copo de Mini Churros (10 unid)', 15.00, 'dessert', 'https://images.unsplash.com/photo-1571931903392-749360e40854?q=80&w=800&auto=format&fit=crop', '10 unidades de mini churros recheados com doce de leite.'],

                    // ADICIONAL
                    ['Adicional Fritas no Lanche', 6.00, 'special', 'https://images.unsplash.com/photo-1573082810397-59c9f4a3aa6c?q=80&w=800&auto=format&fit=crop', 'Adicione uma porção de fritas extra dentro do seu lanche.'],

                    // BEBIDAS (EXISTENTES)
                    ['Coca Cola 2 Litros', 14.00, 'drink', 'https://www.extrabom.com.br/uploads/produtos/full/80242_coca_cola_2l.jpg', 'Garrafa de 2 litros gelada.'],
                    ['Coca Cola Lata', 6.00, 'drink', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800&auto=format&fit=crop', 'Lata de 350ml gelada.'],
                    ['Fanta 2 Litros', 12.00, 'drink', 'https://www.extrabom.com.br/uploads/produtos/full/80248_fanta_laranja_2l.jpg', 'Garrafa de 2 litros gelada.'],
                    ['Fanta Lata', 6.00, 'drink', 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?q=80&w=800&auto=format&fit=crop', 'Lata de 350ml gelada.']
                ];
                const stmt = db.prepare("INSERT INTO products (name, price, category, image, description) VALUES (?, ?, ?, ?, ?)");
                initialProducts.forEach(p => stmt.run(p));
                stmt.finalize();
            }
        });
    });

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`, () => {
        db.get("SELECT count(*) as count FROM settings", (err, row) => {
            if (row.count === 0) {
                db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['store_logo', 'https://file-service.trae.ai/file/trae-ai/clz1qmfkt0001gllo6khynatv']);
                db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['store_name', 'PANÇAS LANCHES']);
                db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['store_status', 'Aberto']); // Aberto ou Fechado
            } else {
                // Garante que o status inicial da loja exista mesmo se a tabela já tinha dados
                db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ['store_status', 'Aberto']);
            }
        });
    });

    // Coupons table
    db.run(`CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        type TEXT, -- 'percent' ou 'bogo' (buy one get one)
        value REAL, -- valor do desconto se for percent
        active INTEGER DEFAULT 1
    )`);
});

// Routes
app.get('/api/whatsapp-status', (req, res) => {
    res.json({ connected: whatsappConnected, qr: lastQr });
});

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/stats', (req, res) => {
    db.all(`
        SELECT 
            COUNT(*) as totalOrders,
            SUM(total) as totalRevenue,
            (SELECT COUNT(*) FROM orders WHERE status = '🟢 Entregue') as completedOrders,
            (SELECT COUNT(*) FROM orders WHERE status = '🟡 Novo') as pendingOrders
        FROM orders
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
});

app.get('/api/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const { name, price, category, image, description } = req.body;
    db.run("INSERT INTO products (name, price, category, image, description) VALUES (?, ?, ?, ?, ?)", [name, price, category, image, description], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('products_updated');
        res.status(201).json({ id: this.lastID, name, price, category, image, description });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('products_updated');
        res.json({ deleted: this.changes });
    });
});

app.put('/api/products/:id', (req, res) => {
    const { name, price, category, image, description } = req.body;
    const { id } = req.params;
    db.run(
        "UPDATE products SET name = ?, price = ?, category = ?, image = ?, description = ? WHERE id = ?",
        [name, price, category, image, description, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('products_updated');
            res.json({ updated: this.changes });
        }
    );
});

app.post('/api/orders', (req, res) => {
    const { client_name, client_whatsapp, address, payment_method, items, total, coupon } = req.body;
    const query = `INSERT INTO orders (client_name, client_whatsapp, address, payment_method, items, total, coupon) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [client_name, client_whatsapp, address, payment_method, JSON.stringify(items), total, coupon], function(err) {
        if (err) {
            console.error('❌ [DB] Erro ao salvar pedido:', err);
            return res.status(500).json({ error: err.message });
        }
        
        const orderId = this.lastID;
        const newOrder = {
            id: orderId,
            client_name,
            client_whatsapp,
            address,
            payment_method,
            items,
            total,
            coupon,
            status: '🟡 Novo',
            created_at: new Date()
        };
        
        // Retorna a resposta IMEDIATAMENTE para o cliente não ficar esperando
        res.status(201).json(newOrder);

        // Processa as notificações em segundo plano (background)
        setTimeout(async () => {
            try {
                io.emit('new_order', newOrder);

                // FORMATAÇÃO DOS ITENS PARA WHATSAPP
                const itemsList = items.map(i => `✅ *${i.quantity}x* ${i.name}`).join('\n');

                // AUTO NOTIFY CLIENT (New Order)
                let clientMsg = `🍔 *PANÇAS LANCHES* 🍔\n`;
                clientMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                clientMsg += `✅ *PEDIDO RECEBIDO COM SUCESSO!*\n\n`;
                clientMsg += `Olá *${client_name}*, recebemos seu pedido *#${orderId}*.\n\n`;
                clientMsg += `📦 *SEU PEDIDO:*\n${itemsList}\n\n`;
                clientMsg += `💰 *TOTAL:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
                clientMsg += `💳 *PAGAMENTO:* ${payment_method}\n`;
                clientMsg += `🕒 *PREVISÃO:* 40 a 60 minutos\n`;
                clientMsg += `📍 *ENTREGA:* ${address}\n\n`;
                
                if (payment_method === 'Pix') {
                    clientMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                    clientMsg += `💠 *PAGAMENTO PIX*\n`;
                    clientMsg += `Chave: *44988601067*\n\n`;
                    clientMsg += `⚠️ *IMPORTANTE:* Envie o comprovante aqui no nosso privado para agilizarmos sua entrega!\n`;
                }
                
                clientMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                clientMsg += `🛵 *Acompanhe seu pedido aqui:* (Link abaixo)\n`;
                clientMsg += `*Obrigado pela preferência!*`;
                
                sendWAMessage(client_whatsapp, clientMsg);

                // AUTO NOTIFY OWNER (New Order)
                if (whatsappConnected && client.info) {
                    let ownerMsg = `🔔 *NOVO PEDIDO CHEGOU!* 🔔\n`;
                    ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                    ownerMsg += `🆔 *ID:* #${orderId}\n`;
                    ownerMsg += `👤 *CLIENTE:* ${client_name}\n`;
                    ownerMsg += `📦 *ITENS:*\n${itemsList}\n\n`;
                    ownerMsg += `💰 *TOTAL:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
                    ownerMsg += `💳 *PAGAMENTO:* ${payment_method}\n`;
                    ownerMsg += `📍 *ENDEREÇO:* ${address}\n`;
                    ownerMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
                    ownerMsg += `_Veja os detalhes no painel admin!_`;
                    
                    client.sendMessage(client.info.wid._serialized, ownerMsg);
                    console.log(`✅ [WA] Notificação de novo pedido enviada para o Dono (${client.info.wid.user})`);
                }
            } catch (notifyErr) {
                console.error('❌ [WA] Erro ao processar notificações em background:', notifyErr);
            }
        }, 0);
    });
});

app.patch('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Retorna a resposta IMEDIATAMENTE
        res.json({ id, status });

        // Processa notificações em background
        setTimeout(() => {
            io.emit('status_updated', { id, status });

            db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order) => {
                if (!err && order) {
                    let msg = "";
                    try {
                        const itemsList = JSON.parse(order.items).map(i => `✅ *${i.quantity}x* ${i.name}`).join('\n');
                        
                        if (status === '🟣 Saiu para entrega') {
                            msg = `🛵 *SAIU PARA ENTREGA!* 🛵\n`;
                            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                            msg += `Olá *${order.client_name}*, seu pedido *#${order.id}* está a caminho!\n\n`;
                            msg += `📦 *RESUMO DO PEDIDO:*\n${itemsList}\n\n`;
                            msg += `🕒 *TEMPO ESTIMADO:* 15-25 min\n`;
                            msg += `📍 *ENTREGA EM:* ${order.address}\n`;
                            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                            msg += `_Fique atento ao seu portão!_\n`;
                            msg += `*Panças Lanches agradece!*`;
                        } else if (status === '🟢 Entregue') {
                            msg = `✅ *PEDIDO ENTREGUE!* ✅\n`;
                            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                            msg += `Olá *${order.client_name}*, seu pedido *#${order.id}* foi finalizado.\n\n`;
                            msg += `🍔 Esperamos que você goste do seu lanche!\n`;
                            msg += `⭐ Se puder, nos avalie no WhatsApp!\n`;
                            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
                            msg += `*Bom apetite! 😋*`;
                        }

                        if (msg) {
                            sendWAMessage(order.client_whatsapp, msg);
                        }
                    } catch (e) {
                        console.error('❌ [WA] Erro ao formatar mensagem de status:', e);
                    }
                }
            });
        }, 0);
    });
});

app.get('/api/orders/:id', (req, res) => {
    db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Order not found' });
        res.json(row);
    });
});

app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('settings_updated', { key, value });
        res.json({ success: true });
    });
});

// Coupons Routes
app.get('/api/coupons', (req, res) => {
    db.all("SELECT * FROM coupons WHERE active = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/coupons', (req, res) => {
    const { code, type, value } = req.body;
    db.run("INSERT INTO coupons (code, type, value) VALUES (?, ?, ?)", [code.toUpperCase(), type, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.delete('/api/coupons/:id', (req, res) => {
    db.run("UPDATE coupons SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/coupons/:code', (req, res) => {
    db.get("SELECT * FROM coupons WHERE code = ? AND active = 1", [req.params.code.toUpperCase()], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupom não encontrado' });
        res.json(row);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
