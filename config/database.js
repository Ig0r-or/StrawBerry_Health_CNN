const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'berryhealth_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Padrão: SQLite para desenvolvimento ágil e demonstração sem dependência externa
  const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  let storagePath;

  if (isServerless) {
    // No Netlify / Serverless, o disco raiz é somente-leitura; apenas /tmp permite gravação
    storagePath = path.join('/tmp', 'database.sqlite');
    const sourceDb = path.resolve(__dirname, '..', 'database.sqlite');
    if (!fs.existsSync(storagePath) && fs.existsSync(sourceDb)) {
      try {
        fs.copyFileSync(sourceDb, storagePath);
        console.log('✅ Banco de dados seed inicializado em /tmp para ambiente Serverless');
      } catch (e) {
        console.warn('Aviso: Não foi possível copiar banco para /tmp:', e);
      }
    }
  } else {
    storagePath = path.resolve(__dirname, '..', process.env.DB_STORAGE || 'database.sqlite');
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
}

module.exports = sequelize;
