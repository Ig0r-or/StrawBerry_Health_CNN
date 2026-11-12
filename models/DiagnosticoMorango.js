const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiagnosticoMorango = sequelize.define('DiagnosticoMorango', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  imagem_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  resultado: {
    type: DataTypes.STRING(60),
    allowNull: false // 'saudavel', 'deficiencia_calcio', 'queima_foliar', 'folha_velha', 'nao_conclusivo'
  },
  confianca: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  orientacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  acertou: {
    type: DataTypes.BOOLEAN,
    allowNull: true // Preenchido no feedback pelo produtor
  }
}, {
  tableName: 'diagnosticos_morango',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = DiagnosticoMorango;
