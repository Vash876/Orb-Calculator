<template>
  <div class="current-stats">
    <div class="inputs-container">
      <div class="input-group">
        <button class="reset" @click="resetFields">Reset All Fields</button>
      </div>
      <!-- Catch-Up Multiplier -->
      <div class="input-group">
        <label>Catch-Up Multiplier</label>
        <span class="boost-value">
          {{ formatBoostValue(cupMultiplier) }}
        </span>
      </div>

      <!-- Inputs für Boosts -->
      <div v-for="boost in boosts" :key="boost.key" class="input-group">
        <label class="tooltip-container">
          {{ boost.label }}
          <span v-if="boost.tooltip != 0" class="tooltip-text">{{ boost.tooltip }}</span>
        </label>

        <!-- Eingabefeld für numerische Werte -->
        <input 
          type="number"
          v-if="boost.type === 'number'"
          v-model.number="currentValues[boost.key]"
          @input="handleInputChange(boost)"
          :placeholder="boost.placeholder || ''"
          :max="boost.max || null"
        />

        <!-- Checkboxen für Boolean-Werte -->
        <input
          v-if="boost.type === 'boolean'"
          v-model="currentValues[boost.key]"
          @change="handleCheckboxChange(boost)"
          type="checkbox"
        />

        <span class="boost-value">
          <!-- Nur bei hoursInTR den Gesamtwert anzeigen -->
          <template v-if="boost.key === 'loopMods'">
            1
          </template>
          <template v-else-if="boost.key === 'hoursInTR'">
            {{ formatBoostValue(Math.pow(boostMultipliers[boost.key], 2) || 1) }}
          </template>
          <template v-else>
            {{ formatBoostValue(boostMultipliers[boost.key] || 1) }}
          </template>
        </span>
      </div>

      <!-- Orb Count -->
      <div class="current-results">
        <h3>Current Orb Count: {{ formatExponential(currentOrbs) }}</h3>
      </div>
    </div>
  </div>
</template>


<script>
import { mapGetters, mapActions } from 'vuex';
import { boosts } from '../store/boosts';

export default {
  data() {
    return {
      boostMultipliers: {}, // Speichert Multiplikatoren für jeden Boost
      cupMultiplier: 1, // Speichert den Catch-Up Multiplier
    };
  },
  computed: {
    ...mapGetters(['currentOrbs']),
    boosts() {
      return boosts; // Boost-Daten aus der Datei
    },
    currentValues() {
      return this.$store.state.currentValues; // Aktuelle Werte aus Vuex
    },
  },
  methods: {
    formatExponential(value) {
      return value.replace('+', '');
    },
    ...mapActions(['setCurrentValues']),
    handleInputChange(boost) {
      const max = boost.max || Infinity;
      const key = boost.key;
      const value = this.currentValues[key];

      // Begrenze den Wert auf den Maximalwert
      if (value > max) {
        this.currentValues[key] = max;
      }

      // Aktualisiere die Multiplikatoren
      this.updateBoostMultipliers();
      this.saveToLocalStorage();
    },
    handleCheckboxChange(boost) {
      const key = boost.key;
      const value = this.currentValues[key];

      // Checkbox-Wert speichern und Multiplikatoren aktualisieren
      this.setCurrentValues({ ...this.currentValues, [key]: value });
      this.updateBoostMultipliers();
      this.saveToLocalStorage();
    },
    resetFields() {
      // Setze alle numerischen und boolean Felder zurück
      const resetValues = {};
      this.boosts.forEach(boost => {
        if (boost.type === 'number') {
          resetValues[boost.key] = 0;
        } else if (boost.type === 'boolean') {
          resetValues[boost.key] = false;
        }
      });
      this.setCurrentValues(resetValues); // Vuex-Store aktualisieren
      this.updateBoostMultipliers(); // Multiplikatoren aktualisieren
      this.saveToLocalStorage();
    },
    updateBoostMultipliers() {
      const values = this.currentValues;
      const multipliers = {};

      // Berechnung des Catch-Up Multis
      this.cupMultiplier = this.calculateCupMultiplier(values.hoursInTR);

      this.boosts.forEach(boost => {
        const value = values[boost.key];
        if (boost.type === 'number' && value !== undefined) {
          if (boost.key === 'hoursInTR' || boost.key === 'loopMods') {
            multipliers[boost.key] = this.calculateHoursInTRMultiplier(values);
          } else if (typeof boost.multiplier === 'function') {
            multipliers[boost.key] = boost.multiplier(value) || 1;
          } else {
            multipliers[boost.key] = 1; // Fallback-Wert
          }
        } else if (boost.type === 'boolean' && value) {
          multipliers[boost.key] = boost.multiplier || 1;
        } else {
          multipliers[boost.key] = 1; // Standardwert
        }
      });

      this.boostMultipliers = multipliers; // Multiplikatoren speichern
    },
    calculateCupMultiplier(hoursInTR) {
      if (!hoursInTR) return 1; // Standardwert
      return Math.min(2, Math.max(1, (hoursInTR * 0.00024) / 0.25 + 1));
    },
    calculateHoursInTRMultiplier(values) {
      const hoursInTR = values.hoursInTR || 0;
      const loopMods = values.loopMods || 0;

      try {
        // Exponentielle Berechnung
        return Math.sqrt(
          Math.pow(
            1 + Math.pow(hoursInTR, Math.min(2.42, 1.02 + hoursInTR * 0.00256)) *
            Math.pow(loopMods, Math.min(2.42, 1.02 + loopMods * 0.00005)),
            0.06
          )
        );
      } catch (error) {
        console.error('Error in calculateHoursInTRMultiplier:', error);
        return 1; // Standardwert
      }
    },
    saveToLocalStorage() {
      localStorage.setItem('currentValues', JSON.stringify(this.currentValues));
    },
    loadFromLocalStorage() {
      const savedValues = localStorage.getItem('currentValues');
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        if (Object.keys(parsedValues).length > 0) {
          this.setCurrentValues(parsedValues); // Vuex-Store aktualisieren
          this.updateBoostMultipliers();
        }
      }
    },
    formatBoostValue(value) {
      try {
        if (value >= 1000000) {
          return value.toExponential(2);
        }
        return value.toFixed(2);
      } catch (error) {
        console.error('Error formatting boost value:', error);
        return '1.00';
      }
    },
  },
  mounted() {
    if (Object.keys(this.currentValues).length === 0) {
      // Wenn der Store leer ist, lade Werte aus dem Local Storage
      this.loadFromLocalStorage();
    } else {
      // Andernfalls speichere den aktuellen Zustand
      this.saveToLocalStorage();
    }
    // Aktualisiere die Boost-Multiplikatoren beim Laden
    this.updateBoostMultipliers();
  },
};
</script>
