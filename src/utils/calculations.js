import { boosts } from '@/store/boosts'; // Hol die Boost-Daten aus der zentralen Datei

export function calculateOrbs(values) {
  let result = 1;

  // Iteriere durch alle Boosts und wende Multiplikatoren an
  boosts.forEach(boost => {
    const value = values[boost.key]; // Hole den entsprechenden Wert aus den Eingabewerten

    if (boost.type === 'number' && value !== undefined) {
      // Multipliziere mit dem entsprechenden Wert, falls der Boost ein Number ist
      result *= Math.pow(value, boost.multiplier || 1);
    }

    if (boost.type === 'boolean' && value) {
      // Wenn der Boost ein Boolean ist, multipliziere mit dem Multiplikator, wenn aktiv
      result *= boost.multiplier || 1;
    }
  });

  return result;
}

export function calculateCatchUp(hoursInTR) {
  return ((hoursInTR * 0.00024) / 0.25 + 1).toFixed(2); // Berechnung des Catch-Up Multipliers
}
