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
    <div className="p-4">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      <button className=" bg-slate-600 mr-5">
        <a href="/admin/driverDetails">View driver details</a>
      </button>

      <Map locations={locations} />
    </div>
  );
};

export default AdminDashboard;
