// app.js
const map = L.map('map').setView([51.3, 10.4], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

fetch('data.geojson')               // <— Pfad muss exakt zu deiner Datei passen!
  .then(r => r.json())
  .then(geo => L.geoJSON(geo, {
    style: { weight: 1, color: '#3388ff', fillOpacity: 0.2 }
  }).addTo(map))
  .catch(console.error);
