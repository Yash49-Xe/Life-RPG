/**
 * Coin economy helpers.
 *
 * Coins are earned by completing tasks (streak-boosted) and
 * spent to rush building upgrades.
 */

/**
 * Coins earned for completing a task.
 * Base: 5, plus up to 20 bonus from streak (2 per streak day).
 */
export function coinsPerCompletion(streak: number): number {
  return 5 + Math.min(streak * 2, 20);
}

/**
 * Coin cost to reduce the remaining upgrade timer by `seconds`.
 * Rate: 2 coins per 30 seconds rushed (rounded up).
 */
export function rushCost(seconds: number): number {
  return Math.ceil(seconds / 30) * 2;
}
