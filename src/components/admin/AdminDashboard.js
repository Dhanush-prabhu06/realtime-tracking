import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase"; // Adjust import path for your project setup
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const AdminDashboard = () => {
  const [locations, setLocations] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955, // Default latitude
    lng: 77.123847, // Default longitude
  });
  const [mapRef, setMapRef] = useState(null);

  // Map styles
  const mapStyles = { height: "630px", width: "100%" };

  // Fetch driver locations from Realtime Database
  useEffect(() => {
    const locationsRef = ref(database, "drivers");
    const unsubscribe = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLocations(Object.entries(data).map(([id, loc]) => ({ id, ...loc })));
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle map initialization
  const onMapLoad = (map) => {
    setMapRef(map);
  };

  // Function to manually recenter the map
  const handleMarkerClick = (driver) => {
    setSelectedDriver(driver);
    if (mapRef) {
      mapRef.panTo({
        lat: driver.latitude,
        lng: driver.longitude,
      });
    }
  };

  return (
    <div className="p-4">
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
      </div>
      <div className="mt-4">
        <LoadScript googleMapsApiKey="AIzaSyBC6jH0EHIKMEck4lNROeKGExDzDHlfDkQ">
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={10}
            center={mapCenter} // Use static center; this will not change on updates
            onLoad={onMapLoad} // Capture map instance
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
                  <h2>Driver ID: {selectedDriver.id}</h2>
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
