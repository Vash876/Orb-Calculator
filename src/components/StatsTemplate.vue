<template>
  <div class="stats-template">
    <h2>{{ title }}</h2>
    <div class="result-box">
      <h3>Current Orbs:</h3>
      <p>{{ formatScientific(currentOrbs) }}</p>

      <h3>Improved Orbs:</h3>
      <p>{{ formatScientific(improvedOrbs) }}</p>
      
      <h3>Improvement:</h3>
      <p>{{ formatScientific(improvement) }}</p>
    </div>
  </div>
</template>

<script>
// Importiere die Berechnungsfunktionen und die Boost-Daten
import { boosts } from '../store/boosts';
import { mapGetters } from 'vuex';
import { calculateOrbs } from '../utils/calculations';

export default {
  props: ['title'],
  computed: {
    ...mapGetters(['currentValues', 'improvedValues']),
    boosts: () => boosts,
    currentOrbs() {
      return calculateOrbs(this.currentValues);
    },
    improvedOrbs() {
      return calculateOrbs(this.improvedValues);
    },
    improvement() {
      return this.improvedOrbs - this.currentOrbs;
    }
  },
  methods: {
    formatScientific(value) {
      return value.toExponential(2); // Formatierung in wissenschaftliche Notation
    }
  }
};
</script>

