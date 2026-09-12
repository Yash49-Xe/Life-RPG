/**
 * Server-side Gym GPS location verification helper.
 * 
 * Validates coordinate plausibility and browser accuracy threshold.
 */

export interface GpsVerificationResult {
  valid: boolean;
  reason: string;
  details?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export function verifyGpsLocation(
  latitude?: number,
  longitude?: number,
  accuracy?: number
): GpsVerificationResult {
  if (latitude === undefined || longitude === undefined) {
    return {
      valid: false,
      reason: "Geolocation data missing (latitude and longitude required).",
    };
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      valid: false,
      reason: "Invalid geolocation data types.",
    };
  }

  // Check valid bounds: lat [-90, 90], lng [-180, 180]
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      valid: false,
      reason: `Coordinates out of physical bounds (lat: ${latitude}, lng: ${longitude}).`,
    };
  }

  // Check 0,0 default null location mock
  if (latitude === 0 && longitude === 0) {
    return {
      valid: false,
      reason: "Null island coordinates (0,0) rejected as invalid GPS location.",
    };
  }

  // Accuracy threshold check (if provided, accuracy in meters should be <= 1000m)
  const acc = typeof accuracy === "number" ? accuracy : 100;
  if (acc > 1000) {
    return {
      valid: false,
      reason: `GPS accuracy too low (${acc}m > 1000m max threshold).`,
    };
  }

  return {
    valid: true,
    reason: `GPS location verified plausible (lat: ${latitude.toFixed(4)}, lng: ${longitude.toFixed(4)}, accuracy: ${acc}m).`,
    details: {
      latitude,
      longitude,
      accuracy: acc,
    },
  };
}
