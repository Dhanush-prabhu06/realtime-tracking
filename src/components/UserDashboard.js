import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  addDoc,
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

  const [latitude, setLatitude] = useState(0);
  console.log(latitude);
  const [longitude, setLongitude] = useState(0);
  const [mapCenter, setMapCenter] = useState({
    lat: 13.326955, // Default latitude
    lng: 77.123847, // Default longitude
  });

  const [driverUid, setDriverUid] = useState("");
  const [driverLatitude, setDriverLatitude] = useState(null);
  const [driverLongitude, setDriverLongitude] = useState(null);

  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const [travelDistance, setTravelDistance] = useState(null);
  const [travelDuration, setTravelDuration] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState(null);

  const [notificationSent, setNotificationSent] = useState(false); // Add state for notification tracking

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

      if (!currentUserUid || currentUserRole !== "user") {
        // If UID is missing or role is not 'user', redirect to login
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCNuNH8t_kGXe1FEH8FjkGvRPYnzTGRx7Y",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        const currentUserUid = loggedInUser.uid;
        const currentUserRole = loggedInUser.role;

        const userDoc = await getDoc(doc(firestore, "users", currentUserUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          const { busStopLocation, busNumber } = data;

          if (
            busStopLocation &&
            busStopLocation.latitude &&
            busStopLocation.longitude
          ) {
            setLatitude(parseFloat(busStopLocation.latitude));
            setLongitude(parseFloat(busStopLocation.longitude));
            setMapCenter({
              lat: busStopLocation.latitude,
              lng: busStopLocation.longitude,
            });
          } else {
            setMapCenter({ lat: 0, lng: 0 }); // Default coordinates (e.g., center of the map to a generic location)
          }

          if (busNumber) {
            await fetchDriverData(busNumber);
          }
        } else {
          setError("User data not found!");
        }
        console.log("Map Center:", mapCenter);
        console.log("Latitude:", latitude, "Longitude:", parseFloat(longitude));
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

  const handleLocationUpdate = async () => {
    setLocationError("");
    setLocationSuccess("");

    try {
      if (latitude === null || longitude === null) {
        setLocationError("Please move the marker to set a location.");
        return;
      }

      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      const currentUserUid = loggedInUser.uid;

      if (!currentUserUid) {
        throw new Error("User not authenticated.");
      }

      const userRef = doc(firestore, "users", currentUserUid);
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

  useEffect(() => {
    if (driverLatitude && driverLongitude && latitude && longitude) {
      fetchTravelDetails(driverLatitude, driverLongitude, latitude, longitude);
    }
  }, [driverLatitude, driverLongitude, latitude, longitude]);

  const fetchTravelDetails = async (driverLat, driverLng, stopLat, stopLng) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/distancematrix?origins=${driverLat},${driverLng}&destinations=${stopLat},${stopLng}&mode=driving`
      );

      const data = await response.json();

      if (data.rows[0]?.elements[0]?.status === "OK") {
        const distance = data.rows[0].elements[0].distance.text;
        const durationText = data.rows[0].elements[0].duration.text;
        const durationValue = parseInt(durationText.split(" ")[0]); // Extract duration as a number
        const destination = data.destination_addresses?.[0];

        setTravelDistance(distance);
        setTravelDuration(durationText);
        setDestinationAddress(destination);

        // Notify the user if travel time is less than 5 minutes and notification has not been sent
        if (durationValue < 3 && !notificationSent) {
          notifyUser();
          setNotificationSent(true); // Prevent repeated notifications
        }
      } else {
        console.error("Error fetching travel details:", data);
        setTravelDistance("Unavailable");
        setTravelDuration("Unavailable");
        setDestinationAddress("Unavailable");
      }
    } catch (error) {
      console.error("Error during travel details API call:", error);
      setTravelDistance("Error");
      setTravelDuration("Error");
      setDestinationAddress("Error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const notifyUser = async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

      if (!loggedInUser) {
        console.error("No logged-in user found.");
        return;
      }

      const notificationRef = collection(firestore, "notifications");

      await addDoc(notificationRef, {
        userUid: loggedInUser.uid, // UID of the user
        message: "The driver is less than 5 minutes away!",
        timestamp: new Date(),
      });

      console.log("Notification sent to user successfully.");
      alert("The driver is less than 5 minutes away!");
    } catch (error) {
      console.error("Error sending notification to user:", error);
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
      <div className=" relative max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
        >
          Logout
        </button>
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
        {isLoaded && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Drag the marker to select your new bus stop location.
            </div>
            {isLoaded && mapCenter && mapCenter.lat && mapCenter.lng && (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter} // Center on the user's bus stop location
                zoom={13}
              >
                {/* Bus Stop Location Marker */}
                {latitude && longitude && (
                  <Marker
                    position={{ lat: latitude, lng: longitude }}
                    draggable={true}
                    onDragEnd={(e) => {
                      setLatitude(e.latLng.lat());
                      setLongitude(e.latLng.lng());
                    }}
                    label={"bus stop"}
                  />
                )}

                {/* Driver Location Marker */}
                {driverLatitude && driverLongitude && (
                  <Marker
                    position={{ lat: driverLatitude, lng: driverLongitude }}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Example: Custom blue marker icon
                    }}
                    label={"Bus"}
                  />
                )}
              </GoogleMap>
            )}

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
          </div>
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
          <div>
            <span className="font-medium text-gray-700">Bus Address:</span>{" "}
            {destinationAddress || "Calculating..."}
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
