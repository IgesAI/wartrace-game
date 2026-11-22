/** WARTRACE scoring reference, not a complete server implementation.
 * Valid scores are pre-published; input validation/eligibility happens elsewhere.
 * Use JavaScript Math.round for nonnegative numeric inputs across runtimes.
 */
export type Award = { points: number; distanceM: number; tier: string };

export function awardForRarity(rarityScore: number): Award {
  if (!Number.isFinite(rarityScore) || rarityScore < 0 || rarityScore > 1) {
    throw new RangeError('rarityScore must be finite within [0,1]');
  }
  const points = 100 + Math.round(900 * Math.pow(rarityScore, 1.3));
  const distanceM = Math.round(points * 0.8);
  const tier = rarityScore < .25 ? 'Common'
    : rarityScore < .50 ? 'Curious'
    : rarityScore < .75 ? 'Uncommon' : 'Obscure';
  return {points, distanceM, tier};
}

export function awardForOutcome(valid: boolean, rarityScore?: number): Award {
  if (!valid) return {points: 0, distanceM: 0, tier: 'None'};
  if (rarityScore === undefined) throw new Error('Missing published rarity');
  return awardForRarity(rarityScore);
}
