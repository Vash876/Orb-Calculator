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
        <label class="tooltip-container">
          TR Count
          <span class="tooltip-text">Your Actual TR Count from your Profile Page</span>
        </label>
        <input
          type="number"
          v-model.number="shortsValues.trCount"
          @input="updateShortsCalculations"
        />
      </div>

      <!-- All-Time Orbs Eingabe -->
      <div class="input-group">
        <label class="tooltip-container">
          All-Time Orbs
          <span class="tooltip-text">Your Actual Orb Count from your Profile Page</span>
        </label>
        <input
          type="text"
          v-model="allTimeOrbsInput"
          @blur="validateAllTimeOrbsInput"
          @input="handleAllTimeOrbsTyping"
          placeholder="e.g 4.5b"
        />
      </div>


      <!-- Inputs für Boosts -->
      <div v-for="boost in boosts" :key="boost.key">
        <transition-group
          name="fade"
          tag="div"
          class="boost-rows-container"
          v-if="isLoaded"
        >
          <!-- Für Boosts mit expand -->
          <template v-if="boost.expand === '1'">
            <div
              v-for="(row, index) in boostRows[boost.key]"
              :key="`${boost.key}-${index}`"
              class="input-group"
            >
              <!-- Dynamische Label-Namensgebung -->
              <label class="boost-label tooltip-container">
                {{ generateLabel(boost.label, index, boostRows[boost.key].length) }}

                <!-- Tooltip nur für index 0 -->
                <span v-if="index === 0" class="tooltip-text">
                  Enter hours or days (e.g., 6d). Days will be automatically converted to hours.
                </span>
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
                v-if="index === boostRows[boost.key].length - 1"
                :class="{ invisible: boostRows[boost.key].length >= 5 }"
                @click="addBoostRow(boost.key)"
              >
                +
              </button>

              <!-- Eingabefeld für Boost-Wert -->
              <input
                type="text" 
                v-model="row.value"
                @input="handleBoostRowInpuut(boost, row)"
                :max="boost.max"
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
        </transition-group>
      </div>
    </div>

    <!-- Ergebnisse -->
    <div class="results">
      <h3 style="text-align:center">Orb Requirements and Results</h3>
      <table class="results-table">
  <thead>
    <tr>
      <th>TR Type</th>
      <th>TR Req</th>
      <th>Start / End Date</th>
      <th>Available Orbs</th>
      <th>All-Time Orbs (Gains)</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <!-- Long TR Zeile -->
    <tr>
      <td>Long</td>
      <td>TR {{ shortsValues.trCount }} Req: {{ formatNumber(trRequirements[0]) }}</td>
      <td>~ {{ formatDateLong(calculateStartDateLong()) }}</td>
      <td>{{ calculateAvailableOrbs(0) }}</td>
      <td :class="{'missing-orbs': !orbResults[0]?.canReach}">
        {{ formatNumber(orbResults[0]?.endAllTimeOrbs || 0) }}
        <span class="added-orbs">
          (+{{ formatNumber(orbResults[0]?.addedAllTimeOrbs || 0) }})
        </span>
      </td>
      <td>
        <span
          :class="{'fulfilled': orbResults[0]?.canReach, 'missing': !orbResults[0]?.canReach}">
          {{ orbResults[0]?.canReach ? 'Fulfilled' : 'Missing (' + formatNumber(orbResults[0]?.missing || 0) + ')' }}
        </span>
      </td>
    </tr>

    <!-- Short TR Zeilen -->
    <tr v-for="(requirement, index) in trRequirements.slice(1)" :key="index + 1">
      <td :class="{'missing-orbs': !orbResults[index + 1]?.canReach}">
        Short #{{ index + 1 }}
      </td>
      <td :class="{'missing-orbs': !orbResults[index + 1]?.canReach}">
        TR {{ shortsValues.trCount + index + 1 }} Req: {{ formatNumber(requirement) }}
      </td>
      <td :class="{
        'missing-orbs': !orbResults[index]?.canReach && index > 0,
        'highlight-yellow': isFirstMissing(index+1)
      }">
        {{ calculateStartDate(index) }}
      </td>
      <td :class="{'missing-orbs': !orbResults[index + 1]?.canReach}">
        {{ calculateAvailableOrbs(index+1) }}
      </td>
      <td :class="{'missing-orbs': !orbResults[index + 1]?.canReach}">
        {{ formatNumber(orbResults[index + 1]?.endAllTimeOrbs || 0) }}
        <span class="added-orbs">
          (+{{ formatNumber(orbResults[index + 1]?.addedAllTimeOrbs || 0) }})
        </span>
      </td>
      <td>
        <span
          :class="{'fulfilled': orbResults[index + 1]?.canReach, 'missing': !orbResults[index + 1]?.canReach}">
          {{
            orbResults[index + 1]?.canReach
              ? 'Fulfilled'
              : `Missing (${formatNumber(orbResults[index + 1]?.missing || 0)})`
          }}
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
        isLoaded: false, // Zustand für den Ladevorgang
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
    ...mapGetters(['currentValues', 'improvedOrbs']), // Zugriff auf Current Stats und Improved Orbs aus Vuex
  },
  methods: {

    handleBoostRowInpuut(boost, row) {
    const input = row.value;

    // Prüfe, ob die Eingabe ein `d` enthält (z. B. `15d`)
    const daysMatch = input.toString().match(/^(\d+)d$/i); // Erlaubt Eingaben wie `15d` oder `15D`

    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10); // Extrahiere die Zahl vor `d`
      row.value = days * 24; // Rechne Tage in Stunden um
    } else if (!isNaN(input)) {
      // Falls es eine reguläre Zahl ist, bleibt sie unverändert
      row.value = parseInt(input, 10);
    } else {
      // Für ungültige Eingaben: optional zurücksetzen oder ignorieren
      row.value = '';
    }

    // Prüfe auf maximale Begrenzung
    if (row.value > boost.max) {
      row.value = boost.max;
    }

    // Aktualisiere die Berechnungen
    this.updateShortsCalculations();
  }, 

    isFirstMissing(index) {
    // Prüft, ob die aktuelle Zeile "Missing" ist
    const currentIsMissing = !this.orbResults[index]?.canReach;

    // Prüft, ob alle vorherigen Zeilen erfüllt sind
    const previousAllFulfilled = this.orbResults.slice(0, index).every(result => result?.canReach);

    // Die aktuelle Zeile ist die erste mit "Missing", wenn alle vorherigen erfüllt sind
    return currentIsMissing && previousAllFulfilled;
  },

    handleBoostRowInput(boost, row) {
      const max = boost.max || Infinity; // Maximalwert prüfen
      if (row.value > max) {
        row.value = max; // Wenn der Wert größer als max ist, begrenze ihn
      }
      this.updateShortsCalculations(); // Berechnungen aktualisieren
    },

    calculateAvailableOrbs(index) {
      let totalOrbs = 0;

      for (let i = 0; i <= index; i++) {
        const addedOrbs = this.orbResults[i]?.addedAllTimeOrbs || 0; // Wert in Klammern
        totalOrbs += addedOrbs;
      }

      return this.formatNumber(totalOrbs);
    },

    calculateStartDate(index) {
      // Startdatum aus dem Store für Index 0
      if (index === 0) {
        return this.formatDate(this.$store.state.selectedDateTime) || '-';
      }

      // Startdatum initialisieren
      const startDate = new Date(this.$store.state.selectedDateTime);
      if (isNaN(startDate.getTime())) return '-'; // Sicherstellen, dass das Datum gültig ist

      let totalHours = 0;

      for (let i = 0; i < index; i++) {
        const boostRows = this.boostRows["hoursInTR"] || [];
        let value;

        // Prüfen, ob eine spezifische Zeile für den aktuellen Index existiert
        if (boostRows[i] && boostRows[i].value !== undefined) {
          value = boostRows[i].value;
        } else {
          // Falls keine spezifische Zeile existiert, den Wert der letzten Zeile nehmen
          value = boostRows.length > 0 ? boostRows[boostRows.length - 1].value : 0;
        }

        totalHours += value || 0;
      }

      // Stunden in Millisekunden umrechnen und Datum berechnen
      const newDate = new Date(startDate.getTime() + totalHours * 3600000);

      return this.formatDate(newDate);
    },

    formatDateLong(date) {
      if (!date) return '-';
      // Falls das Datum ein String ist, erst in ein Date-Objekt umwandeln
      const validDate = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(validDate)) return '-'; // Falls das Datum ungültig ist

      const day = validDate.getDate().toString().padStart(2, '0');
      const month = (validDate.getMonth() + 1).toString().padStart(2, '0'); // Monate sind nullbasiert
      const year = validDate.getFullYear();
      return `${month}/${day}/${year}`;
    },

    formatDate(date) {
      if (!date) return '-';
      
      // Versuche, ein Date-Objekt zu erstellen
      const validDate = typeof date === 'string' ? new Date(date) : date;

      // Fallback für ungültige Daten
      if (isNaN(validDate.getTime())) return date; // Zeige den Originalwert an, falls kein gültiges Datum

      const day = validDate.getDate().toString().padStart(2, '0');
      const month = (validDate.getMonth() + 1).toString().padStart(2, '0'); // Monate sind nullbasiert
      const year = validDate.getFullYear();

      let hours = validDate.getHours();
      const minutes = validDate.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Stunden im 12-Stunden-Format umwandeln (0 -> 12)

      return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    },


    formatNumber(value) {
      const suffixes = ["", "", "m", "b", "t", "qa", "qu", "sx", "sp", "oc", "n", "d"];
      let tier = Math.floor(Math.log10(value) / 3);

      console.log(`Value: ${value}, Tier: ${tier}, Suffix: ${suffixes[tier]}`);

      // Füge eine Bedingung hinzu, um Werte zwischen 1000 und 999999 direkt zurückzugeben
      if (value >= 1000 && value < 1000000) {
        return value.toFixed(0); // Ganze Zahl ohne Dezimalstellen
      }

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

    initializeBoostRows() {
  this.boosts.forEach((boost) => {
    if (boost.expand === '1' && !this.boostRows[boost.key]) {
      // Initialisiere nur eine Zeile pro Boost standardmäßig
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
      try {
        let input = this.allTimeOrbsInput.trim().toLowerCase(); // Eingabe bereinigen (kleinschreiben, Leerzeichen entfernen)

        // Mapping von Suffixen zu ihren numerischen Werten
        const suffixMap = {
          m: 1e6,
          b: 1e9,
          t: 1e12,
          qa: 1e15,
          qu: 1e18,
          sx: 1e21,
          sp: 1e24,
          oc: 1e27,
          n:  1e30,
          d:  1e33
        };

        const match = input.match(/^([\d.]+)([a-z]+)?$/);
        if (match) {
          const [, numberPart, suffix] = match;
          let parsedValue = parseFloat(numberPart);

          if (suffix && suffixMap[suffix]) {
            parsedValue *= suffixMap[suffix];
          }

          if (!isNaN(parsedValue)) {
            this.shortsValues.allTimeOrbs = parsedValue;
            this.allTimeOrbsInput = this.formatNumber(parsedValue);
            this.updateShortsCalculations();
            this.saveToLocalStorage();
            return;
          }
        }

        // Wissenschaftliche Notation direkt verarbeiten
        if (!isNaN(parseFloat(input))) {
          const parsedValue = parseFloat(input);
          this.shortsValues.allTimeOrbs = parsedValue;
          this.allTimeOrbsInput = this.formatNumber(parsedValue);
          this.updateShortsCalculations();
          this.saveToLocalStorage();
          return;
        }

        throw new Error('Ungültige Eingabe');
      } catch (error) {
        this.shortsValues.allTimeOrbs = 0;
        this.allTimeOrbsInput = '0.00';
      }
    },


    handleAllTimeOrbsTyping(event) {
      const input = event.target.value;

      // Lasse Eingaben in wissenschaftlicher Notation (e.g., 8e9) durch
      if (/^-?\d+(\.\d+)?e-?\d+$/i.test(input)) {
        this.allTimeOrbsInput = input; // Direkt setzen, wenn es valide wissenschaftliche Notation ist
        return;
      }

      // Andernfalls normalen Text übernehmen
      this.allTimeOrbsInput = input;
    },

    updateShortsCalculations() {
      const { trCount } = this.shortsValues;
      let allTimeOrbs = this.shortsValues.allTimeOrbs;
      this.trRequirements = [];
      this.orbResults = [];


      for (let i = 0; i < 6; i++) {
        const currentTR = trCount + i;

      if (i === 0) {
        // Long TR Calculation
        const requirement = this.calculateOrbRequirement(currentTR, allTimeOrbs);
        const finalOrbCount = this.improvedOrbs;
        const addedOrbs = finalOrbCount;
        const endAllTimeOrbs = allTimeOrbs + finalOrbCount;

        this.trRequirements.push(requirement);
        this.orbResults.push({
          canReach: true,
          missing: 0,
          endAllTimeOrbs,
          addedAllTimeOrbs: addedOrbs,
        });

        allTimeOrbs = endAllTimeOrbs;
      } else {
        // Short TR Calculations
        const requirement = this.calculateOrbRequirement(currentTR, allTimeOrbs);
        const currentOrbs = this.calculateActualOrbs(i-1);

        const canReach = currentOrbs >= requirement;
        const missing = canReach ? 0 : (requirement - currentOrbs);

        const previousAllTimeOrbs = allTimeOrbs;
        if (currentOrbs > requirement) {
          allTimeOrbs += currentOrbs;
        } else {
          allTimeOrbs += requirement;
        }

        const addedAllTimeOrbs = allTimeOrbs - previousAllTimeOrbs;
        const endAllTimeOrbs = allTimeOrbs;

        this.trRequirements.push(requirement);
        this.orbResults.push({ canReach, missing, endAllTimeOrbs, addedAllTimeOrbs });
      }
    }

  this.orbRequirement = this.calculateOrbRequirement(trCount, this.shortsValues.allTimeOrbs);
  this.actualOrbs = this.calculateActualOrbs(0);

  this.saveToLocalStorage();
},



    calculateActualOrbs(rowIndex) {
      let result = 1;

      const hoursInTR = this.getBoostValueForRow("hoursInTR", rowIndex);
      const loopMods = this.shortsValues.loopMods || 0; // loopMods ist nicht erweiterbar

      const catchUpMultiplier = Math.min(
        2,
        Math.max(1, hoursInTR ? (hoursInTR * 0.00024) / 0.25 + 1 : 1)
      );

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

      this.boosts.forEach((boost) => {
        let value;

        if (boost.expand === "1") {
          value = this.getBoostValueForRow(boost.key, rowIndex);
        } else {
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

      result *= catchUpMultiplier;
      return result;
    },

    calculateOrbRequirement(trCount, allTimeOrbs) {
      return (
        5 * Math.pow(1.2 + trCount * 0.008, trCount) +
        5000 +
        allTimeOrbs * 0.13
      ) * Math.pow(1.02, trCount - 11);
    },


    saveToLocalStorage() {
      const storedValues = {
        shortsValues: this.shortsValues,
        boostRows: JSON.parse(JSON.stringify(this.boostRows)),
      };
      localStorage.setItem('shortsValues', JSON.stringify(storedValues));
    },

    calculateStartDateLong() {
      const hoursInTR = this.currentValues.hoursInTR || 0;

      // Aktuelles Datum und Stunden in Tagen umrechnen
      const daysInTR = hoursInTR / 24;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInTR);

      return startDate;
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

          // Setze den Wert für allTimeOrbsInput
          this.allTimeOrbsInput = this.shortsValues.allTimeOrbs
            ? this.formatNumber(this.shortsValues.allTimeOrbs)
            : '';

          // Initialberechnungen
          this.updateShortsCalculations();
        } catch (error) {
          console.error('Fehler beim Laden von Local Storage:', error);
        }
      }
    },
  },
  mounted() {
    this.loadFromLocalStorage(); // Lade die Werte beim Start
    this.initializeBoostRows();
    this.isLoaded = true;
  },
};
</script>

