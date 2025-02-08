import React, { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
  get,
} from "firebase/database";
import { database } from "../../firebase"; // Adjust import path for your project setup
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";

const AdminDashboard = () => {
  const [locations, setLocations] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955, // Default latitude
    lng: 77.123847, // Default longitude
  });
  const [mapRef, setMapRef] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

      if (!loggedInUser) {
        navigate("/"); // Redirect to login if not logged in
        return;
      }

      const currentUserRole = loggedInUser.role;

      if (currentUserRole !== "admin") {
        navigate("/"); // Redirect to login if role is not admin
      }
    };

    checkAuth();
  }, [navigate]);

  // Map styles
  const mapStyles = { height: "630px", width: "100%" };

  // Fetch driver locations from Realtime Database
  useEffect(() => {
    const locationsRef = ref(database, "drivers");
    const unsubscribe = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLocations(Object.entries(data).map(([id, loc]) => ({ id, ...loc })));
        console.log(locations);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle map initialization
  const onMapLoad = (map) => {
    setMapRef(map);
  };

  // Function to fetch driver details by UID
  const fetchDriverDetails = async (uid) => {
    try {
      const driversRef = ref(database, "drivers");
      const driverQuery = query(driversRef, orderByChild("uid"), equalTo(uid));
      const snapshot = await get(driverQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const driverId = Object.keys(data)[0]; // Get the key

        return data[driverId]; // Return driver details
      } else {
        console.error("Driver not found!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
      return null;
    }
  };

  // Function to handle marker click
  const handleMarkerClick = async (driver) => {
    setSelectedDriver(driver); // Set basic info immediately

    // Fetch additional details and update state
    const driverDetails = await fetchDriverDetails(driver.id);
    if (driverDetails) {
      setSelectedDriver({
        ...driver,
        driverName: driverDetails.driverName, // Include driver name
        busNumber: driverDetails.busNumber, // Include bus number
      });

      if (mapRef) {
        mapRef.panTo({
          lat: driver.latitude,
          lng: driver.longitude,
        });
      }
    }
  };

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

      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <div className="flex justify-center space-x-4 mb-8">
        <button className="px-6 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700">
          <a href="/admin/driverDetails" className="font-medium">
            View Driver Details
          </a>
        </button>
        <button className="px-6 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">
          <a href="/admin/userDetails" className="font-medium">
            View User Details
          </a>
        </button>
        <button className="px-6 py-2 text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700">
          <a href="/admin/profile" className="font-medium">
            View Profile
          </a>
        </button>
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
      </div>

      <div className="mt-4">
        <LoadScript googleMapsApiKey="AIzaSyCNuNH8t_kGXe1FEH8FjkGvRPYnzTGRx7Y">
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={10}
            center={mapCenter}
            onLoad={onMapLoad}
          >
            {locations.map((driver) => (
              <Marker
                key={driver.id}
                position={{ lat: driver.latitude, lng: driver.longitude }}
                icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                onClick={() => handleMarkerClick(driver)}
              />
            ))}

            {selectedDriver && (
              <InfoWindow
                position={{
                  lat: selectedDriver.latitude,
                  lng: selectedDriver.longitude,
                }}
                onCloseClick={() => setSelectedDriver(null)}
              >
                <div>
                  <h2>
                    Driver Name: {selectedDriver.driverName || "Loading..."}
                  </h2>
                  <p>Bus Number: {selectedDriver.busNumber || "Loading..."}</p>
                  <p>Driver ID: {selectedDriver.id}</p>
                  <p>Latitude: {selectedDriver.latitude}</p>
                  <p>Longitude: {selectedDriver.longitude}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default AdminDashboard;
