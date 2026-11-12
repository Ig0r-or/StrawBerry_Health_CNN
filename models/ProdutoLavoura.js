const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProdutoLavoura = sequelize.define('ProdutoLavoura', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do produto é obrigatório.' }
    }
  },
  categoria: {
    type: DataTypes.STRING(80),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A categoria do produto é obrigatória.' }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  indicacao: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'produtos_lavoura',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = ProdutoLavoura;
