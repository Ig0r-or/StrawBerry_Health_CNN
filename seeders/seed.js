const bcrypt = require('bcryptjs');
const {
  sequelize,
  Usuario,
  LocalPlantio,
  DiagnosticoMorango,
  DiagnosticoMeteorologico,
  ProdutoLavoura
} = require('../models');

async function popularBanco() {
  try {
    console.log('🌱 Iniciando processo de seed do BerryHealth AI...');
    await sequelize.sync({ force: true }); // Recria as tabelas limpas para garantir o estado ideal

    const salt = await bcrypt.genSalt(10);
    const senhaAdmin = await bcrypt.hash('admin123', salt);
    const senhaProdutor = await bcrypt.hash('produtor123', salt);

    // 1. Criar Usuários (Admin e Produtor)
    const admin = await Usuario.create({
      nome: 'Administrador UNIVÁS',
      email: 'admin@berryhealth.com',
      senha_hash: senhaAdmin,
      perfil: 'admin',
      telefone: '(35) 99999-0001',
      cidade: 'Pouso Alegre',
      estado: 'MG'
    });

    const produtor = await Usuario.create({
      nome: 'Cezar Vitor Leite Junior',
      email: 'produtor@berryhealth.com',
      senha_hash: senhaProdutor,
      perfil: 'comum',
      telefone: '(35) 99888-1234',
      cidade: 'Pouso Alegre',
      estado: 'MG'
    });

    console.log('✅ Usuários de teste criados com sucesso.');

    // 2. Criar Locais de Plantio vinculados ao Produtor (Relacionamento 1:N)
    const local1 = await LocalPlantio.create({
      usuario_id: produtor.id,
      nome: 'Talhão 01 - Estufa Alta Sul',
      cultivar: 'San Andreas',
      area_hectares: 0.85,
      cep: '37550-000',
      cidade: 'Pouso Alegre',
      estado: 'MG',
      latitude: -22.2301,
      longitude: -45.9347,
      observacoes: 'Cultivo em substrato suspenso, fertirrigação automatizada e malha termo-refletora.'
    });

    const local2 = await LocalPlantio.create({
      usuario_id: produtor.id,
      nome: 'Talhão 02 - Encosta da Mantiqueira',
      cultivar: 'Albion',
      area_hectares: 1.20,
      cep: '37542-000',
      cidade: 'Estiva',
      estado: 'MG',
      latitude: -22.4633,
      longitude: -46.0192,
      observacoes: 'Solo corrigido com calcário dolomítico e mulching plástico preto e branco.'
    });

    const local3 = await LocalPlantio.create({
      usuario_id: produtor.id,
      nome: 'Talhão 03 - Bancada Hidropônica',
      cultivar: 'Camino Real',
      area_hectares: 0.40,
      cep: '37567-000',
      cidade: 'Espírito Santo do Dourado',
      estado: 'MG',
      latitude: -22.0354,
      longitude: -45.9723,
      observacoes: 'Produção em semi-hidroponia protegida com controle rigoroso de CE e pH.'
    });

    console.log('✅ Locais de plantio (1:N) cadastrados com sucesso.');

    // 3. Criar Diagnósticos e associar ao usuário (Relacionamento N:N)
    const diag1 = await DiagnosticoMorango.create({
      imagem_url: '/uploads/exemplo-saudavel.jpg',
      resultado: 'saudavel',
      confianca: 99.4,
      orientacao: 'Nenhum sinal de problema nesta folha. Continue o monitoramento de rotina.',
      acertou: true
    });

    const diag2 = await DiagnosticoMorango.create({
      imagem_url: '/uploads/exemplo-calcio.jpg',
      resultado: 'deficiencia_calcio',
      confianca: 96.8,
      orientacao: 'Geralmente decorre de falha no transporte do cálcio até a folha nova. Verifique irrigação regular.',
      acertou: true
    });

    await produtor.addDiagnostico(diag1, {
      through: { observacoes: 'Primeiro diagnóstico de rotina realizado na Estufa 01' }
    });
    await produtor.addDiagnostico(diag2, {
      through: { observacoes: 'Suspeita confirmada em folha basal' }
    });

    console.log('✅ Diagnósticos e associações N:N criados com sucesso.');

    // 4. Criar Diagnóstico Meteorológico (1:N com LocalPlantio)
    await DiagnosticoMeteorologico.create({
      local_plantio_id: local1.id,
      temperatura: 14.8,
      umidade: 86.5,
      alerta_geada: false,
      condicao: 'Céu limpo com orvalho intenso'
    });

    // 5. Criar Produtos para a Lavoura (Entidade do Catálogo)
    await ProdutoLavoura.bulkCreate([
      {
        nome: 'Nitrato de Cálcio Hortifrúti Especial',
        categoria: 'Fertilizante Foliar e Fertirrigação',
        descricao: 'Fornece cálcio 100% solúvel e nitrogênio nítrico de rápida assimilação para prevenir o tipburn.',
        indicacao: 'Pulverização foliar nas brotações jovens e fertirrigação.'
      },
      {
        nome: 'Bacillus subtilis Bio-Fungicida',
        categoria: 'Controle Biológico',
        descricao: 'Agente microbiológico preventivo contra mancha foliar, queima e mofo cinzento no morango.',
        indicacao: 'Aplicação semanal preventiva em dias com umidade superior a 80%.'
      },
      {
        nome: 'Trichoderma harzianum WP',
        categoria: 'Condicionador Biológico de Solo',
        descricao: 'Fortalece o sistema radicular e combate patógenos de solo que prejudicam a absorção de nutrientes.',
        indicacao: 'Aplicação no plantio das mudas e pós-toalete.'
      }
    ]);

    console.log('✅ Catálogo de insumos e dados meteorológicos cadastrados com sucesso!');
    console.log('\n🎉 BANCO DE DADOS POPULADO COM SUCESSO!');
    console.log('----------------------------------------------------');
    console.log('👤 Usuário Produtor: produtor@berryhealth.com | Senha: produtor123');
    console.log('👑 Usuário Admin:    admin@berryhealth.com    | Senha: admin123');
    console.log('----------------------------------------------------\n');

    return true;
  } catch (error) {
    console.error('❌ Erro durante o seed do banco de dados:', error);
    throw error;
  }
}

module.exports = popularBanco;

if (require.main === module) {
  popularBanco()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
