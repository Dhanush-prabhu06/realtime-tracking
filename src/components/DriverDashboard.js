import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { useNavigate } from "react-router-dom";
import Map from "./Map";
import { updateDriverLocation, recordLastLocation } from "../LocationService";
import {
  MapPin,
  Users,
  Radio,
  AlertTriangle,
  LogOut,
  User,
} from "lucide-react";

const DriverDashboard = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [lastLocation, setLastLocation] = useState({});
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955,
    lng: 77.123847,
  });
  const [currentDriver, setCurrentDriver] = useState(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!loggedInUser) {
        navigate("/");
        return;
      }
      const currentUserUid = loggedInUser.uid;
      const currentUserRole = loggedInUser.role;
      if (!currentUserUid || currentUserRole !== "driver") {
        navigate("/");
        return;
      }
      setCurrentDriver(loggedInUser);
    };
    checkAuth();
  }, [navigate]);

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const driverId = loggedInUser ? loggedInUser.uid : null;

  const toggleSharing = () => {
    if (!isSharing) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsSharing(true);
          setShowLocationAlert(false);
        },
        () => setShowLocationAlert(true)
      );
    } else {
      setIsSharing(false);
    }
  };

  const getCurrentLocation = (position) => {
    const { latitude, longitude } = position.coords;
    if (!isNaN(latitude) && !isNaN(longitude)) {
      const currentLocation = { latitude, longitude };
      setLastLocation(currentLocation);
      updateDriverLocation(driverId, currentLocation);
      if (isSharing) {
        setMapCenter({ lat: latitude, lng: longitude });
      }
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
        const processedLocations = Object.entries(data)
          .map(([id, loc]) => ({ id, ...loc }))
          .filter(
            (loc) =>
              loc.latitude &&
              loc.longitude &&
              !isNaN(loc.latitude) &&
              !isNaN(loc.longitude)
          );
        setLocations(processedLocations);
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleEmergencyClick = () => {
    const driverData = JSON.parse(localStorage.getItem("loggedInUser"));
    navigate("/driver/sos");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => navigate("/driver/profile")}
              className="w-full p-6 flex flex-col items-center gap-3 h-32"
            >
              <User size={24} className="text-blue-500" />
              <span className="text-lg font-medium">Profile</span>
            </button>
          </div>

          {/* Driver List Card */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => navigate("/driver/list")}
              className="w-full p-6 flex flex-col items-center gap-3 h-32"
            >
              <Users size={24} className="text-blue-500" />
              <span className="text-lg font-medium">Driver List</span>
            </button>
          </div>

          {/* Communication Card */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => navigate("/driver/communication")}
              className="w-full p-6 flex flex-col items-center gap-3 h-32"
            >
              <Radio size={24} className="text-blue-500" />
              <span className="text-lg font-medium">Communication</span>
            </button>
          </div>

          {/* Emergency Card */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={handleEmergencyClick}
              className="w-full p-6 flex flex-col items-center gap-3 h-32 text-red-500 hover:text-red-600"
            >
              <AlertTriangle size={24} />
              <span className="text-lg font-medium">Emergency</span>
            </button>
          </div>
        </div>

        {/* Location Sharing Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MapPin size={24} className="text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Location Sharing</h3>
                <p className="text-gray-600">
                  {isSharing
                    ? "Currently sharing your location"
                    : "Location sharing is disabled"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isSharing}
                onChange={toggleSharing}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {showLocationAlert && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
            <p className="text-red-700">
              Please enable location services to share your location.
            </p>
          </div>
        )}

        {/* Map */}

        <div className="h-[600px] rounded-lg overflow-hidden">
          <Map
            locations={locations}
            currentDriverId={driverId}
            mapCenter={
              mapCenter.lat && mapCenter.lng ? mapCenter : { lat: 0, lng: 0 }
            }
            onMarkerClick={(lat, lng) => setMapCenter({ lat, lng })}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
