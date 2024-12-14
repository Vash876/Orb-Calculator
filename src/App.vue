<template>
  <div id="app">
    <!-- Navbar mit Current Orbs und Improved Orbs -->
    <div class="navbar">
      <div class="navbar-center">
        <router-link to="/current-stats">Current Stats</router-link>
        <router-link to="/improved-stats">Improved Stats</router-link>
        <router-link to="/shorts-calculator">Shorts Calculator</router-link>
      </div>
    </div>

    <!-- Router View für das Wechseln der Seiten -->
    <router-view />
  </div>
</template>

<script>
export default {
  watch: {
    // Aktualisiere die Werte, wenn sich die Navigation ändert
    $route() {
      this.$store.dispatch('setImprovedValues', this.$store.state.improvedValues);
    },
  },
  mounted() {
    // Prüfe, ob der Nutzer bereits auf einer Seite ist, sonst leite ihn zu Current Stats weiter
    if (this.$router.currentRoute.path !== '/current-stats') {
      this.$router.push('/current-stats');
    }
  },
};
</script>
