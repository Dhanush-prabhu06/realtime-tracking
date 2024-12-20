import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, get } from "firebase/database";
import { auth, firestore, database } from "../firebase";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  const [driverUid, setDriverUid] = useState("");
  const [driverLatitude, setDriverLatitude] = useState(null);
  const [driverLongitude, setDriverLongitude] = useState(null);

  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const [travelDistance, setTravelDistance] = useState(null);
  const [travelDuration, setTravelDuration] = useState(null);

  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBC6jH0EHIKMEck4lNROeKGExDzDHlfDkQ",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/");
          return;
        }

        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          const { busStopLocation, busNumber } = data;
          if (busStopLocation) {
            setLatitude(busStopLocation.latitude);
            setLongitude(busStopLocation.longitude);
            setMapCenter({
              lat: busStopLocation.latitude,
              lng: busStopLocation.longitude,
            });
          }

          if (busNumber) {
            await fetchDriverData(busNumber);
          }
        } else {
          setError("User data not found!");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("An error occurred while fetching user data.");
      } finally {
        setLoading(false);
      }
    };

    const fetchDriverData = async (busNumber) => {
      try {
        // Query Firestore to find the driver with the given bus number
        const driverQuery = query(
          collection(firestore, "drivers"),
          where("busNumber", "==", busNumber)
        );
        const driverSnapshot = await getDocs(driverQuery);

        if (!driverSnapshot.empty) {
          const driverDoc = driverSnapshot.docs[0];
          const driverData = driverDoc.data();

          const driverUid = driverData.uid; // UID is the document ID
          setDriverUid(driverUid);

          // Fetch driver's location from Realtime Database
          const driverLocationRef = ref(database, `drivers/${driverUid}`);
          const driverLocationSnapshot = await get(driverLocationRef);

          if (driverLocationSnapshot.exists()) {
            const { latitude, longitude } = driverLocationSnapshot.val();
            setDriverLatitude(latitude);
            setDriverLongitude(longitude);
          } else {
            console.error("Driver location not found in Realtime Database.");
          }
        } else {
          console.error("No driver found for the given bus number.");
        }
      } catch (err) {
        console.error("Error fetching driver data:", err);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (driverLatitude && driverLongitude && latitude && longitude) {
      fetchTravelDetails(driverLatitude, driverLongitude, latitude, longitude);
    }
  }, [driverLatitude, driverLongitude, latitude, longitude]);

  const fetchTravelDetails = async (driverLat, driverLng, stopLat, stopLng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driverLat},${driverLng}&destinations=${stopLat},${stopLng}&mode=driving&key=AIzaSyBC6jH0EHIKMEck4lNROeKGExDzDHlfDkQ`
      );
      const data = await response.json();

      console.log(response);

      if (data.rows[0]?.elements[0]?.status === "OK") {
        const distance = data.rows[0].elements[0].distance.text; // e.g., "15 km"
        const duration = data.rows[0].elements[0].duration.text; // e.g., "20 mins"
        setTravelDistance(distance);
        setTravelDuration(duration);
      } else {
        console.error("Error fetching travel details:", data);
        setTravelDistance("Unavailable");
        setTravelDuration("Unavailable");
      }
    } catch (error) {
      console.error("Error during travel details API call:", error);
      setTravelDistance("Error");
      setTravelDuration("Error");
    }
  };

  const handleLocationUpdate = async () => {
    setLocationError("");
    setLocationSuccess("");

    try {
      if (latitude === null || longitude === null) {
        setLocationError("Please move the marker to set a location.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated.");
      }

      const userRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userRef, {
        busStopLocation: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });

      setLocationSuccess("Bus stop location updated successfully!");
      setIsUpdatingLocation(false); // Close the map after update
    } catch (err) {
      console.error("Error updating location:", err);
      setLocationError("Failed to update bus stop location. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          User Dashboard
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome, <strong>{userData?.name || "User"}</strong>!
        </p>

        <hr className="my-6" />

        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-700">Email:</span>{" "}
            {userData.email}
          </div>
          <div>
            <span className="font-medium text-gray-700">Mobile Number:</span>{" "}
            {userData.mobileNumber || "Not provided"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Address:</span>{" "}
            {userData.address || "Not provided"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Bus Number:</span>{" "}
            {userData.busNumber || "Not provided"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Guardian Name:</span>{" "}
            {userData.guardianName || "Not provided"}
          </div>
          <div>
            <span className="font-medium text-gray-700">
              Bus Stop Latitude:
            </span>{" "}
            {latitude !== null ? latitude : "Not set"}
          </div>
          <div>
            <span className="font-medium text-gray-700">
              Bus Stop Longitude:
            </span>{" "}
            {longitude !== null ? longitude : "Not set"}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mt-8">
          Driver Information
        </h2>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-700">Driver UID:</span>{" "}
            {driverUid || "Not retrieved"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Driver Latitude:</span>{" "}
            {driverLatitude !== null ? driverLatitude : "Not retrieved"}
          </div>
          <div>
            <span className="font-medium text-gray-700">Driver Longitude:</span>{" "}
            {driverLongitude !== null ? driverLongitude : "Not retrieved"}
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mt-8">
          Bus Stop Location
        </h2>

        {/* Conditional rendering for map or update button */}
        {latitude !== null && longitude !== null && !isUpdatingLocation ? (
          <button
            onClick={() => setIsUpdatingLocation(true)}
            className="w-full py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
          >
            Update Bus Stop Location
          </button>
        ) : (
          isLoaded &&
          isUpdatingLocation && (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Drag the marker to select your new bus stop location.
              </div>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={13}
              >
                <Marker
                  position={{ lat: latitude, lng: longitude }}
                  draggable={true}
                  onDragEnd={(e) => {
                    setLatitude(e.latLng.lat());
                    setLongitude(e.latLng.lng());
                  }}
                />
              </GoogleMap>

              <div className="mt-4">
                <strong>Latitude:</strong> {latitude}
                <br />
                <strong>Longitude:</strong> {longitude}
              </div>
              <button
                onClick={handleLocationUpdate}
                className="w-full py-2 mt-6 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none"
              >
                Save Location
              </button>
              <button
                onClick={() => setIsUpdatingLocation(false)}
                className="w-full py-2 mt-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          )
        )}

        <h2 className="text-xl font-bold text-gray-800 mt-8">
          Travel Information
        </h2>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-700">Distance:</span>{" "}
            {travelDistance || "Calculating..."}
          </div>
          <div>
            <span className="font-medium text-gray-700">Estimated Time:</span>{" "}
            {travelDuration || "Calculating..."}
          </div>
        </div>

        {/* Error/Success Messages */}
        {locationError && <p className="text-red-500 mt-4">{locationError}</p>}
        {locationSuccess && (
          <p className="text-green-500 mt-4">{locationSuccess}</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
