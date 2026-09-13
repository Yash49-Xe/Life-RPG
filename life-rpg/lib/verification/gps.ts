/**
 * Server-side Gym GPS location verification helper.
 * 
 * Validates coordinate plausibility, browser accuracy, and proximity to saved Gym location.
 */

export interface GpsVerificationResult {
  valid: boolean;
  reason: string;
  distanceMeters?: number;
  details?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    targetGymName?: string;
  };
}

/**
 * Calculates distance in meters between two geographical coordinates (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function verifyGpsLocation(
  latitude?: number,
  longitude?: number,
  accuracy?: number,
  targetGym?: { latitude?: number | null; longitude?: number | null; name?: string | null }
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

  // If target gym location is set on user profile, compute proximity (300m threshold)
  if (
    targetGym?.latitude != null &&
    targetGym?.longitude != null &&
    !isNaN(targetGym.latitude) &&
    !isNaN(targetGym.longitude)
  ) {
    const distMeters = calculateDistanceMeters(
      latitude,
      longitude,
      targetGym.latitude,
      targetGym.longitude
    );
    const gymName = targetGym.name || "Registered Gym";
    const MAX_ALLOWED_METERS = 300;

    if (distMeters <= MAX_ALLOWED_METERS) {
      return {
        valid: true,
        reason: `Verified inside ${gymName}! (${Math.round(distMeters)}m from gym center).`,
        distanceMeters: Math.round(distMeters),
        details: { latitude, longitude, accuracy: acc, targetGymName: gymName },
      };
    } else {
      const distanceFormatted =
        distMeters > 1000
          ? `${(distMeters / 1000).toFixed(2)} km`
          : `${Math.round(distMeters)} meters`;

      return {
        valid: false,
        reason: `Outside ${gymName} perimeter (${distanceFormatted} away. Maximum allowed: 300m).`,
        distanceMeters: Math.round(distMeters),
        details: { latitude, longitude, accuracy: acc, targetGymName: gymName },
      };
    }
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
