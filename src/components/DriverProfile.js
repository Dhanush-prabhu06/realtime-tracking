import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Circles } from "react-loader-spinner";
import { firestore } from "../firebase"; // Adjust the path to your Firebase config

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        // Get logged-in user details from localStorage
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        // Check if the logged-in user is a driver
        if (!loggedInUser || loggedInUser.role !== "driver") {
          setError("Unauthorized access! Please log in.");
          setLoading(false);
          return;
        }

        // Query Firestore to fetch the driver's full profile based on the uid
        const driverQuery = query(
          collection(firestore, "drivers"),
          where("uid", "==", loggedInUser.uid)
        );
        const driverSnapshot = await getDocs(driverQuery);

        if (!driverSnapshot.empty) {
          const driverData = driverSnapshot.docs[0].data();
          setProfile(driverData); // Store the driver details in state
        } else {
          setError("Driver profile not found!");
        }
      } catch (error) {
        console.error("Error fetching driver profile:", error);
        setError(
          "An error occurred while loading the profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, []);

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Circles color="#4A90E2" height={80} width={80} />
      </div>
    );
  }

  // Show error message if any
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-500">{error}</h1>
          <p className="text-gray-600 mt-4">Please check and try again.</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Profile fields to display
  const profileFields = [
    { label: "Name", value: profile.driverName },
    { label: "Email", value: profile.userId },
    { label: "Phone Number", value: profile.phoneNumber },
    { label: "Bus Number", value: profile.busNumber },
    { label: "Route", value: profile.route },
    { label: "Area", value: profile.area },
    { label: "Vehicle Number", value: profile.vehicleNumber },
    { label: "Capacity", value: profile.capacity },
  ];

  // Show profile information
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Driver Profile
        </h1>
        <div className="space-y-4">
          {profileFields.map((field, index) => (
            <div
              key={index}
              className="text-base flex justify-between border-b pb-2"
            >
              <span className="font-medium text-gray-600">{field.label}:</span>
              <span className="text-gray-800">{field.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => alert("Feature coming soon!")}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
