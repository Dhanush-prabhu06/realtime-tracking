import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth } from "../firebase";
import Map from "./Map";
import { updateDriverLocation, recordLastLocation } from "../LocationService";
import { database } from "../firebase";

const DriverDashboard = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [lastLocation, setLastLocation] = useState({});
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955,
    lng: 77.123847,
  }); // Default center
  const driverId = auth.currentUser?.uid;

  const toggleSharing = () => setIsSharing(!isSharing);

  const getCurrentLocation = (position) => {
    const { latitude, longitude } = position.coords;
    const currentLocation = { latitude, longitude };
    setLastLocation(currentLocation);
    updateDriverLocation(driverId, currentLocation);

    // Update map center only if the driver is sharing
    if (isSharing) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  };

  useEffect(() => {
    let locationInterval;

    if (isSharing) {
      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(getCurrentLocation);
      }, 10000);
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
      <Map
        locations={locations}
        currentDriverId={driverId}
        mapCenter={mapCenter} // Pass the center state to the Map component
        onMarkerClick={(lat, lng) => setMapCenter({ lat, lng })} // Allow manual recentering
      />
    </div>
  );
};

export default DriverDashboard;
