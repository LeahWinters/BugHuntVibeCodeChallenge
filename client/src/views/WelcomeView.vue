<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api.js';
import { readStorage, writeStorage } from '../storage.js';

const router = useRouter();
const name = ref(readStorage('bughunt.playerName'));
const resume = ref(null);
const pending = ref(false);
const error = ref('');

onMounted(async () => {
  document.title = 'Bug Hunt';
  const id = readStorage('bughunt.sessionId');
  if (!id) return;
  try {
    resume.value = await api.session(id);
  } catch {
    writeStorage('bughunt.sessionId', '');
  }
});

async function start() {
  pending.value = true;
  error.value = '';
  try {
    const session = await api.createSession(name.value);
    writeStorage('bughunt.playerName', session.playerName);
    writeStorage('bughunt.sessionId', session.id);
    router.push(`/hunt/${session.id}`);
  } catch (err) {
    error.value = err.message;
    pending.value = false;
  }
}
</script>

<template>
  <main class="welcome">
    <p class="mark" aria-hidden="true">BH</p>
    <p class="eyebrow">A practice counter for UI testing</p>
    <h1>Find what the build got wrong.</h1>
    <p class="lede">
      Market List is a grocery list at 0.9.4-rc. The spec says how it should behave. Walk that contract
      like a tester: happy path, edges, and one control at a time. When the build breaks a line of the
      spec, file a report.
    </p>
    <ol class="steps">
      <li>Read the spec beside the list. It is the contract, not a suggestion.</li>
      <li>Use the list the way a shopper would. Some behavior is solid. Check before you file.</li>
      <li>File one defect per report. A confirmed hit names the control and the exact result.</li>
    </ol>

    <form class="start-card" @submit.prevent="start">
      <label class="field">
        <span>Your name</span>
        <input v-model="name" maxlength="40" autocomplete="name" placeholder="Optional" />
      </label>
      <button class="btn btn-ink" type="submit" :disabled="pending">
        {{ pending ? 'Starting…' : 'Start the hunt' }}
      </button>
      <p v-if="error" class="banner" role="alert">{{ error }}</p>
      <router-link v-if="resume" class="resume" :to="`/hunt/${resume.id}`">
        Resume {{ resume.playerName }} · {{ resume.confirmedCount }} confirmed
      </router-link>
    </form>
    <p class="fine">Reports stay on this machine.</p>
  </main>
</template>
