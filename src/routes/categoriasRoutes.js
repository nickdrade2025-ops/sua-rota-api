const express = require('express');
const repo = require('../repositories/categoriasRepository');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json(await repo.listar());
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const categoria = await repo.buscarPorId(req.params.id);
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
    res.json(categoria);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;