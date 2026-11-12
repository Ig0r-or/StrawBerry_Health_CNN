const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

// GET /login
exports.renderLogin = (req, res) => {
  res.render('auth/login', {
    pageTitle: 'Entrar | BerryHealth AI'
  });
};

// POST /login
exports.postLogin = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      req.flash('erro', 'Por favor, preencha todos os campos.');
      return res.redirect('/login');
    }

    const usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!usuario) {
      req.flash('erro', 'E-mail ou senha incorretos.');
      return res.redirect('/login');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      req.flash('erro', 'E-mail ou senha incorretos.');
      return res.redirect('/login');
    }

    // Cria sessão do usuário
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      cidade: usuario.cidade,
      estado: usuario.estado
    };

    req.flash('sucesso', `Bem-vindo de volta, ${usuario.nome}!`);
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Erro no login:', error);
    req.flash('erro', 'Ocorreu um erro interno. Tente novamente mais tarde.');
    return res.redirect('/login');
  }
};

// GET /cadastro
exports.renderCadastro = (req, res) => {
  res.render('auth/cadastro', {
    pageTitle: 'Criar Conta | BerryHealth AI'
  });
};

// POST /cadastro
exports.postCadastro = async (req, res) => {
  try {
    const { nome, email, senha, confirmacao_senha, cidade, estado } = req.body;

    // Validações no backend com mensagens claras (Requisito obrigatório de Segurança)
    if (!nome || !email || !senha) {
      req.flash('erro', 'Todos os campos obrigatórios devem ser preenchidos.');
      return res.redirect('/cadastro');
    }

    if (senha.length < 6) {
      req.flash('erro', 'A senha deve conter no mínimo 6 caracteres.');
      return res.redirect('/cadastro');
    }

    if (senha !== confirmacao_senha) {
      req.flash('erro', 'As senhas informadas não coincidem.');
      return res.redirect('/cadastro');
    }

    const emailLimpo = email.trim().toLowerCase();
    const usuarioExistente = await Usuario.findOne({ where: { email: emailLimpo } });
    if (usuarioExistente) {
      req.flash('erro', 'Este endereço de e-mail já está em uso.');
      return res.redirect('/cadastro');
    }

    // Criptografia segura da senha com bcrypt
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // Primeiro usuário criado no sistema pode ser admin, caso queira
    const totalUsuarios = await Usuario.count();
    const perfil = totalUsuarios === 0 ? 'admin' : 'comum';

    const novoUsuario = await Usuario.create({
      nome: nome.trim(),
      email: emailLimpo,
      senha_hash,
      perfil,
      cidade: cidade ? cidade.trim() : 'Pouso Alegre',
      estado: estado ? estado.trim().toUpperCase() : 'MG'
    });

    // Inicia sessão automaticamente após cadastro
    req.session.usuario = {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      perfil: novoUsuario.perfil,
      cidade: novoUsuario.cidade,
      estado: novoUsuario.estado
    };

    req.flash('sucesso', `Conta criada com sucesso! Bem-vindo ao BerryHealth AI, ${novoUsuario.nome}.`);
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Erro no cadastro:', error);
    if (error.name === 'SequelizeValidationError') {
      req.flash('erro', error.errors.map(e => e.message).join(' '));
    } else {
      req.flash('erro', 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.');
    }
    return res.redirect('/cadastro');
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};
