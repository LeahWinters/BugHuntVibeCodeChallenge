<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api.js';
import { writeStorage } from '../storage.js';
import ShellBar from '../components/ShellBar.vue';

const route = useRoute();
const router = useRouter();
const session = ref(null);
const debrief = ref(null);
const loadError = ref('');
const confirming = ref(false);
const pending = ref(false);
const confirmButton = ref(null);

const looseReports = computed(() =>
  (session.value?.reports || []).filter((report) => report.result.status !== 'matched'),
);

async function load() {
  const data = await api.debrief(route.params.id);
  session.value = data.session;
  debrief.value = data.debrief;
}

async function askReveal() {
  confirming.value = true;
  await nextTick();
  confirmButton.value?.focus();
}

function onKeydown(event) {
  if (event.key === 'Escape') confirming.value = false;
}

async function reveal() {
  pending.value = true;
  try {
    const data = await api.reveal(route.params.id);
    session.value = data.session;
    debrief.value = data.debrief;
    confirming.value = false;
  } catch (error) {
    loadError.value = error.message;
  } finally {
    pending.value = false;
  }
}

async function again() {
  pending.value = true;
  try {
    const created = await api.createSession(session.value.playerName);
    writeStorage('bughunt.sessionId', created.id);
    router.push(`/hunt/${created.id}`);
  } catch (error) {
    loadError.value = error.message;
    pending.value = false;
  }
}

onMounted(async () => {
  document.title = 'Bug Hunt · Answer key';
  window.addEventListener('keydown', onKeydown);
  try {
    await load();
  } catch (error) {
    loadError.value = error.status === 404 ? 'That hunt does not exist on this machine.' : error.message;
  }
});

onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <ShellBar
    :player-name="session?.playerName || ''"
    :confirmed="session?.confirmedCount || 0"
    :score="session?.score || 0"
  >
    <router-link v-if="session" class="btn btn-ghost" :to="`/hunt/${session.id}`">Back to the list</router-link>
  </ShellBar>

  <main class="page debrief">
    <p v-if="loadError" class="error-card">
      {{ loadError }}
      <router-link to="/">Back to the start</router-link>
    </p>
    <p v-else-if="!debrief" class="loading">Loading the debrief…</p>

    <template v-else-if="!debrief.revealed">
      <section class="sealed">
        <p class="eyebrow">Answer key</p>
        <h1>The key is still sealed.</h1>
        <p class="lede">
          {{ debrief.confirmedCount }} confirmed · {{ debrief.score }} pts. Open the key when the group is
          ready to walk through what was found and what was missed. Filing closes after you open it. The
          list stays available.
        </p>
        <button class="btn btn-yellow" type="button" @click="askReveal">Open the answer key</button>
      </section>
    </template>

    <template v-else>
      <header class="debrief-hero">
        <p class="eyebrow">Debrief</p>
        <h1>{{ debrief.score }} <span>of {{ debrief.maxScore }}</span></h1>
        <p class="lede">
          {{ debrief.confirmedCount }} of {{ debrief.totalBugs }} defects confirmed. Missed cards are the ones
          to reproduce together. The steps start from the sample list.
        </p>
        <button class="btn btn-ink" type="button" :disabled="pending" @click="again">Start a new hunt</button>
      </header>

      <div class="key-list">
        <article
          v-for="bug in debrief.bugs"
          :key="bug.id"
          class="key-card"
          :class="bug.found ? 'is-found' : 'is-missed'"
        >
          <header>
            <span class="stamp">{{ bug.found ? 'Found' : 'Missed' }}</span>
            <span class="pill">{{ bug.area }}</span>
            <span class="pill">{{ bug.severity }}</span>
            <strong>{{ bug.pointsAwarded }} / {{ bug.maxPoints }}</strong>
          </header>
          <h2>{{ bug.title }}</h2>
          <p v-if="bug.reportTitle" class="yours">Your report: {{ bug.reportTitle }}</p>
          <dl>
            <div>
              <dt>Steps</dt>
              <dd>{{ bug.steps }}</dd>
            </div>
            <div>
              <dt>Expected</dt>
              <dd>{{ bug.expected }}</dd>
            </div>
            <div>
              <dt>Actual</dt>
              <dd>{{ bug.actual }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <section v-if="looseReports.length" class="loose">
        <h2>Reports that didn’t confirm a defect</h2>
        <article v-for="report in looseReports" :key="report.id">
          <h3>{{ report.title }}</h3>
          <p>{{ report.result.message }}</p>
        </article>
      </section>
    </template>
  </main>

  <div v-if="confirming" class="backdrop" @click="confirming = false">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
      @click.stop
    >
      <h2 id="reveal-title">Open the answer key?</h2>
      <p>This ends scoring for the hunt. You can still use Market List, and you can’t file more reports.</p>
      <div class="modal-actions">
        <button ref="confirmButton" class="btn btn-ghost" type="button" @click="confirming = false">
          Keep hunting
        </button>
        <button class="btn btn-yellow" type="button" :disabled="pending" @click="reveal">
          {{ pending ? 'Opening…' : 'Open the key' }}
        </button>
      </div>
    </div>
  </div>
</template>
