const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { injectLocals } = require('./middlewares/auth');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const localRoutes = require('./routes/localRoutes');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para parsing de requisições
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estáticos (CSS, imagens, uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de Sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'berryhealth_default_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
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
  // Renderiza página de erro 404 limpa
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

// Inicialização do Banco e do Servidor
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o Banco de Dados estabelecida com sucesso!');

    // Sincroniza tabelas no banco
    await sequelize.sync();
    console.log('✅ Todas as tabelas e relacionamentos foram sincronizados.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🍓 BerryHealth AI rodando com sucesso na porta ${PORT}!`);
      console.log(`🌐 Acesse em: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

iniciarServidor();
