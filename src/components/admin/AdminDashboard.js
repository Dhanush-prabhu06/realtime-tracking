import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase";
import Map from "../Map";

const AdminDashboard = () => {
  const [locations, setLocations] = useState([]);

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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Admin Dashboard
        </h1>
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
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Driver Locations
          </h2>
          <Map locations={locations} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
