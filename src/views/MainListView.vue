<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MainListService } from '@/services/api-services/MainListService'
import type { IMainList } from '@/domain/IMainList'

const data = ref<IMainList | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const orbitFilter = ref<'all' | 'yes' | 'no'>('all')
const activeTab = ref<'all' | 'satellites' | 'debris'>('all')

onMounted(async () => {
  try {
    data.value = await MainListService.index()
  } catch (e) {
    error.value = 'Failed to load space object catalogue.'
  } finally {
    loading.value = false
  }
})

function matchesOrbit(hasOrbit: boolean) {
  if (orbitFilter.value === 'all') return true
  return orbitFilter.value === 'yes' ? hasOrbit : !hasOrbit
}

const filteredSatellites = computed(() => {
  if (!data.value) return []
  const q = search.value.toLowerCase()
  const orbit = orbitFilter.value
  return data.value.satellites.filter(s =>
    (orbit === 'all' || (orbit === 'yes') === s.hasOrbit) &&
    (!q || s.name.toLowerCase().includes(q) || s.operator.toLowerCase().includes(q))
  )
})

const filteredDebris = computed(() => {
  if (!data.value) return []
  const q = search.value.toLowerCase()
  const orbit = orbitFilter.value
  return data.value.debris.filter(d =>
    (orbit === 'all' || (orbit === 'yes') === d.hasOrbit) &&
    (!q || String(d.noradId).includes(q))
  )
})
</script>

<template>
  <div class="catalogue">
    <div v-if="loading" class="state-msg">Loading catalogue…</div>
    <div v-else-if="error" class="state-msg state-msg--error">{{ error }}</div>

    <template v-else-if="data">
      <!-- Controls -->
      <div class="controls">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input v-model="search" type="text" placeholder="Search objects…" />
        </div>
        <select v-model="orbitFilter">
          <option value="all">All orbits</option>
          <option value="yes">Has orbit</option>
          <option value="no">No orbit</option>
        </select>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in ['all', 'satellites', 'debris']"
          :key="tab"
          class="tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab as typeof activeTab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Satellites -->
      <section v-if="activeTab !== 'debris'" class="section">
        <h2 class="section-title">
          Satellites
          <span class="count-badge">{{ filteredSatellites.length }}</span>
        </h2>
        <div class="cards">
          <div v-for="sat in filteredSatellites" :key="sat.id" class="card card--sat">
            <div class="card-icon card-icon--sat">🛰</div>
            <div class="card-name">{{ sat.name }}</div>
            <div class="card-meta">{{ sat.operator }}</div>
            <span class="orbit-badge" :class="sat.hasOrbit ? 'orbit-badge--yes' : 'orbit-badge--no'">
              {{ sat.hasOrbit ? '✓ Has orbit' : '✗ No orbit' }}
            </span>
          </div>
          <div v-if="filteredSatellites.length === 0" class="empty">No satellites match.</div>
        </div>
      </section>

      <!-- Debris -->
      <section v-if="activeTab !== 'satellites'" class="section">
        <h2 class="section-title">
          Debris
          <span class="count-badge count-badge--debris">{{ filteredDebris.length }}</span>
        </h2>
        <div class="cards">
          <div v-for="d in filteredDebris" :key="d.id" class="card card--debris">
            <div class="card-icon card-icon--debris">⬡</div>
            <div class="card-name">{{ d.noradId }}</div>
            <div class="card-meta">{{ d.sizeEstimate.toFixed(2) }} m</div>
            <span class="orbit-badge" :class="d.hasOrbit ? 'orbit-badge--yes' : 'orbit-badge--no'">
              {{ d.hasOrbit ? '✓ Has orbit' : '✗ No orbit' }}
            </span>
          </div>
          <div v-if="filteredDebris.length === 0" class="empty">No debris match.</div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.catalogue {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.state-msg {
  color: #7a90a8;
  font-size: 0.9rem;
  padding: 2rem;
  text-align: center;
}
.state-msg--error { color: #f87171; }

/* Controls */
.controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 160px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a90a8;
  font-size: 1rem;
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  background: #0a1929;
  border: 1px solid #1e3350;
  border-radius: 8px;
  color: #e2eaf2;
  font-size: 0.85rem;
  outline: none;
}
.search-box input:focus { border-color: #38bdf8; }

select {
  padding: 0.5rem 0.75rem;
  background: #0a1929;
  border: 1px solid #1e3350;
  border-radius: 8px;
  color: #b0c4d8;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}
select:focus { border-color: #38bdf8; }

/* Tabs */
.tabs {
  display: flex;
  gap: 6px;
}

.tab {
  padding: 0.3rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #1e3350;
  background: transparent;
  color: #7a90a8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.tab.active,
.tab:hover {
  background: #0f2035;
  color: #e2eaf2;
  border-color: #38bdf8;
}

/* Section */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #b8cad9;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-radius: 10px;
  padding: 0.1rem 0.5rem;
}
.count-badge--debris {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

/* Cards grid */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.card {
  background: #0a1929;
  border: 1px solid #1e3350;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: border-color 0.15s;
}
.card:hover { border-color: #2d4f72; }

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 2px;
}
.card-icon--sat { background: rgba(56, 189, 248, 0.12); }
.card-icon--debris { background: rgba(251, 191, 36, 0.12); }

.card-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2eaf2;
  line-height: 1.3;
  word-break: break-word;
}

.card-meta {
  font-size: 0.75rem;
  color: #7a90a8;
}

.orbit-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  margin-top: 4px;
  width: fit-content;
}
.orbit-badge--yes {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}
.orbit-badge--no {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #7a90a8;
  font-size: 0.85rem;
  padding: 1.5rem;
}
</style>