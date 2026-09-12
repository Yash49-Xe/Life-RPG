/**
 * Server-side Study / Focus task timer verification helper.
 * 
 * Verifies that the elapsed time between task `started_at` and completion time `NOW()`
 * satisfies the required minimum duration.
 */

export interface TimerVerificationResult {
  valid: boolean;
  elapsedSeconds: number;
  minRequiredSeconds: number;
  reason: string;
}

export function verifyTimer(
  startedAtStr: string | null | undefined,
  minDurationSeconds: number = 60
): TimerVerificationResult {
  if (!startedAtStr) {
    return {
      valid: false,
      elapsedSeconds: 0,
      minRequiredSeconds: minDurationSeconds,
      reason: "Task timer was not started. Please start the timer before completing this task.",
    };
  }

  const startedAt = new Date(startedAtStr).getTime();
  if (isNaN(startedAt)) {
    return {
      valid: false,
      elapsedSeconds: 0,
      minRequiredSeconds: minDurationSeconds,
      reason: "Invalid start timestamp recorded.",
    };
  }

  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));

  if (elapsedSeconds < minDurationSeconds) {
    const remaining = minDurationSeconds - elapsedSeconds;
    return {
      valid: false,
      elapsedSeconds,
      minRequiredSeconds: minDurationSeconds,
      reason: `Study duration too short. Elapsed: ${elapsedSeconds}s, Minimum required: ${minDurationSeconds}s. (${remaining}s remaining)`,
    };
  }

  return {
    valid: true,
    elapsedSeconds,
    minRequiredSeconds: minDurationSeconds,
    reason: `Timer requirement satisfied (${elapsedSeconds}s elapsed).`,
  };
}
