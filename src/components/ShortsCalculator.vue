<template>
  <div class="shorts-calculator">
    <div class="inputs-container">
      <!-- Buttons für Auto-Fill und Reset -->
      <div class="input-group">
        <button class="otherbuttons" @click="autoFillWithImprovedStats">Auto-Fill with Improved Stats</button>
        <button class="reset" @click="resetFields">Reset All Fields</button>
      </div>

      <!-- TR Count Eingabe -->
      <div class="input-group">
        <label>TR Count</label>
        <input
          type="number"
          v-model.number="shortsValues.trCount"
          @input="updateShortsCalculations"
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
      <div v-for="boost in boosts" :key="boost.key">
        <!-- Wrapper-Template für expand-Boosts -->
        <template v-if="boost.expand === '1'">
          <div
            v-for="(row, index) in boostRows[boost.key]"
            :key="`${boost.key}-${index}`"
            class="input-group"
          >
            <!-- Dynamische Label-Namensgebung -->
            <label class="boost-label">
              {{ generateLabel(boost.label, index, boostRows[boost.key].length) }}
            </label>

            <!-- Buttons für Zeilenmanagement -->
            <button
              class="expand"
              v-if="index === boostRows[boost.key].length - 1 && boostRows[boost.key].length > 1"
              @click="removeBoostRow(boost.key, index)"
            >
              -
            </button>

            <button
              class="expand"
              v-if="index === boostRows[boost.key].length - 1 && boostRows[boost.key].length < 5"
              @click="addBoostRow(boost.key)"
            >
              +
            </button>

            <!-- Eingabefeld für Boost-Wert -->
            <input
              type="number"
              v-model.number="row.value"
              @input="updateShortsCalculations"
              :placeholder="boost.placeholder || ''"
              :max="boost.max || null"
            />
          </div>
        </template>

        <!-- Für Boosts ohne expand -->
        <template v-else>
          <div class="input-group">
            <label class="tooltip-container">
              {{ boost.label }}
              <span v-if="boost.tooltip != 0" class="tooltip-text">{{ boost.tooltip }}</span>
            </label>
            <input
              type="number"
              v-if="boost.type === 'number'"
              v-model.number="shortsValues[boost.key]"
              @input="handleInputChange(boost)"
              :placeholder="boost.placeholder || ''"
              :max="boost.max || null"
            />
            <input
              type="checkbox"
              v-if="boost.type === 'boolean'"
              v-model="shortsValues[boost.key]"
              @change="updateShortsCalculations"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Ergebnisse -->
    <div class="results">
      <h3 style="text-align:center">Orb Requirements and Results</h3>
      <table class="results-table">
        <thead>
          <tr>
            <th>TR Req</th>
            <th>All-Time Orbs</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(requirement, index) in trRequirements" :key="index">
            <td>TR {{ shortsValues.trCount + index }} Req: {{ formatExponential(requirement) }}</td>
            <td :class="{'missing-orbs': !orbResults[index].canReach}">
              {{ formatExponential(orbResults[index].endAllTimeOrbs) }} 
              <span class="added-orbs">
                (+{{ formatExponential(orbResults[index].addedAllTimeOrbs) }})
              </span>
            </td>
            <td>
              <span
                :class="{'fulfilled': orbResults[index].canReach, 'missing': !orbResults[index].canReach}">
                {{ orbResults[index].canReach ? 'Fulfilled' : 'Missing (' + formatExponential(orbResults[index].missing) + ')' }}
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
import { reactive } from 'vue';

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
      boostRows: reactive({}), // Reaktive Datenstruktur für dynamische Zeilen
    };
  },


  computed: {
    boosts() {
      return boosts; // Boost-Daten aus der Datei
    },
    ...mapGetters(['currentValues']), // Zugriff auf Current Stats aus Vuex
  },
  methods: {
    formatExponential(value) {
      return value.replace('+', '');
    },
    initializeBoostRows() {
      this.boosts.forEach((boost) => {
        if (boost.expand === '1' && !this.boostRows[boost.key]) {
          this.boostRows[boost.key] = [{ value: 0 }];
        }
      });
    },
    addBoostRow(key) {
      if (this.boostRows[key].length < 5) {
        // Letzten Wert der aktuellen Zeilen kopieren
        const lastValue = this.boostRows[key][this.boostRows[key].length - 1]?.value || 0;
        // Neue Zeile hinzufügen mit dem Wert der vorherigen
        this.boostRows[key].push({ value: lastValue });
        this.updateShortsCalculations(); // Berechnungen aktualisieren
      }
    },
    removeBoostRow(key, index) {
      if (this.boostRows[key].length > 1) {
        this.boostRows[key].splice(index, 1); // Zeile entfernen
        this.updateShortsCalculations();
      }
    },
    generateLabel(baseLabel, index, totalRows) {
      if (totalRows === 1) {
        return `${baseLabel} | Short #1 - #5`; // Standardzustand
      }

      if (index === totalRows - 1 && totalRows < 5) {
        return `${baseLabel} | Short #${index + 1} - #5`; // Letzte Zeile
      }

      return `${baseLabel} | Short #${index + 1}`; // Mittlere oder erste Zeilen
    },

    getBoostValueForRow(boostKey, rowIndex) {
      const rows = this.boostRows[boostKey] || [];
      if (rowIndex < rows.length) {
        return rows[rowIndex].value; // Spezifische Zeile
      }
      return rows.length > 0 ? rows[rows.length - 1].value : 0; // Letzte Zeile oder 0, wenn keine vorhanden
    },

    handleInputChange(boost) {
      const max = boost.max || Infinity; // Maximalwert des Boosts
      const key = boost.key; // Schlüssel des aktuellen Boosts
      const value = this.shortsValues[key]; // Aktueller Wert des Eingabefelds

      // Begrenze den Wert auf den Maximalwert
      if (value > max) {
        this.shortsValues[key] = max;
      }

      // Aktualisiere die Berechnungen
      this.updateShortsCalculations();
      this.saveToLocalStorage();
    },

autoFillWithImprovedStats() {
  const improvedValues = this.$store.state.improvedValues;

  console.log("Improved Values aus Vuex:", improvedValues); // Debugging

  // shortsValues für nicht-expandierbare Felder aktualisieren
  this.shortsValues = {
    ...this.shortsValues,
    ...Object.fromEntries(
      Object.entries(improvedValues).filter(([key]) =>
        this.boosts.some((boost) => boost.key === key && boost.expand !== '1')
      )
    ),
  };

  // boostRows für erweiterbare Felder aktualisieren
  this.boosts.forEach((boost) => {
    if (boost.expand === '1') {
      console.log(`Aktualisiere boostRows für ${boost.key}`); // Debugging

      const boostValue = improvedValues[boost.key];

      if (Array.isArray(boostValue)) {
        // Falls boostRows[boost.key] existiert, nur Werte aktualisieren
        if (this.boostRows[boost.key]) {
          boostValue.forEach((value, index) => {
            if (this.boostRows[boost.key][index]) {
              this.boostRows[boost.key][index].value = value;
            } else {
              // Neue Zeilen hinzufügen, falls zu wenige existieren
              this.boostRows[boost.key].push({ value });
            }
          });

          // Überschüssige Zeilen nicht entfernen, damit Felder geöffnet bleiben
        } else {
          // Initialisierung, falls boostRows leer ist
          this.boostRows[boost.key] = boostValue.map((value) => ({ value }));
        }
      } else if (boostValue !== undefined) {
        // Wenn nur ein Wert vorhanden ist
        if (this.boostRows[boost.key]?.length > 0) {
          this.boostRows[boost.key][0].value = boostValue;
        } else {
          // Fallback auf eine Zeile
          this.boostRows[boost.key] = [{ value: boostValue }];
        }
      }
    }
  });

  console.log("BoostRows nach Autofill:", this.boostRows); // Debugging

  // Berechnungen und Speichern
  this.updateShortsCalculations();
  this.saveToLocalStorage();
},




    resetFields() {
      // Standardwerte für shortsValues zurücksetzen
      const resetValues = { trCount: 0, allTimeOrbs: 0 };

      // Alle Boost-Werte zurücksetzen
      this.boosts.forEach((boost) => {
        if (boost.type === 'number') {
          resetValues[boost.key] = 0;
        } else if (boost.type === 'boolean') {
          resetValues[boost.key] = false;
        }

        // BoostRows zurücksetzen, falls der Boost erweiterbar ist
        if (boost.expand === '1') {
          this.boostRows[boost.key] = [{ value: 0 }]; // Nur eine Zeile mit Standardwert
        }
      });

      // shortsValues aktualisieren
      this.shortsValues = resetValues;

      // Eingabefeld für All-Time Orbs leeren
      this.allTimeOrbsInput = '';

      // Berechnungen und LocalStorage aktualisieren
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

        // Berechnung der tatsächlichen Orbs unter Berücksichtigung der Boost-Werte
        const currentOrbs = this.calculateActualOrbs(i);

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
      this.actualOrbs = this.calculateActualOrbs(0);

      this.saveToLocalStorage();
    },

    calculateOrbRequirement(trCount, allTimeOrbs) {
      return (
        5 * Math.pow(1.2 + trCount * 0.008, trCount) +
        5000 +
        allTimeOrbs * 0.13
      ) * Math.pow(1.02, trCount - 11);
    },

    calculateActualOrbs(rowIndex) {
      let result = 1;

      // Berechnung des Catch-Up Multipliers
      const hoursInTR = this.getBoostValueForRow("hoursInTR", rowIndex);
      const loopMods = this.shortsValues.loopMods || 0; // loopMods ist nicht erweiterbar
      const catchUpMultiplier = Math.min(
        2,
        Math.max(1, hoursInTR ? (hoursInTR * 0.00024) / 0.25 + 1 : 1)
      );

      // Berechnung des hoursInTRResult
      const hoursInTRResult = Math.sqrt(
        Math.pow(
          1 +
            Math.pow(
              hoursInTR,
              Math.min(2.42, 1.02 + hoursInTR * 0.00256)
            ) *
              Math.pow(loopMods, Math.min(2.42, 1.02 + loopMods * 0.00005)),
          0.06
        )
      );

      // Durchlaufe alle Boosts
      this.boosts.forEach((boost) => {
        let value;

        if (boost.expand === "1") {
          // Boost-Wert aus boostRows holen (für erweiterbare Boosts)
          value = this.getBoostValueForRow(boost.key, rowIndex);
        } else {
          // Boost-Wert aus shortsValues holen (für nicht erweiterbare Boosts)
          value = this.shortsValues[boost.key] || 0;
        }

        if (boost.type === "number" && value !== undefined && value !== null) {
          if (boost.key === "hoursInTR" || boost.key === "loopMods") {
            result *= hoursInTRResult;
          } else if (typeof boost.multiplier === "function") {
            result *= boost.multiplier(value) || 1;
          }
        }

        if (boost.type === "boolean" && value) {
          result *= boost.multiplier || 1;
        }
      });

      // Catch-Up-Multiplikator anwenden
      result *= catchUpMultiplier;

      return result;
    },


saveToLocalStorage() {
  const storedValues = {
    shortsValues: this.shortsValues,
    boostRows: JSON.parse(JSON.stringify(this.boostRows)), // Flaches Objekt speichern
  };
  localStorage.setItem('shortsValues', JSON.stringify(storedValues));
},


loadFromLocalStorage() {
  const savedValues = localStorage.getItem('shortsValues');
  if (savedValues) {
    try {
      const parsedValues = JSON.parse(savedValues);

      // Restore shortsValues
      this.shortsValues = parsedValues.shortsValues || {};

      // Sicherstellen, dass boostRows reaktiv bleibt
      const loadedBoostRows = parsedValues.boostRows || {};
      this.boostRows = reactive(Object.assign({}, loadedBoostRows)); // Sichere Reaktivität

      // Ergänze fehlende Boosts
      this.boosts.forEach((boost) => {
        if (boost.expand === '1' && !this.boostRows[boost.key]) {
          this.boostRows[boost.key] = [{ value: 0 }];
        }
      });

      console.log("Reaktive BoostRows nach Wiederherstellung:", this.boostRows);

      // Setze den Wert für allTimeOrbsInput
      this.allTimeOrbsInput = this.shortsValues.allTimeOrbs
        ? this.shortsValues.allTimeOrbs.toExponential(2)
        : '';

      // Initialberechnungen
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
    this.initializeBoostRows();
  },
};
</script>

