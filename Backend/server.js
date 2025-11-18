import express from "express";
import cors from "cors";
import rotas from "./router/routes.js";

//Cnfiguração de ambiente Railway

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_URL = IS_PRODUCTION 
  ? 'arandua1-production.up.railway.app'
  : 'http://localhost:3000';

console.log(`🌍 Ambiente: ${IS_PRODUCTION ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
console.log(`🔗 API URL: ${API_URL}`);


const app = express();

app.use(express.json()); // ← PARA JSON
app.use(express.urlencoded({ extended: true }));

// 🔥 MIDDLEWARE DE LOG MELHORADO
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`🕒 ${timestamp} | 📨 ${req.method} ${req.url}`);
    console.log(`📍 Origin: ${req.headers.origin}`);
    console.log(`👤 User-Agent: ${req.headers['user-agent']}`);
    
    // Log do body para POST requests
    if (req.method === 'POST' && req.body) {
        console.log(`📦 Body:`, JSON.stringify(req.body).substring(0, 200) + '...');
    }
    
    next();
});

const allowedOrigins = [
    'https://arandua1.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://localhost:5500',
    'https://127.0.0.1:5500'
];

// Configurar CORS
app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (como mobile apps ou curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`⚠️  Origem bloqueada pelo CORS: ${origin}`);
            callback(null, true); // Para desenvolvimento, permita todas
            // Para produção: callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


// 🔥 MIDDLEWARE DE LOG APÓS CORS
app.use((req, res, next) => {
    console.log(`✅ Requisição passou pelo CORS: ${req.method} ${req.url}`);
    next();
});

app.use("/", rotas);

// 🔥 ROTA DE TESTE SIMPLES (antes das outras)
app.get("/test", (req, res) => {
    console.log("🎯 ROTA /test ACESSADA!");
    res.json({ 
        message: "Servidor funcionando!",
        timestamp: new Date().toISOString(),
        success: true
    });
});

app.get("/health", (req, res) => {
    console.log("🏥 Health check acessado");
    res.json({ 
        status: "OK", 
        message: "Servidor funcionando perfeitamente!",
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    console.log("🚀 Rota raiz acessada");
    res.send("🚀 Servidor rodando com sucesso! CORS configurado.");
});

// 🔥 MIDDLEWARE DE ERRO MELHORADO
app.use((err, req, res, next) => {
    console.error("💥 ERRO NO SERVIDOR:", err);
    console.error("💥 Stack:", err.stack);
    res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor",
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Rota 404
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false,
        message: "Rota não encontrada",
        path: req.path 
    });
});

app.get('/postagens/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Termo de pesquisa não fornecido' });
        }
        
        // Buscar no banco de dados
        const resultados = await Postagem.find({
            $or: [
                { legenda: { $regex: q, $options: 'i' } },
                { 'autor.nome': { $regex: q, $options: 'i' } }
            ]
        }).populate('autor', 'nome');
        
        res.json(resultados);
    } catch (error) {
        console.error('Erro na pesquisa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get("/api/config", (req, res) => {
    res.json({
        apiUrl: API_URL,
        environment: IS_PRODUCTION ? 'production' : 'development',
        timestamp: new Date().toISOString()
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`✅ Servidor INICIADO na porta ${PORT}`);
    console.log(`🔧 CORS configurado para todas as origens`);
    console.log(`📦 Limite de payload: 50MB`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🎯 Test: http://localhost:${PORT}/test`);
    console.log(`=================================`);
});