<template>
  <div class="shorts-calculator">
    <h2>Shorts Calculator</h2>
    <div class="inputs-container">
      <!-- Buttons für Auto-Fill und Reset -->
      <div class="input-group">
        <button @click="autoFillWithImprovedStats">Auto-Fill with Improved Stats</button>
        <button @click="resetFields">Reset All Fields</button>
      </div>


      <!-- TR Count Eingabe -->
      <div class="input-group">
        <label>TR Count</label>
        <input
          type="number"
          v-model.number="shortsValues.trCount"
          @input="updateShortsCalculations"
          :placeholder="'Enter TR Count'"
        />
      </div>

      <!-- All-Time Orbs Eingabe -->
      <div class="input-group">
        <label>All-Time Orbs</label>
        <input
          type="text"
          v-model="allTimeOrbsInput"
          @input="handleAllTimeOrbsTyping"
          @blur="validateAllTimeOrbsInput"
          placeholder="e.g 4.5e9"
        />
      </div>

      <!-- Inputs für Boosts -->
      <div v-for="boost in boosts" :key="boost.key" class="input-group">
        <label>{{ boost.label }}</label>
        
        <!-- Eingabefeld für numerische Werte -->
        <input
          type="number"
          v-if="boost.type === 'number'"
          v-model.number="shortsValues[boost.key]"
          @input="updateShortsCalculations"
          :placeholder="boost.placeholder || ''"
          :max="boost.max || null"
        />
        
        <!-- Checkboxen für Boolean-Werte -->
        <input
          v-if="boost.type === 'boolean'"
          v-model="shortsValues[boost.key]"
          @change="updateShortsCalculations"
          type="checkbox"
        />
      </div>
    </div>

    <!-- Ergebnisse -->
    <div class="results">
      <h3>Orb Requirements and Results</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>TR Requirement</th>
            <th>All-Time Orbs</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(requirement, index) in trRequirements" :key="index">
            <td>TR {{ shortsValues.trCount + index }} Requirement: {{ requirement }}</td>
           <td :class="{'missing-orbs': !orbResults[index].canReach}">
            {{ orbResults[index].endAllTimeOrbs }} 
            <span class="added-orbs">(+
              {{ orbResults[index].addedAllTimeOrbs }}
            )</span>
          </td>
            <td>
              <span
                :class="{'fulfilled': orbResults[index].canReach, 'missing': !orbResults[index].canReach}">
                {{ orbResults[index].canReach ? 'Fulfilled' : 'Missing (' + orbResults[index].missing + ')' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { boosts } from '../store/boosts';

export default {
  data() {
    return {
      shortsValues: {
        trCount: 0, // TR Count
        allTimeOrbs: 0, // All-Time Orbs
      },
      allTimeOrbsInput: '', // Rohwert für die Eingabe von All-Time Orbs
      trRequirements: [], // Speichert die berechneten Orb-Anforderungen
      orbResults: [], // Speichert, ob die Anforderungen erfüllt werden
      actualOrbs: 0,
      orbRequirement: 0,
    };
  },
  computed: {
    boosts() {
      return boosts; // Boost-Daten aus der Datei
    },
    ...mapGetters(['currentValues']), // Zugriff auf Current Stats aus Vuex
  },
  methods: {
    autoFillWithImprovedStats() {
      // Greife auf die improvedValues aus dem Store zu
      this.shortsValues = {
        ...this.shortsValues,
        ...this.$store.state.improvedValues, // Fülle mit improvedValues
      };
      this.updateShortsCalculations();
      this.saveToLocalStorage();
    },
    resetFields() {
      const resetValues = { trCount: 0, allTimeOrbs: 0 };
      this.boosts.forEach(boost => {
        if (boost.type === 'number') {
          resetValues[boost.key] = 0;
        } else if (boost.type === 'boolean') {
          resetValues[boost.key] = false;
        }
      });
      this.shortsValues = resetValues;
      this.allTimeOrbsInput = ''; // Eingabefeld leeren
      this.updateShortsCalculations();
      this.saveToLocalStorage();
    },
    validateAllTimeOrbsInput() {
      // Überprüft die Eingabe und formatiert bei Verlassen des Feldes
      try {
        const parsedValue = parseFloat(this.allTimeOrbsInput.replace(/,/g, '')); // Entfernt unerwünschte Zeichen
        if (!isNaN(parsedValue)) {
          this.shortsValues.allTimeOrbs = parsedValue;
          // Aktualisiere das Eingabefeld mit wissenschaftlicher Notation
          this.allTimeOrbsInput = parsedValue.toExponential(2);
        } else {
          // Setzt den Wert auf 0 zurück, wenn die Eingabe ungültig ist
          this.shortsValues.allTimeOrbs = 0;
          this.allTimeOrbsInput = '';
        }
      } catch (error) {
        console.error('Invalid All-Time Orbs input:', error);
        this.shortsValues.allTimeOrbs = 0;
        this.allTimeOrbsInput = '';
      }
      this.updateShortsCalculations();
      this.saveToLocalStorage();
    },
    handleAllTimeOrbsTyping(event) {
      // Lasse den Benutzer die Zahl eingeben, ohne die Anzeige zu beeinflussen
      this.allTimeOrbsInput = event.target.value;
    },
    updateShortsCalculations() {
      const { trCount } = this.shortsValues;
      let allTimeOrbs = this.shortsValues.allTimeOrbs;
      this.trRequirements = [];
      this.orbResults = [];

      for (let i = 0; i < 5; i++) {
        const currentTR = trCount + i;
        const requirement = this.calculateOrbRequirement(currentTR, allTimeOrbs);
        const currentOrbs = this.calculateActualOrbs();

        const canReach = currentOrbs >= requirement;
        const missing = canReach ? 0 : (requirement - currentOrbs).toExponential(2);

        const previousAllTimeOrbs = allTimeOrbs; // Speichere den vorherigen Wert
        if (currentOrbs > requirement) {
          allTimeOrbs += currentOrbs;
        } else {
          allTimeOrbs += requirement;
        }

        const addedAllTimeOrbs = (allTimeOrbs - previousAllTimeOrbs).toExponential(2); // Differenz berechnen
        const endAllTimeOrbs = allTimeOrbs.toExponential(2);

        // Ergebnisse speichern
        this.trRequirements.push(requirement.toExponential(2));
        this.orbResults.push({ canReach, missing, endAllTimeOrbs, addedAllTimeOrbs });
      }

      // Aktualisiere actualOrbs und orbRequirement
      this.orbRequirement = this.calculateOrbRequirement(trCount, this.shortsValues.allTimeOrbs);
      this.actualOrbs = this.calculateActualOrbs();

      this.saveToLocalStorage();
    },


    calculateOrbRequirement(trCount, allTimeOrbs) {
      return (
        5 * Math.pow(1.2 + trCount * 0.008, trCount) +
        5000 +
        allTimeOrbs * 0.13
      ) * Math.pow(1.02, trCount - 11);
    },
    calculateActualOrbs() {
      let result = 1;
      const values = this.shortsValues;

      // Berechnung des Catch-Up Multipliers (wie im ursprünglichen calculateOrbs)
      const hoursInTR = values.hoursInTR || 0;
      const loopMods = values.loopMods || 0;
      const catchUpMultiplier = Math.min(2, Math.max(1, hoursInTR ? (hoursInTR * 0.00024) / 0.25 + 1 : 1));

      // Berechnung für hoursInTRResult (wie im ursprünglichen calculateOrbs)
      const hoursInTRResult = Math.sqrt(Math.pow(
        1 + Math.pow(hoursInTR, Math.min(2.42, 1.02 + hoursInTR * 0.00256)) *
        Math.pow(loopMods, Math.min(2.42, 1.02 + loopMods * 0.00005)),
        0.06)
      );

      // Boosts durchgehen, wie in calculateOrbs
      this.boosts.forEach(boost => {
        const value = values[boost.key];

        if (boost.type === 'number' && value !== undefined && value !== null) {
          if (boost.key === 'hoursInTR' || boost.key === 'loopMods') {
            // Nur einmal den hoursInTRResult anwenden
            result *= hoursInTRResult;
          } else if (typeof boost.multiplier === 'function') {
            result *= boost.multiplier(value) || 1;
          }
        }

        if (boost.type === 'boolean' && value) {
          result *= boost.multiplier || 1;
        }
      });

      // Am Ende den Catch-Up-Multiplikator anwenden
      result *= catchUpMultiplier;

      return result;
    },

    saveToLocalStorage() {
      localStorage.setItem('shortsValues', JSON.stringify(this.shortsValues));
    },
    loadFromLocalStorage() {
      const savedValues = localStorage.getItem('shortsValues');
      if (savedValues) {
        try {
          this.shortsValues = JSON.parse(savedValues);
          // Zeigt den Wert als Rohwert (nicht formatiert)
          this.allTimeOrbsInput = this.shortsValues.allTimeOrbs
            ? this.shortsValues.allTimeOrbs.toExponential(2)
            : '';
          this.updateShortsCalculations();
        } catch (error) {
          console.error('Fehler beim Laden von Local Storage:', error);
        }
      }
    },
    formatBoostValue(value) {
      try {
        if (value >= 1000) {
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
    this.loadFromLocalStorage(); // Lade die Werte beim Start
  },
};
</script>
