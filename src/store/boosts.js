export const boosts = [
  {
    key: 'hoursInTR',
    label: 'Hours in TR',
    type: 'number',
    placeholder: 'Enter hours',
  },

  {
    key: 'loopMods',
    label: 'Loop Mods',
    type: 'number',
  },

  {
    key: 'tr5Special',
    label: 'TR5 Special',
    type: 'number',
    multiplier: (value) => 1 + 0.01 * value,
    max: 10
  },

  {
    key: 'm0',
    label: 'm0',
    type: 'number',
    multiplier: (value) => Math.pow(1.1, value),
  },

  {
    key: 'r9',
    label: 'R9',
    type: 'number',
    multiplier: (value) => Math.pow(1.08, value),
    max: 100
  },

  {
    key: 'inscryption52',
    label: 'Inscryption #52',
    type: 'number',
    multiplier: (value) => Math.pow(1.03, value),
    max: 8
  },

  {
    key: 'inscryption78',
    label: 'Inscryption #78',
    type: 'number',
    multiplier: (value) => Math.pow(1.08, value),
    max: 8
  },

  {
    key: 'campaigns',
    label: 'Campaigns',
    type: 'number',
    multiplier: (value) => Math.pow(1.006, value),
  },

  {
    key: 'gadget',
    label: 'Gadget',
    type: 'number',
    multiplier: (value) => {
      // Additionsbonus
      const baseMultiplier = Math.pow(1.005, value) - 1;
      // Alle 10 Levels mit 1.05 multiplizieren
      const levelMultiplier = Math.pow(1.05, Math.floor(value / 10));
      // Rückgabe des Gesamtmultiplikators
      return 1 + baseMultiplier * levelMultiplier;
    }  
  },

  {
    key: 'iap',
    label: 'IAP',
    type: 'boolean',
    multiplier: 1.25,
  },

  {
    key: 'db2',
    label: 'DB2',
    type: 'boolean',
    multiplier: 1.25,
  },

  {
    key: 'db4',
    label: 'DB4',
    type: 'boolean',
    multiplier: 1.25,
  },

  {
    key: 'db6',
    label: 'DB6',
    type: 'boolean',
    multiplier: 1.25,
  },

  {
    key: 'db8',
    label: 'DB8',
    type: 'boolean',
    multiplier: 1.5,
  },

  {
    key: 'db10',
    label: 'DB10',
    type: 'boolean',
    multiplier: 2,
  },

  {
    key: 'hera',
    label: 'Hera',
    type: 'boolean',
    multiplier: 1.05,
  },

  {
    key: 'jaxis',
    label: 'Jaxis',
    type: 'boolean',
    multiplier: 1.05,
  },
];
