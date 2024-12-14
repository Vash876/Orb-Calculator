import { createRouter, createWebHistory } from 'vue-router';
import CurrentStats from '../components/CurrentStats.vue';
import ImprovedStats from '../components/ImprovedStats.vue';
import ShortCalculator from '../components/ShortsCalculator.vue';

const routes = [
  { path: '/current-stats', name: 'CurrentStats', component: CurrentStats },
  { path: '/improved-stats', name: 'ImprovedStats', component: ImprovedStats },
  { path: '/shorts-calculator', name: 'ShortsCalculator', component: ShortCalculator },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
