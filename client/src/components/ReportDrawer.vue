<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { api } from '../api.js';

const props = defineProps({
  open: { type: Boolean, default: false },
  sessionId: { type: String, required: true },
  reports: { type: Array, default: () => [] },
  areas: { type: Array, required: true },
  severities: { type: Array, required: true },
});

const emit = defineEmits(['close', 'filed']);

const form = reactive({
  title: '',
  area: '',
  severity: '',
  steps: '',
  expected: '',
  actual: '',
});
const pending = ref(false);
const notice = ref(null);
const titleInput = ref(null);

const orderedReports = computed(() => [...props.reports].reverse());

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    await nextTick();
    titleInput.value?.focus();
  },
);

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) emit('close');
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

function validate() {
  if (form.title.trim().length < 8) return 'Title should be at least 8 characters.';
  if (!form.area) return 'Pick an area.';
  if (!form.severity) return 'Pick a severity.';
  if (form.steps.trim().length < 20) return 'Steps should be at least 20 characters.';
  if (form.expected.trim().length < 10) return 'Expected should be at least 10 characters.';
  if (form.actual.trim().length < 10) return 'Actual should be at least 10 characters.';
  return '';
}

function resetForm() {
  form.title = '';
  form.area = '';
  form.severity = '';
  form.steps = '';
  form.expected = '';
  form.actual = '';
}

async function submit() {
  const problem = validate();
  if (problem) {
    notice.value = { status: 'unmatched', message: problem };
    return;
  }
  pending.value = true;
  notice.value = null;
  try {
    const data = await api.fileReport(props.sessionId, {
      title: form.title,
      area: form.area,
      severity: form.severity,
      steps: form.steps,
      expected: form.expected,
      actual: form.actual,
    });
    notice.value = { status: data.report.result.status, message: data.report.result.message };
    emit('filed', data.session, data.report.result.message);
    if (data.report.result.status === 'matched' || data.report.result.status === 'duplicate') resetForm();
  } catch (error) {
    notice.value = { status: 'unmatched', message: error.message };
  } finally {
    pending.value = false;
  }
}

function chip(status) {
  if (status === 'matched') return 'Confirmed';
  if (status === 'ambiguous') return 'Split this';
  if (status === 'duplicate') return 'Already filed';
  return 'Not confirmed';
}
</script>

<template>
  <div v-show="open" class="backdrop" @click="emit('close')" @keydown="onKeydown"></div>
  <aside
    v-show="open"
    class="drawer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="report-title"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <header class="drawer-head">
      <div>
        <p class="eyebrow">Bug report</p>
        <h2 id="report-title">File one defect</h2>
      </div>
      <button class="btn btn-ghost btn-small" type="button" @click="emit('close')">Close</button>
    </header>
    <p class="drawer-lead">
      Name the control, the steps, what the spec says, and what the build did. One behavior per report.
    </p>

    <form class="report-form" @submit.prevent="submit">
      <label class="field">
        <span>Title</span>
        <input ref="titleInput" v-model="form.title" maxlength="120" placeholder="What failed, in one sentence" />
      </label>
      <div class="split">
        <label class="field">
          <span>Area</span>
          <select v-model="form.area">
            <option value="">Choose area</option>
            <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
          </select>
        </label>
        <label class="field">
          <span>Severity</span>
          <select v-model="form.severity">
            <option value="">Choose severity</option>
            <option v-for="item in severities" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
        </label>
      </div>
      <p v-if="form.severity" class="hint">
        {{ severities.find((item) => item.id === form.severity)?.hint }}
      </p>
      <label class="field">
        <span>Steps</span>
        <textarea v-model="form.steps" maxlength="1000" rows="4" placeholder="Which controls you used, and the data you started with"></textarea>
      </label>
      <label class="field">
        <span>Expected</span>
        <textarea v-model="form.expected" maxlength="600" rows="3" placeholder="What the spec says should happen"></textarea>
      </label>
      <label class="field">
        <span>Actual</span>
        <textarea v-model="form.actual" maxlength="600" rows="3" placeholder="What the build did instead"></textarea>
      </label>
      <p v-if="notice" class="notice" :class="`is-${notice.status}`" role="status">{{ notice.message }}</p>
      <button class="btn btn-ink" type="submit" :disabled="pending">{{ pending ? 'Filing…' : 'File report' }}</button>
    </form>

    <section class="history" aria-label="Reports filed this hunt">
      <h3>This hunt</h3>
      <p v-if="orderedReports.length === 0" class="hint">Nothing filed yet.</p>
      <article v-for="report in orderedReports" :key="report.id" class="report" :class="`is-${report.result.status}`">
        <p class="chip">{{ chip(report.result.status) }}</p>
        <h4>{{ report.title }}</h4>
        <p>{{ report.result.message }}</p>
      </article>
    </section>
  </aside>
</template>
