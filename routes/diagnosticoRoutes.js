const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const diagnosticoController = require('../controllers/diagnosticoController');
const { requireAuth } = require('../middlewares/auth');

// Configuração de armazenamento com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `folha-${unico}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos.'));
    }
  }
});

// Acesso à tela e análise (disponível para usuário logado)
router.get('/', requireAuth, diagnosticoController.renderDiagnostico);
router.post('/analisar', requireAuth, upload.single('foto'), diagnosticoController.analisarFoto);
router.post('/feedback', requireAuth, diagnosticoController.salvarFeedback);

module.exports = router;
