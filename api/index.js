const app = require('../app');
const { sequelize } = require('../models');

let dbInitPromise = null;

async function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.authenticate().then(() => sequelize.sync());
  }
  return dbInitPromise;
}

module.exports = async (req, res) => {
  try {
    await initDB();
    return app(req, res);
  } catch (error) {
    console.error('Erro na função Vercel:', error);
    res.status(500).send(`<h2>Erro no servidor (Vercel Serverless)</h2><p>${error.message}</p>`);
  }
};
