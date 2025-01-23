import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const Map = ({ locations, currentDriverId, mapCenter, onMarkerClick }) => {
  const mapStyles = { height: "630px", width: "100%" };

  // State to track which marker's info window is open
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Update the map center when the currentDriverId location is found
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [driverName, setDriverName] = useState();
  const [busNumber, serBusNumber] = useState();
  console.log(driverName);

  useEffect(() => {
    if (currentDriverId) {
      const driverLocation = locations.find(
        (loc) => loc.id === currentDriverId
      );
      if (driverLocation) {
        setCurrentDriverLocation({
          lat: driverLocation.latitude,
          lng: driverLocation.longitude,
        });
      }
    }
  }, [currentDriverId, locations]);

  const fetchDriverDetails = async (uid) => {
    const db = getFirestore();
    const driversCollection = collection(db, "drivers");

    // Query Firestore to find the document with the matching uid
    const q = query(driversCollection, where("uid", "==", uid));

    try {
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const driverDoc = querySnapshot.docs[0]; // Get the first matching document
        const driverData = driverDoc.data(); // Access the document data
        return {
          driverName: driverData.driverName,
          busNumber: driverData.busNumber,
        };
      } else {
        console.error("No driver found with the given UID");
        return null;
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
      return null;
    }
  };

  // Usage example:
  const handleMarkerClick = async (uid) => {
    const driverDetails = await fetchDriverDetails(uid);
    if (driverDetails) {
      console.log("Driver Details:", driverDetails);
      // Use driverDetails.driverName and driverDetails.busNumber as needed
      setDriverName(driverDetails.driverName);
      serBusNumber(driverDetails.busNumber);
    }
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyCNuNH8t_kGXe1FEH8FjkGvRPYnzTGRx7Y">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={10}
        center={currentDriverLocation || mapCenter} // Use currentDriverLocation if available
      >
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            icon={
              loc.id === currentDriverId
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" // Red icon for current driver
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // Blue icon for others
            }
            onClick={() => {
              setSelectedLocation(loc); // Set selected marker details
              handleMarkerClick(loc.id); // Use the UID here
              onMarkerClick(loc.latitude, loc.longitude); // Recenter the map
              handleMarkerClick(loc.id); // Use the UID here
            }}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={{
              lat: selectedLocation.latitude,
              lng: selectedLocation.longitude,
            }}
            onCloseClick={() => setSelectedLocation(null)} // Close popup on click
          >
            <div>
              <h3 className="font-bold">{selectedLocation.name || "Driver"}</h3>
              {/* <p>ID: {selectedLocation.id}</p> */}

              <p>Driver Name: {driverName}</p>
              <p>Bus Number: {busNumber}</p>

              {/* Add more details as required */}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
