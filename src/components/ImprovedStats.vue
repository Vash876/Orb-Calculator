<template>
  <div class="improved-stats">
    <div class="inputs-container">
      <div class="input-group">
        <button class="reset" @click="resetImprovedFields">Reset All Fields</button>
      </div>
      <!-- Catch-Up Multiplier -->
      <div class="input-group">
        <label>Catch-Up Multiplier</label>
        <span class="boost-value">
          {{ formatNumber(improvedCupMultiplier) }}
        </span>
      </div>

      <!-- Additional Hours Input -->
      <div class="input-group">
        <label>Additional Hours</label>
        <input
          type="number"
          v-model.number="improvedValues.additionalHours"
          @input="handleAdditionalHoursInput"
          :placeholder="'Enter additional hours'"
          :class="getFieldBackgroundClass('additionalHours')"
          :disabled="isFieldDisabled('additionalHours')"
        />
        <span class="boost-value">
          {{ formatNumber(Math.pow(improvedBoostMultipliers['additionalHours'],2) || 1) }}
        </span>
      </div>

      <!-- Inputs für Boosts -->
      <div v-for="boost in boosts" :key="boost.key">
        <template v-if="boost.key === 'hoursInTR'">
          <!-- Überspringe diesen Boost -->
        </template>
        <template v-else>
          <div class="input-group">
            <label class="tooltip-container">
              {{ boost.label }}
              <span v-if="boost.tooltip != 0" class="tooltip-text">{{ boost.tooltip }}</span>
            </label>

            <!-- Eingabefeld für numerische Werte -->
            <input
              type="number"
              v-if="boost.type === 'number'"
              v-model.number="improvedValues[boost.key]"
              @input="handleImprovedInputChange(boost)"
              :placeholder="boost.placeholder || ''"
              :max="boost.max || null"
              :class="getFieldBackgroundClass(boost.key)"
              :disabled="isFieldDisabled(boost.key)"
            />

            <!-- Checkboxen für Boolean-Werte -->
            <input
              v-if="boost.type === 'boolean'"
              v-model="improvedValues[boost.key]"
              @change="handleImprovedCheckboxChange(boost)"
              type="checkbox"
              :class="getFieldBackgroundClass(boost.key)"
              :disabled="isFieldDisabled(boost.key)"
            />

            <!-- Multiplier-Anzeige -->
            <span class="boost-value">
              <template v-if="boost.key === 'loopMods'">
                1
              </template>
              <template v-else>
                {{ formatNumber(improvedBoostMultipliers[boost.key] || 1) }}
              </template>
            </span>
          </div>
        </template>
      </div>

      <!-- Orb Count -->
      <div class="current-results">
        <h3>Final Orb Count  : {{ formatNumber(improvedOrbs) }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import { boosts } from '../store/boosts';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      improvedBoostMultipliers: {}, // Speichert Multiplikatoren für jeden Boost
      improvedCupMultiplier: 1, // Speichert den Catch-Up Multiplier
      improvedValues: {
        additionalHours: 0, // Eingabewert für zusätzliche Stunden
      },
      totalHoursInTR: 0, // Berechnete Gesamtstunden
    };
  },
  computed: {
    boosts() {
      return boosts; // Boost-Daten aus der Datei
    },
    currentValues() {
      return this.$store.state.currentValues; // Aktuelle Werte aus Current Stats
    },
    ...mapGetters(['currentOrbs', 'improvedOrbs']), // Zugriff auf Getter von Vuex
  },
  methods: {
    formatNumber(value) {
      const suffixes = ["", "", "m", "b", "t", "qa", "qu", "sx", "sp", "oc", "n", "d"];
      let tier = Math.floor(Math.log10(value) / 3);

      console.log(`Value: ${value}, Tier: ${tier}, Suffix: ${suffixes[tier]}`);

      if (tier === 0) {
        return value.toFixed(2);
      }

      if (tier >= suffixes.length) {
        return value.toExponential(2);
      }

      const suffix = suffixes[tier];
      const scaledValue = value / Math.pow(10, tier * 3);

      return `${scaledValue.toFixed(2)}${suffix}`;
    },
    formatExponential(value) {
      return value.replace('+', '');
    },
    handleAdditionalHoursInput() {
      // Aktualisiere Multiplikatoren und speichere Werte
      this.updateImprovedBoostMultipliers();
      this.saveToLocalStorage();
    },
    isFieldDisabled(key) {
      const boost = this.boosts.find(b => b.key === key);
      if (boost && boost.type === 'number') {
        return this.currentValues[key] === boost.max;
      }
      if (boost && boost.type === 'boolean') {
        return this.currentValues[key] === true;
      }
      return false;
    },
    getFieldBackgroundClass(key) {
      const improvedValue = this.improvedValues[key];
      const currentValue = this.currentValues[key];

      if (improvedValue > currentValue) {
        return 'field-green'; // Grüner Hintergrund
      } else if (improvedValue === currentValue) {
        return 'field-blue'; // Blauer Hintergrund
      }
      return ''; // Kein spezieller Hintergrund
    },
    initializeImprovedValues() {
      this.boosts.forEach(boost => {
        const key = boost.key;

        if (key === 'hoursInTR') return; // Überspringe hoursInTR

        // Werte aus Current Stats übernehmen, wenn kein höherer Wert in Improved Stats vorliegt
        if (
          this.improvedValues[key] === undefined ||
          this.improvedValues[key] <= this.currentValues[key]
        ) {
          this.improvedValues[key] = this.currentValues[key];
        }
      });
      // Initialisiere totalHoursInTR
      this.updateImprovedBoostMultipliers();
    },
    handleImprovedInputChange(boost) {
      const max = boost.max || Infinity; // Maximalwert prüfen
      const key = boost.key; // Schlüssel des aktuellen Boosts
      const value = this.improvedValues[key]; // Aktueller Wert

      // Wenn der Wert den Maximalwert überschreitet, setze ihn auf den Maximalwert zurück
      if (value > max) {
        this.improvedValues[key] = max;
      }

      // Aktualisiere die Multiplikatoren und speichere die Werte
      this.updateImprovedBoostMultipliers();
      this.saveToLocalStorage();
    },
      handleImprovedCheckboxChange(boost) {
      const key = boost.key; // Schlüssel des Boosts
      const value = this.improvedValues[key]; // Aktueller Wert der Checkbox

      // Wert im Zustand aktualisieren
      this.improvedValues = { ...this.improvedValues, [key]: value };

      // Boost-Multiplikatoren und Local Storage aktualisieren
      this.updateImprovedBoostMultipliers();
      this.saveToLocalStorage();
    },

    updateImprovedBoostMultipliers() {
      const values = this.improvedValues;
      const multipliers = {};

      // Berechnung der zusätzlichen Stunden
      const totalHoursInTR = (this.currentValues.hoursInTR || 0) + (values.additionalHours || 0);

      // Berechnung des Catch-Up Multis
      this.improvedCupMultiplier = this.calculateImprovedCupMultiplier(totalHoursInTR);

      // Berechnung des Boosts für Additional Hours
      multipliers['additionalHours'] = this.calculateHoursInTRMultiplier({
        hoursInTR: totalHoursInTR,
        loopMods: this.currentValues.loopMods || 0,
      });

      this.boosts.forEach(boost => {
        const value = values[boost.key];
        if (boost.type === 'number' && value !== undefined) {
          if (typeof boost.multiplier === 'function') {
            multipliers[boost.key] = boost.multiplier(value) || 1;
          } else {
            multipliers[boost.key] = 1;
          }
        } else if (boost.type === 'boolean' && value) {
          multipliers[boost.key] = boost.multiplier || 1;
        } else {
          multipliers[boost.key] = 1; // Standardwert
        }
      });

      this.improvedBoostMultipliers = multipliers; // Speichere die berechneten Multiplikatoren

      // Aktualisierung im Store sicherstellen
      this.$store.dispatch('setImprovedValues', values); // Speichere die verbesserten Werte im Store
    },
    calculateImprovedCupMultiplier(hoursInTR) {
      if (!hoursInTR) return 1;
      return Math.min(2, Math.max(1, (hoursInTR * 0.00024) / 0.25 + 1));
    },
    calculateHoursInTRMultiplier(values) {
      const hoursInTR = values.hoursInTR || 0;
      const loopMods = values.loopMods || 0;

      try {
        return Math.sqrt(
          Math.pow(
            1 + Math.pow(hoursInTR, Math.min(2.42, 1.02 + hoursInTR * 0.00256)) *
            Math.pow(loopMods, Math.min(2.42, 1.02 + loopMods * 0.00005)),
            0.06
          )
        );
      } catch (error) {
        console.error('Error in calculateHoursInTRMultiplier:', error);
        return 1;
      }
    },
    resetImprovedFields() {
      const resetValues = { additionalHours: 0 };
      this.boosts.forEach(boost => {
        if (boost.type === 'number') {
          resetValues[boost.key] = 0;
        } else if (boost.type === 'boolean') {
          resetValues[boost.key] = false;
        }
      });
      this.improvedValues = resetValues;
      this.updateImprovedBoostMultipliers();
      this.saveToLocalStorage();
    },
    saveToLocalStorage() {
      localStorage.setItem('improvedValues', JSON.stringify(this.improvedValues));
    },
    loadFromLocalStorage() {
      const savedValues = localStorage.getItem('improvedValues');
      if (savedValues) {
        this.improvedValues = JSON.parse(savedValues);
      } else {
        this.resetImprovedFields();
      }
    },
  },
  mounted() {
    this.loadFromLocalStorage();
    this.initializeImprovedValues();
    this.updateImprovedBoostMultipliers(); // Aktualisiere die Boost-Multiplikatoren
  },
};
</script>
