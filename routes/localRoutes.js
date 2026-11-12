const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const { requireAuth } = require('../middlewares/auth');

// Todas as rotas de locais de plantio exigem autenticação
router.use(requireAuth);

router.get('/', localController.listar);
router.get('/novo', localController.renderNovo);
router.post('/', localController.criar);
router.get('/:id/editar', localController.renderEditar);
router.post('/:id/editar', localController.atualizar);
router.post('/:id/excluir', localController.excluir);

module.exports = router;
