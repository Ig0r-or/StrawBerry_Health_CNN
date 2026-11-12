const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middlewares/auth');

router.get('/login', redirectIfAuthenticated, authController.renderLogin);
router.post('/login', redirectIfAuthenticated, authController.postLogin);

router.get('/cadastro', redirectIfAuthenticated, authController.renderCadastro);
router.post('/cadastro', redirectIfAuthenticated, authController.postCadastro);

router.get('/logout', authController.logout);

module.exports = router;
