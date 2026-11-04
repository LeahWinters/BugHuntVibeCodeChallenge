<script setup>
defineProps({
  spec: { type: Object, required: true },
});
</script>

<template>
  <aside class="spec" aria-labelledby="spec-title">
    <p class="eyebrow">{{ spec.product }} {{ spec.version }}</p>
    <h2 id="spec-title">How it should work</h2>
    <p class="spec-lead">{{ spec.summary }}</p>
    <section v-for="rule in spec.rules" :key="rule.id" class="rule">
      <h3>{{ rule.title }}</h3>
      <ul>
        <li v-for="point in rule.points" :key="point">{{ point }}</li>
      </ul>
    </section>
  </aside>
</template>
