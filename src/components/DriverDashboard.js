import React, { useState, useEffect } from "react";
import { ref, set, onValue } from "firebase/database";
import { database, auth } from "../firebase";
import Map from "./Map";

const DriverDashboard = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const driverId = auth.currentUser?.uid; // Unique driver ID

  // Toggle sharing
  const toggleSharing = () => setIsSharing(!isSharing);

  // Update location
  const updateLocation = (position) => {
    const { latitude, longitude } = position.coords;
    set(ref(database, `drivers/${driverId}`), {
      latitude,
      longitude,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    let watchId;
    if (isSharing) {
      watchId = navigator.geolocation.watchPosition(updateLocation);
    } else {
      set(ref(database, `drivers/${driverId}`), null);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isSharing]);

  useEffect(() => {
    const locationsRef = ref(database, "drivers");
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLocations(Object.entries(data).map(([id, loc]) => ({ id, ...loc })));
      }
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Driver Dashboard</h1>
      <label className="flex items-center mt-4">
        <span>Share Location:</span>
        <input
          type="checkbox"
          checked={isSharing}
          onChange={toggleSharing}
          className="ml-2"
        />
      </label>
      <Map locations={locations} currentDriverId={driverId} />
    </div>
  );
};

export default DriverDashboard;
