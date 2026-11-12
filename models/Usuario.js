const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome é obrigatório.' },
      len: { args: [3, 120], msg: 'O nome deve ter entre 3 e 120 caracteres.' }
    }
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: {
      msg: 'Este e-mail já está cadastrado no sistema.'
    },
    validate: {
      isEmail: { msg: 'Informe um e-mail válido.' },
      notEmpty: { msg: 'O e-mail é obrigatório.' }
    }
  },
  senha_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  perfil: {
    type: DataTypes.ENUM('comum', 'admin'),
    defaultValue: 'comum',
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(80),
    allowNull: true,
    defaultValue: 'Pouso Alegre'
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true,
    defaultValue: 'MG'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = Usuario;
