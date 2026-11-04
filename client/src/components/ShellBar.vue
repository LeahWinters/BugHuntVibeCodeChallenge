<script setup>
defineProps({
  playerName: { type: String, default: '' },
  confirmed: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
});
</script>

<template>
  <header class="shell">
    <router-link to="/" class="brand">
      <span class="mark" aria-hidden="true">BH</span>
      <span>
        <strong>Bug Hunt</strong>
        <small>Build under test</small>
      </span>
    </router-link>
    <p v-if="playerName" class="who">{{ playerName }}</p>
    <p class="score">{{ confirmed }} confirmed · {{ score }} pts</p>
    <div class="shell-actions">
      <slot />
    </div>
  </header>
</template>
