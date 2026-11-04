import { createRouter, createWebHistory } from 'vue-router';
import WelcomeView from './views/WelcomeView.vue';
import HuntView from './views/HuntView.vue';
import DebriefView from './views/DebriefView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'welcome', component: WelcomeView },
    { path: '/hunt/:id', name: 'hunt', component: HuntView },
    { path: '/hunt/:id/debrief', name: 'debrief', component: DebriefView },
  ],
});
