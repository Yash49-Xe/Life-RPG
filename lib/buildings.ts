/**
 * Building configuration and XP engine.
 * Maps building types to task categories and provides upgrade calculations.
 */

/** Building type → task category that feeds it XP */
export const BUILDING_CATEGORY: Record<string, string> = {
  gym:     "fitness",
  library: "study",
  office:  "work",
  studio:  "personal",
};

/** Task category → building type (reverse of BUILDING_CATEGORY with full alias support) */
export const CATEGORY_BUILDING: Record<string, string> = {
  // Gym / Fitness building
  fitness:  "gym",
  exercise: "gym",
  gym:      "gym",
  workout:  "gym",

  // Library / Study building
  study:    "library",
  focus:    "library",
  reading:  "library",

  // Office / Work building
  work:     "office",
  job:      "office",

  // Studio / Personal building
  personal: "studio",
  hobby:    "studio",
  craft:    "studio",
};

/** Default buildings created for every new user */
export const DEFAULT_BUILDINGS = [
  { type: "gym",     linked_category: "fitness"  },
  { type: "library", linked_category: "study"    },
  { type: "office",  linked_category: "work"     },
  { type: "studio",  linked_category: "personal" },
] as const;

/** XP required to upgrade a building FROM the given level. Formula: floor(80 * level^1.4) */
export function xpRequiredForBuildingLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.4));
}

/**
 * Upgrade duration in seconds, scaled by target level.
 * Formula: targetLevel * 120 seconds (2 min/level)
 */
export function upgradeDurationSeconds(targetLevel: number): number {
  return targetLevel * 120;
}

/**
 * Additional building XP awarded when a streak is active.
 * Formula: min(streak * 10, 50) — caps at 50 for streak ≥ 5
 */
export function streakBonusXp(streak: number): number {
  return Math.min(streak * 10, 50);
}

/** Base building XP awarded per task completion, by category */
export function buildingXpForCategory(category: string): number {
  const catLower = category.toLowerCase();
  const XP: Record<string, number> = {
    fitness:  30,
    exercise: 30,
    gym:      30,
    workout:  30,
    study:    25,
    focus:    25,
    reading:  25,
    work:     20,
    job:      20,
    personal: 15,
    hobby:    15,
  };
  return XP[catLower] ?? 15;
}
