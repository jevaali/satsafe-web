<template>
  <div class="orbit-viewer" ref="containerRef" :style="{ height }">
    <canvas ref="canvasRef" class="orbit-canvas" />

    <!-- Fleet mode: tracked objects list (top-left) -->
    <div v-if="!isSingleMode" class="hud hud-satellites">
      <div class="hud-title">TRACKED OBJECTS</div>
      <div
        v-for="sat in displaySatellites"
        :key="sat.id"
        class="hud-sat-row"
        :class="{ active: selectedId === sat.id }"
        @click="selectSatellite(sat)"
      >
        <span class="sat-dot" :style="{ background: riskColor(sat.riskLevel) }" />
        <span class="sat-name">{{ sat.name }}</span>
        <span class="sat-norad">{{ sat.noradId }}</span>
        <span class="sat-risk" :style="{ color: riskColor(sat.riskLevel) }">
          {{ sat.riskLevel.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Fleet mode: detail panel for selected satellite (top-right) -->
    <transition name="panel-slide">
      <div v-if="!isSingleMode && selected" class="hud hud-detail">
        <div class="hud-title">
          {{ selected.name }}
          <span class="norad-badge">NORAD {{ selected.noradId }}</span>
        </div>

        <div class="detail-section">ORBITAL ELEMENTS</div>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Semi-major axis</span>
            <span class="detail-val">{{ selected.orbit.semiMajorAxis.toLocaleString() }} km</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Eccentricity</span>
            <span class="detail-val">{{ selected.orbit.eccentricity.toFixed(6) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Inclination</span>
            <span class="detail-val">{{ selected.orbit.inclination.toFixed(4) }}°</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RAAN</span>
            <span class="detail-val">{{ selected.orbit.raan.toFixed(4) }}°</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Arg. of perigee</span>
            <span class="detail-val">{{ selected.orbit.argumentOfPerigee.toFixed(4) }}°</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mean anomaly</span>
            <span class="detail-val">{{ selected.orbit.meanAnomaly.toFixed(4) }}°</span>
          </div>
        </div>

        <div class="detail-section">RISK</div>
        <div class="detail-row">
          <span class="detail-label">Risk level</span>
          <span class="detail-val" :style="{ color: riskColor(selected.riskLevel) }">
            {{ selected.riskLevel.toUpperCase() }}
          </span>
        </div>
      </div>
    </transition>

    <!-- Single mode: satellite name label (top-left) -->
    <div v-if="isSingleMode && displaySatellites.length" class="hud hud-single-label">
      <span class="sat-dot" :style="{ background: riskColor(displaySatellites[0].riskLevel) }" />
      <span class="single-name">{{ displaySatellites[0].name }}</span>
      <span class="single-norad">NORAD {{ displaySatellites[0].noradId }}</span>
    </div>

    <!-- Controls hint (bottom-center) -->
    <div class="hud hud-controls">
      <span>drag</span> rotate &nbsp;·&nbsp; <span>scroll</span> zoom
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Array of satellites for fleet (multi) mode.
   * Accepts both ISatelliteListItem (has riskLevel) and ISatelliteDetail (has riskAssessment).
   */
  satellites: {
    type: Array,
    default: () => []
  },
  /**
   * Single satellite for detail mode.
   * When provided, satellites prop is ignored and no HUD overlays are shown.
   * Accepts ISatelliteDetail (has riskAssessment).
   */
  satellite: {
    type: Object,
    default: null
  },
  /** Earth radius in km — used to normalise semiMajorAxis to scene units. */
  earthRadiusKm: {
    type: Number,
    default: 6371
  },
  /** CSS height of the viewer container. Adjust per context (e.g. '400px' for detail page). */
  height: {
    type: String,
    default: '500px'
  }
})

// ─── Mode ─────────────────────────────────────────────────────────────────────
const isSingleMode = computed(() => !!props.satellite)

/**
 * Normalise either ISatelliteListItem or ISatelliteDetail to a consistent
 * internal shape. The key difference is that ISatelliteListItem has a flat
 * `riskLevel` string, while ISatelliteDetail nests it under `riskAssessment`.
 */
function normalizeSat(sat) {
  return {
    ...sat,
    riskLevel: sat.riskAssessment?.riskLevel ?? sat.riskLevel ?? 'unknown'
  }
}

/** Satellites fed into the 3D scene and HUD — always a normalized array. */
const displaySatellites = computed(() => {
  if (isSingleMode.value) return [normalizeSat(props.satellite)]
  return props.satellites.map(normalizeSat)
})

// ─── Refs ─────────────────────────────────────────────────────────────────────
const containerRef = ref(null)
const canvasRef    = ref(null)
const selectedId   = ref(null)

const selected = computed(() =>
  displaySatellites.value.find(s => s.id === selectedId.value) ?? null
)

// ─── Three.js internals ───────────────────────────────────────────────────────
let renderer, scene, camera, animId
let satMeshes  = []   // { mesh, sat, a, e, i, raan, aop, nu }
let orbitLines = []   // THREE.LineLoop

// Interaction state
let isDragging = false
let lastX = 0, lastY = 0
let rotX = 0.25, rotY = 0
let targetZoom = 8, currentZoom = 8
let minZoom = 1.8, maxZoom = 40

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert mean anomaly M (deg) to true anomaly ν (rad) via Kepler's equation */
function meanToTrue(M_deg, e) {
  const M = (M_deg * Math.PI) / 180
  let E = M
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E))
    E += dE
    if (Math.abs(dE) < 1e-10) break
  }
  return 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  )
}

/** Compute 3D position from Keplerian elements. Returns THREE.Vector3 in scene units. */
function keplerTo3D(a, e, i_deg, raan_deg, aop_deg, nu_rad) {
  const DEG = Math.PI / 180
  const r  = (a * (1 - e * e)) / (1 + e * Math.cos(nu_rad))
  const xp = r * Math.cos(nu_rad)
  const yp = r * Math.sin(nu_rad)

  const cosO = Math.cos(raan_deg * DEG), sinO = Math.sin(raan_deg * DEG)
  const cosi = Math.cos(i_deg   * DEG), sini = Math.sin(i_deg   * DEG)
  const cosw = Math.cos(aop_deg * DEG), sinw = Math.sin(aop_deg * DEG)

  const x = (cosO * cosw - sinO * sinw * cosi) * xp + (-cosO * sinw - sinO * cosw * cosi) * yp
  const y = (sinO * cosw + cosO * sinw * cosi) * xp + (-sinO * sinw + cosO * cosw * cosi) * yp
  const z = (sinw * sini) * xp + (cosw * sini) * yp

  // Y-up: swap y and z axes
  return new THREE.Vector3(x, z, y)
}

/** Build an orbit ellipse as a Float32Array of vertices (segments + 1 points). */
function buildOrbitVertices(a, e, i, raan, aop, segments = 256) {
  const verts = new Float32Array((segments + 1) * 3)
  for (let k = 0; k <= segments; k++) {
    const nu = (k / segments) * Math.PI * 2
    const v  = keplerTo3D(a, e, i, raan, aop, nu)
    verts[k * 3]     = v.x
    verts[k * 3 + 1] = v.y
    verts[k * 3 + 2] = v.z
  }
  return verts
}

/**
 * Perceptually distinct palette for orbit/satellite colours.
 * Chosen to be readable on a dark background and not clash with risk colours.
 */
const ORBIT_PALETTE = [
  '#38bdf8', // sky blue
  '#a78bfa', // violet
  '#fb923c', // orange
  '#34d399', // emerald
  '#f472b6', // pink
  '#facc15', // yellow
  '#60a5fa', // blue
  '#f87171', // rose
  '#4ade80', // green
  '#c084fc', // purple
]

/** Return the orbit colour for a satellite by its index in the display list. */
function orbitColor(index) {
  return ORBIT_PALETTE[index % ORBIT_PALETTE.length]
}

/** Map riskLevel string → hex colour (used only for HUD risk indicators). */
function riskColor(level = '') {
  switch (level.toLowerCase()) {
    case 'low':      return '#4ade80'
    case 'medium':   return '#fbbf24'
    case 'high':     return '#f87171'
    case 'critical': return '#e879f9'
    default:         return '#94a3b8'
  }
}

/**
 * Map semi-major axis to scene units.
 * Earth surface = radius 1.
 * Altitude is logarithmically exaggerated so orbits are visually distinct
 * from Earth regardless of whether they are LEO, MEO or GEO.
 *
 * Examples with earthRadiusKm = 6371:
 *   LEO  ~400 km alt  →  ~1.13 scene units
 *   GPS  ~20 200 km   →  ~3.88
 *   GEO  ~35 800 km   →  ~5.00
 */
function normalise(smaKm) {
  const altFraction = (smaKm - props.earthRadiusKm) / props.earthRadiusKm
  return 1 + Math.log1p(Math.max(0, altFraction)) * 2
}

// ─── Scene setup ──────────────────────────────────────────────────────────────

function initScene() {
  const el = canvasRef.value
  const w  = containerRef.value.clientWidth
  const h  = containerRef.value.clientHeight

  renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.setClearColor(0x030d1f, 1)   // deep navy — visible background

  scene  = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 2000)
  camera.position.set(0, 2, 6)
  camera.lookAt(0, 0, 0)

  // Stars — larger, brighter, more of them
  const starPos = []
  for (let i = 0; i < 5000; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = 80 + Math.random() * 40
    starPos.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
  scene.add(new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true, transparent: true, opacity: 1.0 })
  ))

  // Earth — brighter blue so it's clearly visible
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x2563a8, emissive: 0x0a1f4a, specular: 0x4488cc, shininess: 80 })
  )
  scene.add(earth)

  // Atmosphere glow — stronger
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 32, 32),
    new THREE.MeshPhongMaterial({ color: 0x60aaff, transparent: true, opacity: 0.18, side: THREE.FrontSide })
  ))

  // Equatorial reference ring — brighter
  const eqPoints = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    eqPoints.push(new THREE.Vector3(Math.cos(a) * 1.01, 0, Math.sin(a) * 1.01))
  }
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(eqPoints),
    new THREE.LineBasicMaterial({ color: 0x4466aa, transparent: true, opacity: 0.6 })
  ))

  // Lighting — stronger ambient so the dark side of Earth is visible
  scene.add(new THREE.AmbientLight(0x2a3a6a, 2.5))
  const sun = new THREE.DirectionalLight(0xfff5e0, 2.5)
  sun.position.set(10, 6, 4)
  scene.add(sun)

  buildSatellites()
}

function buildSatellites() {
  // Remove existing orbit lines and satellite meshes
  satMeshes.forEach(s  => scene.remove(s.mesh))
  orbitLines.forEach(l => scene.remove(l))
  satMeshes  = []
  orbitLines = []

  displaySatellites.value.forEach((sat, index) => {
    const a    = normalise(sat.orbit.semiMajorAxis)
    const e    = sat.orbit.eccentricity
    const i    = sat.orbit.inclination
    const raan = sat.orbit.raan
    const aop  = sat.orbit.argumentOfPerigee
    const nu   = meanToTrue(sat.orbit.meanAnomaly, e)
    const col  = new THREE.Color(orbitColor(index))

    // Orbit path
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(buildOrbitVertices(a, e, i, raan, aop), 3))
    const line = new THREE.LineLoop(lineGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 }))
    scene.add(line)
    orbitLines.push(line)

    // Satellite marker
    const pos  = keplerTo3D(a, e, i, raan, aop, nu)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.7 })
    )
    mesh.position.copy(pos)
    mesh.userData.satId = sat.id
    scene.add(mesh)

    satMeshes.push({ mesh, sat, a, e, i, raan, aop, nu })
  })

  // Auto-fit camera so all orbits are comfortably in frame.
  // FOV = 45°, half-angle tan ≈ 0.414. Add 30% padding.
  if (satMeshes.length > 0) {
    const maxRadius = Math.max(...satMeshes.map(s => s.a * (1 + s.e))) // apoapsis
    const fitted = (maxRadius / Math.tan((45 / 2) * Math.PI / 180)) * 1.3
    minZoom = Math.max(1.8, maxRadius * 1.1)
    maxZoom = fitted * 4
    targetZoom = fitted
    currentZoom = fitted
  }
}

// ─── Animation loop ───────────────────────────────────────────────────────────

function animate() {
  animId = requestAnimationFrame(animate)

  // Smooth zoom
  currentZoom += (targetZoom - currentZoom) * 0.08

  // Advance satellite positions along their orbits
  satMeshes.forEach(s => {
    const n  = Math.sqrt(1 / Math.pow(s.a, 3)) * 0.003  // angular speed proportional to orbit size
    s.nu    += n
    s.mesh.position.copy(keplerTo3D(s.a, s.e, s.i, s.raan, s.aop, s.nu))

    // Highlight selected satellite (fleet mode only)
    const isSelected = s.sat.id === selectedId.value
    s.mesh.scale.setScalar(isSelected ? 1.6 : 1)
    s.mesh.material.emissiveIntensity = isSelected ? 1.2 : 0.7
  })

  camera.position.x = Math.sin(rotY) * Math.cos(rotX) * currentZoom
  camera.position.y = Math.sin(rotX) * currentZoom
  camera.position.z = Math.cos(rotY) * Math.cos(rotX) * currentZoom
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

// ─── Interaction ──────────────────────────────────────────────────────────────

function onMouseDown(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY }
function onMouseUp()    { isDragging = false }
function onMouseMove(e) {
  if (!isDragging) return
  rotY += (e.clientX - lastX) * 0.007
  rotX  = Math.max(-1.4, Math.min(1.4, rotX + (e.clientY - lastY) * 0.007))
  lastX = e.clientX; lastY = e.clientY
}
function onWheel(e) {
  e.preventDefault()
  targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom + e.deltaY * 0.015))
}

// Click to select a satellite (fleet mode)
function onCanvasClick(e) {
  if (!renderer || !camera || isSingleMode.value) return
  const rect  = canvasRef.value.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width)  *  2 - 1,
    ((e.clientY - rect.top)  / rect.height) * -2 + 1
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(satMeshes.map(s => s.mesh))
  if (hits.length > 0) selectedId.value = hits[0].object.userData.satId
}

function onTouchStart(e) { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY }
function onTouchEnd()    { isDragging = false }
function onTouchMove(e) {
  if (!isDragging) return
  rotY += (e.touches[0].clientX - lastX) * 0.007
  rotX  = Math.max(-1.4, Math.min(1.4, rotX + (e.touches[0].clientY - lastY) * 0.007))
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
}

function onResize() {
  if (!renderer || !camera || !containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function selectSatellite(sat) {
  selectedId.value = selectedId.value === sat.id ? null : sat.id
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  initScene()
  animate()

  const canvas = canvasRef.value
  canvas.addEventListener('mousedown',  onMouseDown)
  canvas.addEventListener('click',      onCanvasClick)
  canvas.addEventListener('wheel',      onWheel,      { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchend',   onTouchEnd)
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: true })
  window.addEventListener('mousemove',  onMouseMove)
  window.addEventListener('mouseup',    onMouseUp)
  window.addEventListener('resize',     onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  renderer?.dispose()
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('mousedown',  onMouseDown)
    canvas.removeEventListener('click',      onCanvasClick)
    canvas.removeEventListener('wheel',      onWheel)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchend',   onTouchEnd)
    canvas.removeEventListener('touchmove',  onTouchMove)
  }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
  window.removeEventListener('resize',    onResize)
})

// Rebuild whenever the satellite data changes
watch(displaySatellites, () => { if (scene) buildSatellites() }, { deep: true })

defineExpose({ selectSatellite })
</script>

<style scoped>
.orbit-viewer {
  position: relative;
  width: 100%;
  /* height is set via the :style binding from the height prop */
  background: #020a14;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}

.orbit-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
.orbit-canvas:active { cursor: grabbing; }

/* ── HUD base ── */
.hud {
  position: absolute;
  background: rgba(2, 10, 24, 0.78);
  border: 1px solid rgba(100, 160, 255, 0.15);
  border-radius: 8px;
  padding: 12px 14px;
  color: #a0b8d8;
  font-size: 11px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.hud-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #5b9bd5;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Fleet mode: satellite list (top-left) ── */
.hud-satellites {
  top: 16px;
  left: 16px;
  min-width: 260px;
}

.hud-sat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.hud-sat-row:hover,
.hud-sat-row.active {
  background: rgba(91, 155, 213, 0.12);
}

.sat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.sat-name {
  flex: 1;
  color: #c8ddf0;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sat-norad {
  color: #4a6a8a;
  font-size: 10px;
  flex-shrink: 0;
}

.sat-risk {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

/* ── Fleet mode: detail panel (top-right) ── */
.hud-detail {
  top: 16px;
  right: 16px;
  width: 240px;
  max-height: calc(100% - 80px);
  overflow-y: auto;
}

.hud-detail::-webkit-scrollbar { width: 4px; }
.hud-detail::-webkit-scrollbar-track { background: transparent; }
.hud-detail::-webkit-scrollbar-thumb { background: rgba(91, 155, 213, 0.3); border-radius: 2px; }

.norad-badge {
  font-size: 9px;
  background: rgba(91, 155, 213, 0.15);
  border: 1px solid rgba(91, 155, 213, 0.25);
  color: #5b9bd5;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 400;
}

.detail-section {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #3a5a7a;
  text-transform: uppercase;
  margin: 10px 0 6px;
  border-top: 1px solid rgba(91, 155, 213, 0.1);
  padding-top: 8px;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
}

.detail-label { color: #4a6a8a; font-size: 10px; flex-shrink: 0; }
.detail-val   { color: #c0d8f0; font-size: 10px; text-align: right; word-break: break-all; }

/* ── Single mode: satellite name label (top-left) ── */
.hud-single-label {
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.single-name {
  color: #c8ddf0;
  font-size: 12px;
  font-weight: 600;
}

.single-norad {
  color: #4a6a8a;
  font-size: 10px;
}

/* ── Controls hint (bottom-center) ── */
.hud-controls {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #2a4a6a;
  white-space: nowrap;
  padding: 5px 14px;
  pointer-events: none;
}
.hud-controls span { color: #4a7aaa; }

/* ── Transitions ── */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
