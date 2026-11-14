const app = require('../app');
const { sequelize, Usuario } = require('../models');
const popularBanco = require('../seeders/seed');

let initialized = false;
let initPromise = null;

// Middleware assíncrono para garantir banco pronto no Vercel antes de qualquer rota
app.use(async (req, res, next) => {
  if (!initialized) {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await sequelize.authenticate();
          await sequelize.sync();

          // Se o banco estiver vazio no ambiente serverless, roda o seed automaticamente
          const totalUsuarios = await Usuario.count();
          if (totalUsuarios === 0) {
            console.log('🌱 Banco vazio no Vercel. Inicializando dados de seed...');
            await popularBanco();
          }
          initialized = true;
          console.log('✅ Banco de dados pronto para requisições no Vercel.');
        } catch (err) {
          console.error('❌ Erro na inicialização do banco no Vercel:', err);
        }
      })();
    }
    await initPromise;
  }
  next();
});

module.exports = app;
