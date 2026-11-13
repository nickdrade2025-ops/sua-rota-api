const express = require('express');
const repo = require('../repositories/locaisRepository');
const router = express.Router();

const camposObrigatorios = ['nome', 'endereco', 'cidade', 'estado', 'id_categoria'];

function validar(body) {
  const faltando = camposObrigatorios.filter((c) => !body[c]);
  return faltando.length ? `Campos obrigatórios: ${faltando.join(', ')}` : null;
}

function tratarErro(err, res) {
  if (err.code === '23503') {
    return res.status(409).json({ erro: 'Operação bloqueada: categoria inexistente ou registro com dados vinculados' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}

router.get('/', async (req, res) => {
  try { res.json(await repo.listar()); } catch (e) { tratarErro(e, res); }
});

router.get('/:id', async (req, res) => {
  try {
    const local = await repo.buscarPorId(req.params.id);
    if (!local) return res.status(404).json({ erro: 'Local não encontrado' });
    res.json(local);
  } catch (e) { tratarErro(e, res); }
});

router.post('/', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  try { res.status(201).json(await repo.criar(req.body)); } catch (e) { tratarErro(e, res); }
});

router.put('/:id', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    const local = await repo.atualizar(req.params.id, req.body);
    if (!local) return res.status(404).json({ erro: 'Local não encontrado' });
    res.json(local);
  } catch (e) { tratarErro(e, res); }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await repo.remover(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Local não encontrado' });
    res.status(204).send();
  } catch (e) { tratarErro(e, res); }
});

module.exports = router;