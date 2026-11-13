const pool = require('../database');

module.exports = {
  async listar() {
    const { rows } = await pool.query('SELECT * FROM locais ORDER BY id_local');
    return rows;
  },
  async buscarPorId(id) {
    const { rows } = await pool.query('SELECT * FROM locais WHERE id_local = $1', [id]);
    return rows[0];
  },
  async criar({ nome, descricao, endereco, cidade, estado, id_categoria }) {
    const { rows } = await pool.query(
      `INSERT INTO locais (nome, descricao, endereco, cidade, estado, id_categoria)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, descricao, endereco, cidade, estado, id_categoria]
    );
    return rows[0];
  },
  async atualizar(id, { nome, descricao, endereco, cidade, estado, id_categoria }) {
    const { rows } = await pool.query(
      `UPDATE locais
       SET nome=$1, descricao=$2, endereco=$3, cidade=$4, estado=$5, id_categoria=$6
       WHERE id_local=$7 RETURNING *`,
      [nome, descricao, endereco, cidade, estado, id_categoria, id]
    );
    return rows[0];
  },
  async remover(id) {
    const { rowCount } = await pool.query('DELETE FROM locais WHERE id_local = $1', [id]);
    return rowCount > 0;
  },
};