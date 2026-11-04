<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api.js';
import { writeStorage } from '../storage.js';
import ShellBar from '../components/ShellBar.vue';
import SpecPanel from '../components/SpecPanel.vue';
import MarketBoard from '../components/MarketBoard.vue';
import ReportDrawer from '../components/ReportDrawer.vue';

const route = useRoute();
const session = ref(null);
const spec = ref(null);
const view = ref(null);
const ready = ref(false);
const loadError = ref('');
const drawer = ref(false);
const toast = ref('');
const filters = reactive({ q: '', category: 'All', status: 'all', sort: 'newest' });

let toastTimer = 0;
let filterTimer = 0;
let loadTicket = 0;

function showToast(message) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = '';
  }, 4600);
}

async function loadItems() {
  const ticket = ++loadTicket;
  try {
    const data = await api.items(route.params.id, { ...filters });
    if (ticket !== loadTicket) return;
    view.value = data;
  } catch (error) {
    if (ticket !== loadTicket) return;
    if (!view.value) loadError.value = error.message;
    else showToast(error.message);
  }
}

function setFilters(next) {
  filters.q = next.q;
  filters.category = next.category;
  filters.status = next.status;
  filters.sort = next.sort;
}

async function resetList() {
  if (!window.confirm('Put the sample groceries back? Your bug reports stay.')) return;
  try {
    await api.resetList(route.params.id);
    await loadItems();
    showToast('Sample groceries restored.');
  } catch (error) {
    showToast(error.message);
  }
}

function onFiled(nextSession, message) {
  session.value = nextSession;
  showToast(message);
}

onMounted(async () => {
  document.title = 'Bug Hunt · Market List';
  try {
    const [specData, sessionData] = await Promise.all([api.spec(), api.session(route.params.id)]);
    spec.value = specData;
    session.value = sessionData;
    await loadItems();
    if (!view.value) return;
    ready.value = true;
    writeStorage('bughunt.sessionId', route.params.id);
  } catch (error) {
    loadError.value = error.status === 404 ? 'That hunt does not exist on this machine.' : error.message;
  }
});

watch(
  filters,
  () => {
    if (!ready.value) return;
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      loadItems();
    }, 120);
  },
  { deep: true },
);

onUnmounted(() => {
  clearTimeout(toastTimer);
  clearTimeout(filterTimer);
});
</script>

<template>
  <a class="skip" href="#market-list">Skip to Market List</a>
  <ShellBar
    :player-name="session?.playerName || ''"
    :confirmed="session?.confirmedCount || 0"
    :score="session?.score || 0"
  >
    <button class="btn btn-ghost" type="button" :disabled="!ready" @click="resetList">Reset list</button>
    <button
      v-if="session && !session.revealed"
      class="btn btn-yellow"
      type="button"
      :aria-expanded="drawer"
      @click="drawer = true"
    >
      File a bug
    </button>
    <router-link v-if="session" class="btn btn-ghost" :to="`/hunt/${session.id}/debrief`">Answer key</router-link>
  </ShellBar>

  <main class="page">
    <p v-if="loadError" class="error-card">
      {{ loadError }}
      <router-link to="/">Back to the start</router-link>
    </p>
    <p v-else-if="!ready" class="loading">Loading the build…</p>
    <template v-else>
      <p v-if="session.revealed" class="banner">
        The answer key is open. You can keep using the list. Filing is closed.
        <router-link :to="`/hunt/${session.id}/debrief`">Review the key</router-link>
      </p>
      <div class="play">
        <SpecPanel :spec="spec" />
        <MarketBoard
          :session-id="session.id"
          :view="view"
          :filters="filters"
          :categories="spec.categories"
          :product="spec.product"
          :version="spec.version"
          @update:filters="setFilters"
          @mutated="loadItems"
        />
      </div>
    </template>
  </main>

  <ReportDrawer
    v-if="session && spec && !session.revealed"
    :open="drawer"
    :session-id="session.id"
    :reports="session.reports"
    :areas="spec.areas"
    :severities="spec.severities"
    @close="drawer = false"
    @filed="onFiled"
  />
  <p v-if="toast" class="toast" role="status">{{ toast }}</p>
</template>
