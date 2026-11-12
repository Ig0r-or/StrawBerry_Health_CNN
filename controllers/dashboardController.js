const { Usuario, LocalPlantio, DiagnosticoMorango } = require('../models');

// GET /dashboard ou /
exports.renderDashboard = async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const isAdmin = req.session.usuario.perfil === 'admin';

    // Contadores para o resumo do dashboard
    const totalLocais = await LocalPlantio.count({
      where: isAdmin ? {} : { usuario_id: usuarioId }
    });

    const usuario = await Usuario.findByPk(usuarioId, {
      include: [
        {
          model: DiagnosticoMorango,
          as: 'diagnosticos'
        }
      ]
    });

    const totalDiagnosticos = usuario && usuario.diagnosticos ? usuario.diagnosticos.length : 0;

    // Últimos locais cadastrados
    const ultimosLocais = await LocalPlantio.findAll({
      where: isAdmin ? {} : { usuario_id: usuarioId },
      order: [['criado_em', 'DESC']],
      limit: 3
    });

    res.render('dashboard/index', {
      pageTitle: 'Painel Geral | BerryHealth AI',
      totalLocais,
      totalDiagnosticos,
      ultimosLocais,
      isAdmin
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    req.flash('erro', 'Erro ao carregar o painel geral.');
    res.render('dashboard/index', {
      pageTitle: 'Painel Geral | BerryHealth AI',
      totalLocais: 0,
      totalDiagnosticos: 0,
      ultimosLocais: [],
      isAdmin: false
    });
  }
};

// GET /perfil
exports.renderPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.session.usuario.id);
    res.render('perfil/index', {
      pageTitle: 'Meu Perfil | BerryHealth AI',
      usuario
    });
  } catch (error) {
    console.error('Erro ao abrir perfil:', error);
    req.flash('erro', 'Não foi possível carregar as informações do perfil.');
    res.redirect('/dashboard');
  }
};

// POST /perfil
exports.atualizarPerfil = async (req, res) => {
  try {
    const { nome, telefone, cidade, estado } = req.body;
    const usuario = await Usuario.findByPk(req.session.usuario.id);

    if (!usuario) {
      req.flash('erro', 'Usuário não encontrado.');
      return res.redirect('/login');
    }

    if (!nome || nome.trim().length < 3) {
      req.flash('erro', 'O nome deve ter no mínimo 3 caracteres.');
      return res.redirect('/perfil');
    }

    await usuario.update({
      nome: nome.trim(),
      telefone: telefone ? telefone.trim() : null,
      cidade: cidade ? cidade.trim() : 'Pouso Alegre',
      estado: estado ? estado.trim().toUpperCase() : 'MG'
    });

    // Atualiza dados na sessão
    req.session.usuario.nome = usuario.nome;
    req.session.usuario.cidade = usuario.cidade;
    req.session.usuario.estado = usuario.estado;

    req.flash('sucesso', 'Seus dados de perfil foram atualizados com sucesso!');
    return res.redirect('/perfil');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    req.flash('erro', 'Erro ao atualizar dados do perfil.');
    return res.redirect('/perfil');
  }
};
