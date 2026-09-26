// Centraliza na sua cidade
const CITY_CENTER = { lat: -21.756, lng: -48.828 }; // exemplo Ibitinga
const map = L.map("map").setView([CITY_CENTER.lat, CITY_CENTER.lng], 13);

// Importa os tiles do OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> colaboradores'
}).addTo(map);

// Exemplo: adicionar um marcador fixo
L.marker([CITY_CENTER.lat, CITY_CENTER.lng])
  .addTo(map)
  .bindPopup("Centro de Ibitinga");

//A PARTIR DAQUI

const form = document.getElementById('form-ponto');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const endereco = document.getElementById('endereco').value.trim();
  const horario = document.getElementById('horario').value.trim();
  const celular = document.getElementById('celular').value.trim();
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);

  const materiais = Array.from(document.querySelectorAll('input[name="materiais"]:checked'))
    .map(i => i.value);

  if (!nome || Number.isNaN(lat) || Number.isNaN(lng)) {
    alert('Preencha o nome e clique no mapa para escolher a localização.');
    return;
  }

  const payload = { nome, materiais, lat, lng, endereco, celular, horario };

  try {
    const resp = await fetch('http://localhost:3000/api/pontos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.error || 'Falha ao cadastrar');

    form.reset();
    document.getElementById('lat').value = '';
    document.getElementById('lng').value = '';
    if (window._sel) { map.removeLayer(window._sel); window._sel = null; }

    await carregarPontos();
    alert('Ponto cadastrado!');
  } catch (err) {
    console.error(err);
    alert('Erro ao cadastrar o ponto.');
  }
});



async function carregarPontos() {
  try {
    const resp = await fetch('http://localhost:3000/api/pontos');
    const pontos = await resp.json();

    // limpa marcadores antigos
    if (!window._markers) window._markers = [];
    window._markers.forEach(m => map.removeLayer(m));
    window._markers = [];

    pontos.forEach(p => {
      const mats = typeof p.materiais === 'string' ? JSON.parse(p.materiais) : (p.materiais || []);
      const m = L.marker([p.lat, p.lng]).addTo(map)
        .bindPopup(`<b>${p.nome}</b><br>${p.endereco||''}<br><small>${mats.join(', ')}</small>`);
      window._markers.push(m);
    });
  } catch (e) {
    console.error('Erro ao buscar pontos:', e);
  }
}

// chamar no final do arquivo, depois de montar o mapa
carregarPontos();

map.on('click', (e) => {
  const { lat, lng } = e.latlng;
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);

  if (window._sel) map.removeLayer(window._sel);
  window._sel = L.marker([lat, lng]).addTo(map).bindPopup('Local selecionado').openPopup();
});

//LISTANDO OS PONTOS

async function listarPontos() {
  const resp = await fetch("http://localhost:3000/api/pontos");
  const pontos = await resp.json();
  const tbody = document.querySelector("#tabela-pontos tbody");
  tbody.innerHTML = "";

  pontos.forEach(p => {
    const mats = typeof p.materiais === "string" ? JSON.parse(p.materiais) : (p.materiais || []);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.endereco ?? ""}</td>
      <td>${mats.join(", ")}</td>
      <td><button data-id="${p.id}" class="btn-excluir">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });

  // clicks de exclusão
  tbody.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("Tem certeza que deseja excluir este ponto?")) return;

      const r = await fetch(`http://localhost:3000/api/pontos/${id}`, { method: "DELETE" });
      if (r.ok) {
        await carregarPontos(); // atualiza o mapa
        await listarPontos();   // atualiza a tabela
      } else {
        const j = await r.json().catch(() => ({}));
        alert(j.error || "Falha ao excluir");
      }
    });
  });
}

// chame após o boot:
carregarPontos().then(listarPontos);



//FAZENDO SÓ CADASTRAR QUANDO COMPLETAR OS CAMPOS


const btn = document.querySelector(".btn");
const obrigatorios = ["nome","horario","celular","endereco","cep","numero","bairro"];
const inputs = obrigatorios.map(id => document.getElementById(id));
function checarValidade() {
  const basicosOk = inputs.every(el => el && el.value.trim().length > 0);
  const latOk = !!document.getElementById("lat").value;
  const lngOk = !!document.getElementById("lng").value;
  const matsOk = document.querySelectorAll('input[name="materiais"]:checked').length > 0;
  btn.disabled = !(basicosOk && latOk && lngOk && matsOk);
}
inputs.forEach(el => el.addEventListener("input", checarValidade));
document.querySelectorAll('input[name="materiais"]').forEach(cb => cb.addEventListener("change", checarValidade));
map.on("click", checarValidade);
checarValidade(); // inicial

const cepEl = document.getElementById("cep");
const celEl = document.getElementById("celular");

function maskCEP(v) {
  v = v.replace(/\D/g, "").slice(0, 8);
  if (v.length > 5) v = v.slice(0,5) + "-" + v.slice(5);
  return v;
}

// FAZENDO A MASCARA PARA FICAR BONITO

function maskCel(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) { // (##) ####-#### (fixo/antigo)
    if (v.length > 6) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    if (v.length > 2) return `(${v.slice(0,2)}) ${v.slice(2)}`;
    if (v.length > 0) return `(${v}`;
    return v;
  } else {             // (##) #####-#### (celular 9 dígitos)
    return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  }
}

if (cepEl) cepEl.addEventListener("input", () => { cepEl.value = maskCEP(cepEl.value); });
if (celEl) celEl.addEventListener("input", () => { celEl.value = maskCel(celEl.value); });