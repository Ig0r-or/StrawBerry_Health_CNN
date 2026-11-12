const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiagnosticoMeteorologico = sequelize.define('DiagnosticoMeteorologico', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  local_plantio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'locais_plantio',
      key: 'id'
    }
  },
  temperatura: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false
  },
  umidade: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false
  },
  alerta_geada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  condicao: {
    type: DataTypes.STRING(80),
    allowNull: true
  }
}, {
  tableName: 'diagnosticos_meteorologicos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = DiagnosticoMeteorologico;
