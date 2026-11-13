require('dotenv').config();
const express = require('express');
const locaisRoutes = require('./src/routes/locaisRoutes');
const categoriasRoutes = require('./src/routes/categoriasRoutes');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/locais', locaisRoutes);
app.use('/categorias', categoriasRoutes);

app.listen(process.env.PORT, () =>
  console.log(`API rodando em http://localhost:${process.env.PORT}`)
);