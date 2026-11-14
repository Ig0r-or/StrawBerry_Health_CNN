const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { injectLocals } = require('./middlewares/auth');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const localRoutes = require('./routes/localRoutes');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');

const app = express();

// Configuração da View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para parsing de requisições
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Servir uploads no Netlify / Vercel / Serverless a partir de /tmp/uploads
const isServerless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (isServerless) {
  const tmpUploads = path.join('/tmp', 'uploads');
  if (!fs.existsSync(tmpUploads)) {
    fs.mkdirSync(tmpUploads, { recursive: true });
  }
  app.use('/uploads', express.static(tmpUploads));
}

// Configuração de Sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'berryhealth_default_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      httpOnly: true,
      secure: false
    }
  })
);

// Flash messages
app.use(flash());

// Injeção de variáveis globais nas views
app.use(injectLocals);

// Definição das Rotas
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/locais', localRoutes);
app.use('/diagnostico', diagnosticoRoutes);

// Rota 404 Amigável
app.use((req, res) => {
  res.status(404).render('partials/head', { pageTitle: 'Página Não Encontrada | BerryHealth' });
});

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).send(`
    <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; border: 1px solid #eadadd; border-radius: 12px; text-align: center;">
      <h2 style="color: #c0213a;">Ops! Algo deu errado.</h2>
      <p style="color: #555;">Nossa equipe já foi notificada. Por favor, tente novamente em instantes.</p>
      <a href="/dashboard" style="display: inline-block; background: #c0213a; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none;">Voltar ao Início</a>
    </div>
  `);
});

module.exports = app;
