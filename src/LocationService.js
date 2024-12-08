import { ref, set } from "firebase/database";
import { database } from "./firebase";

/**
 * Updates the driver's live location in Firebase Realtime Database.
 *
 * @param {string} driverId - Unique ID of the driver.
 * @param {object} location - An object containing latitude and longitude.
 */
export const updateDriverLocation = (driverId, location) => {
  set(ref(database, `drivers/${driverId}`), {
    ...location,
    timestamp: Date.now(),
  });
};

/**
 * Records the driver's last known location when sharing is turned off.
 *
 * @param {string} driverId - Unique ID of the driver.
 * @param {object} lastLocation - An object containing latitude and longitude.
 */
export const recordLastLocation = (driverId, lastLocation) => {
  set(ref(database, `drivers/${driverId}`), {
    ...lastLocation,
    timestamp: Date.now(),
    status: "offline", // Optionally indicate the driver is offline
  });
};

/**
 * Clears driver data from Firebase if needed (not mandatory in this case).
 *
 * @param {string} driverId - Unique ID of the driver.
 */
export const clearDriverData = (driverId) => {
  set(ref(database, `drivers/${driverId}`), null);
};
