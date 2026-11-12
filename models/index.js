const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const LocalPlantio = require('./LocalPlantio');
const DiagnosticoMorango = require('./DiagnosticoMorango');
const UsuarioDiagnostico = require('./UsuarioDiagnostico');
const DiagnosticoMeteorologico = require('./DiagnosticoMeteorologico');
const ProdutoLavoura = require('./ProdutoLavoura');

// Relacionamento 1:N -> Usuário possui vários Locais de Plantio
Usuario.hasMany(LocalPlantio, {
  foreignKey: 'usuario_id',
  as: 'locaisPlantio',
  onDelete: 'CASCADE'
});
LocalPlantio.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

// Relacionamento N:N -> Usuários e Diagnósticos por foto através de UsuarioDiagnostico
Usuario.belongsToMany(DiagnosticoMorango, {
  through: UsuarioDiagnostico,
  foreignKey: 'usuario_id',
  otherKey: 'diagnostico_id',
  as: 'diagnosticos'
});
DiagnosticoMorango.belongsToMany(Usuario, {
  through: UsuarioDiagnostico,
  foreignKey: 'diagnostico_id',
  otherKey: 'usuario_id',
  as: 'usuarios'
});

// Relacionamento 1:N -> Local de Plantio recebe leituras Meteorológicas
LocalPlantio.hasMany(DiagnosticoMeteorologico, {
  foreignKey: 'local_plantio_id',
  as: 'diagnosticosMeteorologicos',
  onDelete: 'CASCADE'
});
DiagnosticoMeteorologico.belongsTo(LocalPlantio, {
  foreignKey: 'local_plantio_id',
  as: 'localPlantio'
});

module.exports = {
  sequelize,
  Usuario,
  LocalPlantio,
  DiagnosticoMorango,
  UsuarioDiagnostico,
  DiagnosticoMeteorologico,
  ProdutoLavoura
};
