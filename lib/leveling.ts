/**
 * Character leveling engine — pure functions, no DB calls.
 *
 * Formula: xp_required = floor(100 * level ^ 1.5)
 *
 * Level progression examples:
 *   Level 1 → 2:  100 XP
 *   Level 2 → 3:  282 XP
 *   Level 5 → 6:  1118 XP
 *   Level 10 → 11: 3162 XP
 */

/** XP needed to level up FROM the given level */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** XP awarded per task category */
const XP_BY_CATEGORY: Record<string, number> = {
  fitness:  30,
  study:    25,
  work:     20,
  personal: 15,
};

export function xpForCategory(category: string): number {
  return XP_BY_CATEGORY[category.toLowerCase()] ?? 10;
}

export interface LevelUpResult {
  newLevel:     number;
  newXp:        number;  // remaining XP after level-up(s)
  leveledUp:    boolean;
  levelsGained: number;
}

/**
 * Compute the new level and XP after awarding `awardedXp`.
 * Handles multi-level jumps in a single call.
 */
export function computeLevelUp(
  currentLevel: number,
  currentXp: number,
  awardedXp: number
): LevelUpResult {
  let newLevel = currentLevel;
  let newXp = currentXp + awardedXp;
  let levelsGained = 0;

  while (newXp >= xpRequiredForLevel(newLevel)) {
    newXp -= xpRequiredForLevel(newLevel);
    newLevel++;
    levelsGained++;
  }

  return {
    newLevel,
    newXp,
    leveledUp: levelsGained > 0,
    levelsGained,
  };
}
