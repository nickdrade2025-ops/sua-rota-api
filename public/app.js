const API = '/locais';
const $ = (id) => document.getElementById(id);

let locais = [];
let categorias = {};
let atual = null;
let editandoId = null;
let soFavoritos = false;

let favoritos = new Set();
try { favoritos = new Set(JSON.parse(localStorage.getItem('favoritos') || '[]')); } catch (e) {}
function salvarFavoritos() {
  try { localStorage.setItem('favoritos', JSON.stringify([...favoritos])); } catch (e) {}
}

function avisar(texto) {
  const el = $('aviso');
  el.textContent = texto;
  el.classList.add('visivel');
  setTimeout(() => el.classList.remove('visivel'), 2500);
}

const cor = (l) => `hsl(${(l.id_categoria * 67) % 360} 45% 32%)`;
const nomeCat = (l) => categorias[l.id_categoria] || `Categoria ${l.id_categoria}`;

function saudar() {
  const h = new Date().getHours();
  $('saudacao').textContent = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

async function carregar() {
  try {
    locais = await (await fetch(API)).json();
  } catch (e) {
    locais = [];
    avisar('Não foi possível falar com a API. Ela está rodando?');
  }
  try {
    const lista = await (await fetch('/categorias')).json();
    categorias = {};
    lista.forEach((c) => { categorias[c.id_categoria] = c.nome; });
  } catch (e) {}
  desenhar();
}

function desenhar() {
  const termo = $('busca').value.trim().toLowerCase();
  const filtrados = locais.filter((l) => {
    const texto = `${l.nome} ${l.cidade} ${l.endereco}`.toLowerCase();
    return texto.includes(termo) && (!soFavoritos || favoritos.has(l.id_local));
  });

  $('titulo-lista').textContent = soFavoritos ? 'Seus favoritos' : 'Lugares para sentir Floripa';
  $('vazio').hidden = filtrados.length > 0;

  const lista = $('lista');
  lista.innerHTML = '';
  filtrados.forEach((l) => lista.appendChild(criarCartao(l)));

  const d = locais[0];
  $('destaque').hidden = !d;
  if (d) {
    $('destaque').style.backgroundColor = cor(d);
    $('destaque-titulo').textContent = d.nome;
    $('destaque-sub').textContent = `${d.cidade}/${d.estado}`;
  }
}

function criarCartao(l) {
  const cartao = document.createElement('article');
  cartao.className = 'cartao';

  const abrir = document.createElement('button');
  abrir.className = 'abrir';
  abrir.setAttribute('aria-label', `Ver detalhes de ${l.nome}`);

  const capa = document.createElement('div');
  capa.className = 'capa';
  capa.style.backgroundColor = cor(l);

  const corpo = document.createElement('div');
  corpo.className = 'cartao-corpo';
  const cat = document.createElement('p');
  cat.className = 'eyebrow';
  cat.textContent = `${nomeCat(l)} · ${l.cidade}`;
  const nome = document.createElement('h3');
  nome.textContent = l.nome;
  const ver = document.createElement('span');
  ver.className = 'detalhes';
  ver.textContent = 'Ver detalhes ›';
  corpo.append(cat, nome, ver);

  abrir.append(capa, corpo);
  abrir.addEventListener('click', () => abrirDetalhe(l));

  const salvar = document.createElement('button');
  const ativo = favoritos.has(l.id_local);
  salvar.className = 'salvar' + (ativo ? ' ativo' : '');
  salvar.textContent = ativo ? '★' : '☆';
  salvar.setAttribute('aria-label', ativo ? `Remover ${l.nome} dos favoritos` : `Favoritar ${l.nome}`);
  salvar.addEventListener('click', () => alternarFavorito(l));

  cartao.append(abrir, salvar);
  return cartao;
}

function alternarFavorito(l) {
  if (favoritos.has(l.id_local)) favoritos.delete(l.id_local);
  else favoritos.add(l.id_local);
  salvarFavoritos();
  desenhar();
  if (atual && atual.id_local === l.id_local) botaoFav();
}

function abrirDetalhe(l) {
  atual = l;
  $('detalhe-capa').style.backgroundColor = cor(l);
  $('detalhe-cat').textContent = nomeCat(l);
  $('detalhe-nome').textContent = l.nome;
  $('detalhe-local').textContent = `${l.endereco} · ${l.cidade}/${l.estado}`;
  $('detalhe-desc').textContent = l.descricao || 'Este lugar ainda não tem descrição.';
  botaoFav();
  $('dlg-detalhe').showModal();
}

function botaoFav() {
  $('detalhe-fav').textContent = favoritos.has(atual.id_local) ? 'Remover dos favoritos' : 'Favoritar';
}

async function apagar(l) {
  if (!confirm(`Apagar "${l.nome}"? Essa ação não pode ser desfeita.`)) return;
  const resp = await fetch(`${API}/${l.id_local}`, { method: 'DELETE' });
  if (resp.ok) {
    favoritos.delete(l.id_local);
    salvarFavoritos();
    $('dlg-detalhe').close();
    avisar('Local apagado');
    carregar();
  } else {
    const r = await resp.json();
    avisar(r.erro || 'Não foi possível apagar');
  }
}

function abrirForm(l) {
  editandoId = l ? l.id_local : null;
  $('form-titulo').textContent = l ? 'Editar local' : 'Novo local';
  $('nome').value = l ? l.nome : '';
  $('endereco').value = l ? l.endereco : '';
  $('cidade').value = l ? l.cidade : '';
  $('estado').value = l ? l.estado : '';
  $('id_categoria').value = l ? l.id_categoria : '';
  $('descricao').value = l && l.descricao ? l.descricao : '';
  $('form-erro').textContent = '';
  $('dlg-form').showModal();
  $('nome').focus();
}

function validar(d) {
  if (!d.nome || !d.endereco || !d.cidade) return 'Preencha nome, endereço e cidade.';
  if (d.estado.length !== 2) return 'Informe o estado com 2 letras, como SC.';
  if (!d.id_categoria || d.id_categoria < 1) return 'Informe o ID de uma categoria existente.';
  return null;
}

async function salvar(e) {
  e.preventDefault();
  const dados = {
    nome: $('nome').value.trim(),
    endereco: $('endereco').value.trim(),
    cidade: $('cidade').value.trim(),
    estado: $('estado').value.trim().toUpperCase(),
    id_categoria: Number($('id_categoria').value),
    descricao: $('descricao').value.trim()
  };
  const erro = validar(dados);
  if (erro) { $('form-erro').textContent = erro; return; }

  const resp = await fetch(editandoId ? `${API}/${editandoId}` : API, {
    method: editandoId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (resp.ok) {
    $('dlg-form').close();
    avisar(editandoId ? 'Local atualizado' : 'Local criado');
    carregar();
  } else {
    const r = await resp.json();
    $('form-erro').textContent = r.erro || 'Não foi possível salvar.';
  }
}

$('busca').addEventListener('input', desenhar);
$('btn-filtro').addEventListener('click', () => {
  soFavoritos = !soFavoritos;
  $('btn-filtro').setAttribute('aria-pressed', soFavoritos);
  desenhar();
});
$('btn-todos').addEventListener('click', () => {
  const grade = $('lista').classList.toggle('grade');
  $('btn-todos').textContent = grade ? 'Ver menos' : 'Ver todos';
});
$('btn-novo').addEventListener('click', () => abrirForm(null));
$('destaque').addEventListener('click', () => locais[0] && abrirDetalhe(locais[0]));
$('form').addEventListener('submit', salvar);
$('form-cancelar').addEventListener('click', () => $('dlg-form').close());
$('detalhe-fechar').addEventListener('click', () => $('dlg-detalhe').close());
$('detalhe-fav').addEventListener('click', () => alternarFavorito(atual));
$('detalhe-editar').addEventListener('click', () => { $('dlg-detalhe').close(); abrirForm(atual); });
$('detalhe-apagar').addEventListener('click', () => apagar(atual));
document.querySelectorAll('.menu button').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.aba === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' });
    else avisar('Esta tela ainda não está pronta');
  })
);

saudar();
carregar();