export function formatNumber(value) {
  const suffixes = ["", "m", "b", "t", "qa", "qu", "sx", "sp", "oc", "n", "d"];
  let tier = Math.floor(Math.log10(value) / 3);

  if (tier === 0) {
    return value.toFixed(2);
  }

  if (tier >= suffixes.length) {
    return value.toExponential(2);
  }

  const suffix = suffixes[tier];
  const scaledValue = value / Math.pow(10, tier * 3);

  return `${scaledValue.toFixed(2)}${suffix}`;
}