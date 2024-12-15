import { createStore } from 'vuex';
import { boosts } from './boosts';  // Importiere die Boosts-Daten

function calculateOrbs(values, isImproved = false) {
  let result = 1;

  // Berechnung des Catch-Up Multiplikators (mindestens 1, maximal 2)
  const hoursInTR = isImproved ? values.totalHoursInTR || 0 : values.hoursInTR || 0;
  const loopMods = values.loopMods || 0;

  const catchUpMultiplier = Math.min(2, Math.max(1, hoursInTR ? (hoursInTR * 0.00024) / 0.25 + 1 : 1));

  // Exponentielle Berechnung für hoursInTR und loopMods wie in der Excel-Formel
  const hoursInTRResult = Math.sqrt(Math.pow(
    1 + Math.pow(hoursInTR, Math.min(2.42, 1.02 + hoursInTR * 0.00256)) *
    Math.pow(loopMods, Math.min(2.42, 1.02 + loopMods * 0.00005)),
    0.06)
  );

  boosts.forEach(boost => {
    const value = values[boost.key];

    // Berechnungen nur für 'number' Typen und wenn der Wert definiert ist
    if (boost.type === 'number' && value !== undefined && value !== null) {
      if (boost.key === 'hoursInTR' || boost.key === 'loopMods') {
        result *= hoursInTRResult; // Nur einmal den berechneten Wert anwenden
      } else {
        result *= boost.multiplier(value);
      }
    }

    // Für "boolean" Boosts, den Multiplikator anwenden, wenn der Wert true ist
    if (boost.type === 'boolean' && value) {
      result *= boost.multiplier || 1;
    }
  });

  // Anwendung des Catch-Up-Multiplikators
  result *= catchUpMultiplier;

  // Rückgabe des Ergebnisses in wissenschaftlicher Notation
  return result;
}

export const store = createStore({
  state: {
    currentValues: {},  // Aktuelle Werte
    improvedValues: {},  // Verbesserte Werte
  },
  getters: {
    currentOrbs(state) {
      return calculateOrbs(state.currentValues); // Standardberechnung
    },
    improvedOrbs(state) {
      const improvedValuesWithTotalHours = {
        ...state.improvedValues,
        totalHoursInTR: (state.currentValues.hoursInTR || 0) + (state.improvedValues.additionalHours || 0),
      };
      return calculateOrbs(improvedValuesWithTotalHours, true); // Improved-Berechnung
    },
    currentValues(state) {
      return state.currentValues; // Zugriff auf aktuelle Werte
    },
  },
  mutations: {
    updateCurrentValues(state, newValues) {
      state.currentValues = newValues;  // Aktuelle Werte im Store setzen
    },
    updateImprovedValues(state, newValues) {
      state.improvedValues = newValues;  // Verbesserte Werte im Store setzen
    },
  },
  actions: {
    setCurrentValues({ commit }, newValues) {
      commit('updateCurrentValues', newValues);
    },
    setImprovedValues({ commit }, newValues) {
      commit('updateImprovedValues', newValues);
    },
  },
});
