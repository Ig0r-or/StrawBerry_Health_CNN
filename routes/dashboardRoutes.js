const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', requireAuth, dashboardController.renderDashboard);
router.get('/dashboard', requireAuth, dashboardController.renderDashboard);

router.get('/perfil', requireAuth, dashboardController.renderPerfil);
router.post('/perfil', requireAuth, dashboardController.atualizarPerfil);

module.exports = router;
