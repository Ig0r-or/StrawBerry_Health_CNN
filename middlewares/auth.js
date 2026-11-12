// Middleware de proteção de rotas privadas
function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario) {
    req.flash('erro', 'Você precisa estar logado para acessar esta página.');
    return res.redirect('/login');
  }
  next();
}

// Middleware de autorização por perfil (ex.: apenas Admin)
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    req.flash('erro', 'Acesso negado. Faça login primeiro.');
    return res.redirect('/login');
  }
  if (req.session.usuario.perfil !== 'admin') {
    req.flash('erro', 'Acesso restrito a administradores do sistema.');
    return res.redirect('/dashboard');
  }
  next();
}

// Redireciona usuários já logados para fora de /login e /cadastro
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.usuario) {
    return res.redirect('/dashboard');
  }
  next();
}

// Injeta variáveis globais nas views EJS
function injectLocals(req, res, next) {
  res.locals.usuario = req.session ? req.session.usuario : null;
  res.locals.sucesso = req.flash('sucesso');
  res.locals.erro = req.flash('erro');
  res.locals.info = req.flash('info');
  res.locals.currentPath = req.path;
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  redirectIfAuthenticated,
  injectLocals
};
