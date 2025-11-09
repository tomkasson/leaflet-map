// Map
const map = L.map('map', { zoomControl: false }).setView([53.55, 9.99], 6);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OSM'
}).addTo(map);

// State
const layersState = new Map(); // id -> { layer, name, color }

// UI handles
const listEl = document.getElementById('layer-list');
const uploadBtn = document.getElementById('btn-upload');
const fileInput = document.getElementById('file-input');

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  for (const f of files) {
    const ext = f.name.toLowerCase();
    try {
      if (ext.endsWith('.geojson') || ext.endsWith('.json')) {
        const gj = JSON.parse(await f.text());
        addGeoJsonLayer(gj, f.name);
      } else if (ext.endsWith('.zip')) {
        // shpjs Variante – nur wenn Script eingebunden:
        // const gj = await shp(await f.arrayBuffer());
        // addGeoJsonLayer(gj, f.name.replace(/\.zip$/i,''));
        alert('Shapefile als ZIP nur mit shpjs aktiviert – aktuell nicht eingebunden.');
      } else {
        alert(`Unsupported: ${f.name}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Fehler bei ${f.name}: ${err.message}`);
    }
  }
  fileInput.value = ''; // reset
});

function addGeoJsonLayer(geojson, name) {
  const color = pickInitialColor();
  const style = makeStyle(color);
  const layer = L.geoJSON(geojson, { style, onEachFeature });

  layer.addTo(map);
  const id = crypto.randomUUID();
  layersState.set(id, { layer, name, color });

  renderLayerItem(id);
  tryFitBounds(layer);
}

function onEachFeature(feature, layer) {
  // optional: kleine Default-Popup
  if (feature && feature.properties) {
    const keys = Object.keys(feature.properties);
    if (keys.length) {
      const first = keys.slice(0, 3).map(k => `<b>${k}</b>: ${feature.properties[k]}`).join('<br>');
      layer.bindPopup(first);
    }
  }
}

function makeStyle(color) {
  return {
    color,          // stroke
    weight: 2,
    opacity: 1,
    fillColor: color,
    fillOpacity: 0.3
  };
}

function tryFitBounds(layer) {
  try {
    const b = layer.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [40, 40] });
  } catch {}
}

function renderLayerItem(id) {
  const { name, color } = layersState.get(id);

  const li = document.createElement('li');
  li.className = 'layer-item';
  li.dataset.id = id;

  // Name
  const title = document.createElement('div');
  title.className = 'layer-name';
  title.title = name;
  title.textContent = name;

  // Color chip + hidden input
  const chip = document.createElement('div');
  chip.className = 'color-chip';
  chip.style.background = color;

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'color-input';
  colorInput.value = toHex(color);

  chip.addEventListener('click', () => colorInput.click());
  colorInput.addEventListener('input', (e) => {
    const c = e.target.value;
    chip.style.background = c;
    const st = makeStyle(c);
    const entry = layersState.get(id);
    entry.color = c;
    entry.layer.setStyle(st);
  });

  // Zoom
  const zoomBtn = iconButton(svgMagnifier(), 'Zoom auf Layer');
  zoomBtn.addEventListener('click', () => {
    const entry = layersState.get(id);
    tryFitBounds(entry.layer);
  });

  // Toggle visible (eye / eye-off) – far right
  let visible = true;
  const toggleBtn = iconButton(svgEye(true), 'Layer ein-/ausblenden');
  toggleBtn.style.marginLeft = 'auto';
  toggleBtn.addEventListener('click', () => {
    const entry = layersState.get(id);
    visible = !visible;
    toggleBtn.innerHTML = svgEye(visible);
    if (visible) entry.layer.addTo(map);
    else entry.layer.removeFrom(map);
  });

  // Delete
  const delBtn = iconButton(svgTrash(), 'Layer entfernen', true);
  delBtn.addEventListener('click', () => {
    const entry = layersState.get(id);
    map.removeLayer(entry.layer);
    layersState.delete(id);
    li.remove();
  });

  li.append(title, chip, colorInput, zoomBtn, toggleBtn, delBtn);
  listEl.prepend(li);
}

function iconButton(svg, title, danger=false) {
  const b = document.createElement('button');
  b.className = 'icon-btn' + (danger ? ' danger' : '');
  b.title = title;
  b.innerHTML = svg;
  return b;
}

function svgMagnifier() {
  return `<svg class="icon zoom" viewBox="0 0 24 24"><path d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/></svg>`;
}
function svgEye(open=true) {
  return open
    ? `<svg class="icon" viewBox="0 0 24 24"><path d="M12 5c5.523 0 10 5 10 7s-4.477 7-10 7S2 14 2 12s4.477-7 10-7zm0 2C7.582 7 4 11.03 4 12c0 .97 3.582 5 8 5s8-4.03 8-5c0-.97-3.582-5-8-5zm0 2a3 3 0 110 6 3 3 0 010-6z"/></svg>`
    : `<svg class="icon" viewBox="0 0 24 24"><path d="M2.81 2.81L21.19 21.2l-1.41 1.41-3.03-3.03A11.6 11.6 0 0112 19C6.477 19 2 14 2 12c0-.87 1.233-2.733 3.47-4.44L1.4 4.22 2.81 2.81zM12 5c5.523 0 10 5 10 7 0 .59-.529 1.699-1.6 2.99l-2.05-2.05A5 5 0 0010.06 7.65L7.63 5.22A13.1 13.1 0 0112 5z"/></svg>`;
}
function svgTrash() {
  return `<svg class="icon" viewBox="0 0 24 24"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM5 7h14l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7z"/></svg>`;
}

function toHex(c){
  // accepts #rgb/#rrggbb or rgb/rgba(); returns #rrggbb
  if(/^#/.test(c)){ 
    if(c.length===4){ return '#'+[...c.slice(1)].map(x=>x+x).join(''); }
    return c.toLowerCase();
  }
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if(!m) return '#00a86b';
  const [r,g,b] = m.slice(1).map(Number);
  return '#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function pickInitialColor(){
  // kleine Palette drehen, damit mehrere Layer sofort unterscheidbar sind
  const palette = ['#18a558','#1e90ff','#ff8c00','#9b59b6','#e74c3c','#2ecc71','#f1c40f','#00bcd4'];
  const i = (layersState.size) % palette.length;
  return palette[i];
}
