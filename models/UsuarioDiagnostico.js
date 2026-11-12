const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsuarioDiagnostico = sequelize.define('UsuarioDiagnostico', {
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
  diagnostico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'diagnosticos_morango',
      key: 'id'
    }
  },
  observacoes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'usuario_diagnosticos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em'
});

module.exports = UsuarioDiagnostico;
