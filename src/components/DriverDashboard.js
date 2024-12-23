import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { auth } from "../firebase";
import Map from "./Map";
import { updateDriverLocation, recordLastLocation } from "../LocationService";
import { database } from "../firebase";
import { useNavigate } from "react-router-dom";

const DriverDashboard = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [lastLocation, setLastLocation] = useState({});
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955,
    lng: 77.123847,
  }); // Default center

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

      if (!loggedInUser) {
        // If no user is logged in, redirect to the login page
        navigate("/");
        return;
      }

      const currentUserUid = loggedInUser.uid;
      const currentUserRole = loggedInUser.role;

      if (!currentUserUid || currentUserRole !== "driver") {
        // If UID is missing or role is not 'driver', redirect to login
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const driverId = loggedInUser ? loggedInUser.uid : null;

  const toggleSharing = () => setIsSharing(!isSharing);

  const getCurrentLocation = (position) => {
    const { latitude, longitude } = position.coords;

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const currentLocation = { latitude, longitude };
      setLastLocation(currentLocation);
      updateDriverLocation(driverId, currentLocation);

      // Update map center only if the driver is sharing
      if (isSharing) {
        setMapCenter({ lat: latitude, lng: longitude });
      }
    } else {
      console.error("Invalid GPS coordinates:", latitude, longitude);
    }
  };

  useEffect(() => {
    let locationInterval;

    if (isSharing) {
      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(getCurrentLocation, (error) =>
          console.error("Geolocation Error:", error)
        );
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
        const processedLocations = Object.entries(data).map(([id, loc]) => ({
          id,
          ...loc,
        }));
        // console.log("Processed Locations:", processedLocations); // Debug log
        setLocations(
          processedLocations.filter(
            (loc) =>
              loc.latitude &&
              loc.longitude &&
              !isNaN(loc.latitude) &&
              !isNaN(loc.longitude)
          )
        );
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="relative p-4">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
      >
        Logout
      </button>
      <h1 className="text-xl font-bold">Driver Dashboard</h1>
      <div className="flex justify-center space-x-4 mb-8">
        <button
          className="px-6 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
          onClick={() => navigate("/driver/profile")}
        >
          Profile
        </button>
        <button className="px-6 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700">
          <a href="/driver/list" className="font-medium">
            Driver List
          </a>
        </button>
      </div>

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
        mapCenter={
          mapCenter.lat && mapCenter.lng ? mapCenter : { lat: 0, lng: 0 } // Fallback to a default value
        }
        onMarkerClick={(lat, lng) => setMapCenter({ lat, lng })} // Allow manual recentering
      />
    </div>
  );
};

export default DriverDashboard;
