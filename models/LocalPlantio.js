const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocalPlantio = sequelize.define('LocalPlantio', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do local ou talhão é obrigatório.' },
      len: { args: [3, 120], msg: 'O nome deve ter pelo menos 3 caracteres.' }
    }
  },
  cultivar: {
    type: DataTypes.STRING(80),
    allowNull: true,
    defaultValue: 'San Andreas'
  },
  area_hectares: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    defaultValue: 0.50
  },
  cep: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: 'Pouso Alegre'
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: false,
    defaultValue: 'MG'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'locais_plantio',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = LocalPlantio;
