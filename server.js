require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

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
