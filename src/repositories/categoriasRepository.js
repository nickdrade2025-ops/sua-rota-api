const pool = require('../database');

module.exports = {
  async listar() {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY id_categoria');
    return rows;
  },
  async buscarPorId(id) {
    const { rows } = await pool.query('SELECT * FROM categorias WHERE id_categoria = $1', [id]);
    return rows[0];
  },
};