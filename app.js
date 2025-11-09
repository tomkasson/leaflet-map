@'
// Grundkarte
const map = L.map("map", { zoomControl: true }).setView([53.5511, 9.9937], 12); // Hamburg

// Basemap (OSM) – 100% kostenlos
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Optional zweite Basemap (Carto Light) – ebenfalls kostenlos
const cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap & CARTO'
});

// Maßstab
L.control.scale({ metric: true, imperial: false }).addTo(map);

// Demo-Markierungen (ändere Koordinaten/Popups)
const demoPoints = [
  { name: "Rathaus", coords: [53.5503, 9.9922] },
  { name: "Hbf",     coords: [53.5526, 10.0067] }
];
const markers = L.layerGroup(
  demoPoints.map(p => L.marker(p.coords).bindPopup(`<b>${p.name}</b>`))
).addTo(map);

// GeoJSON laden (aus data.geojson im gleichen Ordner)
fetch("data.geojson")
  .then(r => r.json())
  .then(geojson => {
    const gj = L.geoJSON(geojson, {
      style: f => ({ color: "#0066cc", weight: 2 }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const rows = Object.entries(props).map(([k,v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join("");
        layer.bindPopup(`<table>${rows}</table>`);
      }
    }).addTo(map);
    try { map.fitBounds(gj.getBounds(), { padding: [20,20] }); } catch(e) {}
  })
  .catch(() => console.warn("data.geojson nicht gefunden oder leer."));

// Layer Control
L.control.layers(
  { "OpenStreetMap": osm, "Carto Light": cartoLight },
  { "Markers": markers },
  { collapsed: false }
).addTo(map);
'@ | Set-Content .\app.js -Encoding UTF8
