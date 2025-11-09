// Zentrum Hamburg
const MAP_CENTER = [53.5511, 9.9937];
const MAP_ZOOM = 11;

// 1) Karte
const map = L.map('map').setView(MAP_CENTER, MAP_ZOOM);

// 2) Basiskarte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 3) Marker Hamburg (nur als Referenz)
L.marker(MAP_CENTER).addTo(map).bindPopup('Hamburg').openPopup();

// 4) GeoJSON laden (RELATIVER Pfad in den /data Ordner!)
const DATA_URL = 'data/NUTS_RG_60M_2024_4326_LEVL_3.geojson';

fetch(DATA_URL)
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status} beim Laden von ${DATA_URL}`);
    return r.json();
  })
  .then(geojson => {
    const layer = L.geoJSON(geojson, {
      style: feature => ({
        color: '#0066cc',
        weight: 1,
        fillColor: '#66b2ff',
        fillOpacity: 0.35
      }),
      onEachFeature: (feature, lyr) => {
        // Popup: nimm ein paar sinnvolle Properties, sonst zeig Keys/Values dynamisch
        const props = feature.properties || {};
        const content = Object.keys(props).length
          ? Object.entries(props).slice(0, 10).map(([k,v]) => `<div><b>${k}</b>: ${v}</div>`).join('')
          : 'Keine Attribute';
        lyr.bindPopup(content);
      }
    }).addTo(map);

    // 5) Auf Daten zoomen (falls sichtbar)
    try {
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch { /* wenn leer, bleibt Hamburg-Zoom */ }
  })
  .catch(err => {
    console.error('GeoJSON-Fehler:', err);
    alert('Konnte GeoJSON nicht laden. Siehe Konsole.');
  });
