<script setup>
import { computed, reactive, ref } from 'vue';
import { api } from '../api.js';

const props = defineProps({
  sessionId: { type: String, required: true },
  view: { type: Object, required: true },
  filters: { type: Object, required: true },
  categories: { type: Array, required: true },
  product: { type: String, required: true },
  version: { type: String, required: true },
});

const emit = defineEmits(['update:filters', 'mutated']);

const pending = ref(false);
const banner = ref('');
const editingId = ref('');
const itemInput = ref(null);
const adding = reactive({ name: '', quantity: 1, category: 'Produce', notes: '' });
const draft = reactive({ name: '', quantity: 1, category: 'Produce', notes: '' });

const rows = computed(() => props.view.items);
const summary = computed(() => props.view.summary);

function updateFilter(key, value) {
  emit('update:filters', { ...props.filters, [key]: value });
}

async function run(action) {
  if (pending.value) return;
  pending.value = true;
  banner.value = '';
  try {
    await action();
    emit('mutated');
  } catch (error) {
    banner.value = error.message;
  } finally {
    pending.value = false;
  }
}

function submitAdd() {
  run(async () => {
    await api.addItem(props.sessionId, {
      name: adding.name,
      quantity: Number(adding.quantity),
      category: adding.category,
      notes: adding.notes,
    });
    adding.name = '';
    adding.notes = '';
    itemInput.value?.focus();
  });
}

function startEdit(item) {
  editingId.value = item.id;
  draft.name = item.name;
  draft.quantity = Number(item.quantity) || 1;
  draft.category = item.category;
  draft.notes = item.notes;
  banner.value = '';
}

function saveEdit(item) {
  run(async () => {
    await api.updateItem(props.sessionId, item.id, {
      name: draft.name,
      quantity: Number(draft.quantity),
      category: draft.category,
      notes: draft.notes,
    });
    editingId.value = '';
  });
}

function labelFor(item) {
  return item.name.trim() || 'blank item';
}
</script>

<template>
  <section class="market" id="market-list" :aria-label="product">
    <header class="market-head">
      <div>
        <p class="eyebrow">Personal groceries</p>
        <h1>{{ product }}</h1>
      </div>
      <p class="version">{{ version }}</p>
    </header>

    <div class="stats">
      <p>
        <strong>{{ summary.itemCount }}</strong>
        <span>Items</span>
      </p>
      <p>
        <strong>{{ summary.showing }}</strong>
        <span>Showing</span>
      </p>
      <p>
        <strong>{{ summary.totalQuantity }}</strong>
        <span>Units to buy</span>
      </p>
    </div>

    <p v-if="banner" class="banner" role="alert">{{ banner }}</p>

    <form class="add-form" autocomplete="off" @submit.prevent="submitAdd">
      <label class="field grow">
        <span>Item</span>
        <input
          ref="itemInput"
          :value="adding.name"
          maxlength="80"
          @input="adding.name = $event.target.value"
        />
      </label>
      <label class="field field-qty">
        <span>Qty</span>
        <input v-model.number="adding.quantity" type="number" min="1" max="99" step="1" required />
      </label>
      <label class="field field-cat">
        <span>Category</span>
        <select v-model="adding.category">
          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label class="field grow">
        <span>Note <em>{{ adding.notes.length }}/200</em></span>
        <input v-model="adding.notes" maxlength="200" />
      </label>
      <button class="btn btn-primary" type="submit" :disabled="pending">Add</button>
    </form>

    <div class="toolbar">
      <label class="field grow">
        <span>Search</span>
        <input
          :value="filters.q"
          maxlength="80"
          @input="updateFilter('q', $event.target.value)"
        />
      </label>
      <label class="field field-cat">
        <span>Category</span>
        <select :value="filters.category" @change="updateFilter('category', $event.target.value)">
          <option value="All">All</option>
          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label class="field field-cat">
        <span>Show</span>
        <select :value="filters.status" @change="updateFilter('status', $event.target.value)">
          <option value="all">All</option>
          <option value="active">Still to buy</option>
          <option value="completed">Done</option>
        </select>
      </label>
      <label class="field field-cat">
        <span>Sort</span>
        <select :value="filters.sort" @change="updateFilter('sort', $event.target.value)">
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="category">Category</option>
        </select>
      </label>
      <button
        class="btn btn-ghost"
        type="button"
        :disabled="pending || summary.itemCount === 0"
        @click="run(() => api.toggleAll(sessionId))"
      >
        {{ summary.allCompleted ? 'Mark all not done' : 'Mark all done' }}
      </button>
      <button class="btn btn-ghost" type="button" :disabled="pending" @click="run(() => api.clearCompleted(sessionId))">
        Clear completed
      </button>
    </div>

    <p v-if="summary.itemCount === 0" class="empty">The list is empty. Add the first item.</p>
    <p v-else-if="rows.length === 0" class="empty">Nothing matches this search or filter.</p>

    <ul v-else class="items">
      <li v-for="item in rows" :key="item.id" class="item" :class="{ 'is-done': item.completed }">
        <form v-if="editingId === item.id" class="editor" @submit.prevent="saveEdit(item)">
          <label class="field">
            <span>Item</span>
            <input v-model="draft.name" maxlength="80" />
          </label>
          <label class="field">
            <span>Qty</span>
            <input v-model.number="draft.quantity" type="number" min="1" max="99" step="1" required />
          </label>
          <label class="field">
            <span>Category</span>
            <select v-model="draft.category">
              <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>
          <label class="field editor-note">
            <span>Note <em>{{ draft.notes.length }}/200</em></span>
            <textarea v-model="draft.notes" maxlength="200" rows="2"></textarea>
          </label>
          <div class="editor-actions">
            <button class="btn btn-primary" type="submit" :disabled="pending">Save</button>
            <button class="btn btn-ghost" type="button" @click="editingId = ''">Cancel</button>
          </div>
        </form>

        <div v-else class="item-row">
          <input
            type="checkbox"
            :checked="item.completed"
            :aria-label="`Mark ${labelFor(item)} done`"
            :disabled="pending"
            @click.prevent="run(() => api.updateItem(sessionId, item.id, { completed: !item.completed }))"
          />
          <div class="item-main">
            <p class="item-title" :class="{ 'is-blank': item.name.trim() === '' }">{{ item.name }}</p>
            <p class="item-meta">
              <span class="pill">{{ item.category }}</span>
              <span v-if="item.notes">{{ item.notes }}</span>
            </p>
          </div>
          <div class="stepper">
            <button
              type="button"
              :aria-label="`Decrease quantity for ${labelFor(item)}`"
              :disabled="pending"
              @click="run(() => api.stepItem(sessionId, item.id, 'down'))"
            >
              −
            </button>
            <span class="qty">{{ item.quantity }}</span>
            <button
              type="button"
              :aria-label="`Increase quantity for ${labelFor(item)}`"
              :disabled="pending"
              @click="run(() => api.stepItem(sessionId, item.id, 'up'))"
            >
              +
            </button>
          </div>
          <button class="btn btn-ghost btn-small" type="button" :disabled="pending" @click="startEdit(item)">
            Edit
          </button>
          <button
            class="btn btn-danger btn-small"
            type="button"
            :aria-label="`Delete ${labelFor(item)}`"
            :disabled="pending"
            @click="run(() => api.deleteItem(sessionId, item.id))"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
