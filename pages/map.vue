<template>
  <div>
    <div id="map" class="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import mapboxgl from "mapbox-gl";

interface VehicleFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    vehicleId: string;
    vehicleStateId: number;
    fuelLevel: number;
  };
}

interface GeoJsonData {
  type: "FeatureCollection";
  features: VehicleFeature[];
}

interface VehicleStateMap {
  [key: number]: string;
}

const map = ref<mapboxgl.Map | null>(null);
const vehiclesSource = "vehicles";
const vehiclesLayer = "vehicle-points";

onMounted(() => {
  initMap();
});

definePageMeta({
  middleware: ["auth"],
});

function initMap(): void {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiaHVtYW5mb3Jlc3QiLCJhIjoiY2wzeGI3OGgwMDQ3ZjNqbGRxajUybGVhdCJ9.YBlIMhYjnmK7Uj4AZL3Yfw";

  map.value = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/humanforest/cl5s8exx2000115scy8vbtknz",
    center: [-0.1276, 51.5072],
    zoom: 12,
    attributionControl: false,
  });

  map.value.on("load", () => {
    addVehiclesToMap();
  });
}

function addVehiclesToMap(): void {
  if (!map.value) return;

  const geojson: GeoJsonData = {
    type: "FeatureCollection",
    features: [],
  };

  if (map.value.getSource(vehiclesSource)) {
    const source = map.value.getSource(
      vehiclesSource
    ) as mapboxgl.GeoJSONSource;
    source.setData(geojson);
  } else {
    map.value.addSource(vehiclesSource, {
      type: "geojson",
      data: geojson,
    });

    map.value.addLayer({
      id: vehiclesLayer,
      type: "circle",
      source: vehiclesSource,
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "vehicleStateId"],
          0,
          "#4CAF50",
          4,
          "#2E7D32",
          5,
          "#D2691E",
          2,
          "#1976D2",
          8,
          "#9C27B0",
          12,
          "#F44336",
          10,
          "#F44336",
          6,
          "#795548",
          3,
          "#F44336",
          14,
          "#1976D2",
          "#888888",
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": [
          "case",
          ["in", ["get", "vehicleStateId"], ["literal", [10, 6, 3, 14]]],
          0.6,
          1,
        ],
      },
    });

    setupMapInteractions();
  }
}

function setupMapInteractions(): void {
  if (!map.value) return;

  map.value.on("click", vehiclesLayer, (e: mapboxgl.MapLayerMouseEvent) => {
    const features = e.features;
    if (!features || features.length === 0) return;

    const props = features[0].properties;
    if (!props) return;

    const vehicleId = props.vehicleId;
    const vehicleState = getStateById(props.vehicleStateId);
    const fuelLevel = props.fuelLevel;

    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `
        <div class="popup-content">
          <h4>Vehicle ${vehicleId}</h4>
          <p><strong>State:</strong> ${vehicleState}</p>
          <p><strong>Fuel Level:</strong> ${fuelLevel}%</p>
        </div>
      `
      )
      .addTo(map.value);
  });

  map.value.on("mouseenter", vehiclesLayer, () => {
    if (!map.value) return;
    map.value.getCanvas().style.cursor = "pointer";
  });

  map.value.on("mouseleave", vehiclesLayer, () => {
    if (!map.value) return;
    map.value.getCanvas().style.cursor = "";
  });
}

function getStateById(stateId: number): string {
  const states: VehicleStateMap = {
    0: "Active",
    4: "Fuel Low",
    5: "Greenhouse",
    2: "Move",
    8: "Support & Community",
    12: "Damage Collect",
    10: "Damaged",
    6: "Missing",
    3: "Unreachable",
    14: "Forest Guardian",
  };

  return states[stateId] || `Unknown (${stateId})`;
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.mapContainer {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  font-family: "Inter", sans-serif;
}

:deep(.popup-content) {
  font-family: "Inter", sans-serif;
  padding: 4px;
}

:deep(.popup-content h4) {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #334155;
  padding-bottom: 5px;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.popup-content p) {
  margin: 5px 0;
  font-size: 12px;
  color: #4b5563;
}
</style>
