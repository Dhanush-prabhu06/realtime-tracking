import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth } from "../firebase";
import Map from "./Map";
import { database } from "../firebase";
import {
  updateDriverLocation,
  recordLastLocation,
  clearDriverData, // Correct function name
} from "../LocationService";

const DriverDashboard = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [lastLocation, setLastLocation] = useState({});
  const driverId = auth.currentUser?.uid; // Unique driver ID

  const toggleSharing = () => setIsSharing(!isSharing);

  const getCurrentLocation = (position) => {
    const { latitude, longitude } = position.coords;
    setLastLocation({ latitude, longitude });
    updateDriverLocation(driverId, { latitude, longitude });
  };

  useEffect(() => {
    let locationInterval;

    if (isSharing) {
      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(getCurrentLocation);
      }, 15000);
    } else {
      clearInterval(locationInterval);
      recordLastLocation(driverId, lastLocation);
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isSharing, lastLocation]);

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
