const serverless = require('serverless-http');
const app = require('../../app');
const { sequelize } = require('../../models');

let dbInitPromise = null;

async function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = sequelize.authenticate().then(() => sequelize.sync());
  }
  return dbInitPromise;
}

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  // Configuração para não esperar event loop esvaziar
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await initDB();
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('Erro na execução da função serverless:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<h2>Erro no servidor (Netlify Function)</h2><p>${error.message}</p>`
    };
  }
};
