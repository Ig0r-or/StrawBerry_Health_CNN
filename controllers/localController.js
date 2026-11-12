const { Op } = require('sequelize');
const { LocalPlantio, Usuario } = require('../models');

// GET /locais -> Listagem com Busca, Filtro e Paginação
exports.listar = async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;
    const isAdmin = req.session.usuario.perfil === 'admin';

    const busca = (req.query.q || '').trim();
    const paginaAtual = parseInt(req.query.pagina) || 1;
    const limite = 6;
    const offset = (paginaAtual - 1) * limite;

    // Condição base: se não for admin, exibe apenas os locais do usuário logado
    const whereClause = isAdmin ? {} : { usuario_id: usuarioId };

    if (busca) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${busca}%` } },
        { cidade: { [Op.like]: `%${busca}%` } },
        { cultivar: { [Op.like]: `%${busca}%` } }
      ];
    }

    const { count, rows: locais } = await LocalPlantio.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['criado_em', 'DESC']],
      limit: limite,
      offset: offset
    });

    const totalPaginas = Math.ceil(count / limite) || 1;

    res.render('locais/index', {
      pageTitle: 'Meus Locais de Plantio | BerryHealth AI',
      locais,
      totalLocais: count,
      busca,
      paginaAtual,
      totalPaginas,
      isAdmin
    });
  } catch (error) {
    console.error('Erro ao listar locais de plantio:', error);
    req.flash('erro', 'Não foi possível carregar os locais de plantio.');
    res.redirect('/dashboard');
  }
};

// GET /locais/novo -> Formulário de criação
exports.renderNovo = (req, res) => {
  res.render('locais/novo', {
    pageTitle: 'Novo Local de Plantio | BerryHealth AI',
    local: {}
  });
};

// POST /locais -> Salva novo local no banco
exports.criar = async (req, res) => {
  try {
    const { nome, cultivar, area_hectares, cep, cidade, estado, latitude, longitude, observacoes } = req.body;
    const usuarioId = req.session.usuario.id;

    if (!nome || nome.trim().length < 3) {
      req.flash('erro', 'O nome do local/talhão deve ter pelo menos 3 caracteres.');
      return res.render('locais/novo', {
        pageTitle: 'Novo Local de Plantio | BerryHealth AI',
        local: req.body
      });
    }

    await LocalPlantio.create({
      usuario_id: usuarioId,
      nome: nome.trim(),
      cultivar: cultivar ? cultivar.trim() : 'San Andreas',
      area_hectares: area_hectares ? parseFloat(area_hectares) : 0.5,
      cep: cep ? cep.trim() : null,
      cidade: cidade ? cidade.trim() : 'Pouso Alegre',
      estado: estado ? estado.trim().toUpperCase() : 'MG',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      observacoes: observacoes ? observacoes.trim() : null
    });

    req.flash('sucesso', `Local de plantio "${nome}" cadastrado com sucesso!`);
    return res.redirect('/locais');
  } catch (error) {
    console.error('Erro ao cadastrar local:', error);
    req.flash('erro', 'Ocorreu um erro ao salvar o local de plantio.');
    return res.render('locais/novo', {
      pageTitle: 'Novo Local de Plantio | BerryHealth AI',
      local: req.body
    });
  }
};

// GET /locais/:id/editar -> Formulário de edição
exports.renderEditar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.session.usuario.id;
    const isAdmin = req.session.usuario.perfil === 'admin';

    const local = await LocalPlantio.findByPk(id);
    if (!local) {
      req.flash('erro', 'Local de plantio não encontrado.');
      return res.redirect('/locais');
    }

    // Validação de autorização: apenas o proprietário ou admin pode editar
    if (!isAdmin && local.usuario_id !== usuarioId) {
      req.flash('erro', 'Você não tem permissão para editar este local de plantio.');
      return res.redirect('/locais');
    }

    res.render('locais/editar', {
      pageTitle: `Editar ${local.nome} | BerryHealth AI`,
      local
    });
  } catch (error) {
    console.error('Erro ao abrir edição de local:', error);
    req.flash('erro', 'Erro ao carregar os dados do local.');
    res.redirect('/locais');
  }
};

// POST /locais/:id/editar -> Atualiza no banco
exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.session.usuario.id;
    const isAdmin = req.session.usuario.perfil === 'admin';
    const { nome, cultivar, area_hectares, cep, cidade, estado, latitude, longitude, observacoes } = req.body;

    const local = await LocalPlantio.findByPk(id);
    if (!local) {
      req.flash('erro', 'Local de plantio não encontrado.');
      return res.redirect('/locais');
    }

    if (!isAdmin && local.usuario_id !== usuarioId) {
      req.flash('erro', 'Você não tem permissão para modificar este local.');
      return res.redirect('/locais');
    }

    if (!nome || nome.trim().length < 3) {
      req.flash('erro', 'O nome do local/talhão deve ter pelo menos 3 caracteres.');
      return res.render('locais/editar', {
        pageTitle: `Editar ${local.nome} | BerryHealth AI`,
        local: { ...local.toJSON(), ...req.body }
      });
    }

    await local.update({
      nome: nome.trim(),
      cultivar: cultivar ? cultivar.trim() : local.cultivar,
      area_hectares: area_hectares ? parseFloat(area_hectares) : local.area_hectares,
      cep: cep ? cep.trim() : local.cep,
      cidade: cidade ? cidade.trim() : local.cidade,
      estado: estado ? estado.trim().toUpperCase() : local.estado,
      latitude: latitude ? parseFloat(latitude) : local.latitude,
      longitude: longitude ? parseFloat(longitude) : local.longitude,
      observacoes: observacoes ? observacoes.trim() : local.observacoes
    });

    req.flash('sucesso', `Local de plantio "${local.nome}" atualizado com sucesso!`);
    return res.redirect('/locais');
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    req.flash('erro', 'Erro ao salvar alterações no local.');
    return res.redirect(`/locais/${req.params.id}/editar`);
  }
};

// POST /locais/:id/excluir -> Exclui do banco
exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.session.usuario.id;
    const isAdmin = req.session.usuario.perfil === 'admin';

    const local = await LocalPlantio.findByPk(id);
    if (!local) {
      req.flash('erro', 'Local de plantio não encontrado.');
      return res.redirect('/locais');
    }

    if (!isAdmin && local.usuario_id !== usuarioId) {
      req.flash('erro', 'Você não tem permissão para remover este local de plantio.');
      return res.redirect('/locais');
    }

    const nomeExcluido = local.nome;
    await local.destroy();

    req.flash('sucesso', `Local de plantio "${nomeExcluido}" foi excluído com sucesso.`);
    return res.redirect('/locais');
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    req.flash('erro', 'Não foi possível excluir o local.');
    return res.redirect('/locais');
  }
};
