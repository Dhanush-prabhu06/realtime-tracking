import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useNavigate } from "react-router-dom";

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("driverName"); // Default sorting by bus number

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
        // If UID is missing or role is not 'user', redirect to login
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch drivers from Firestore
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "drivers"));
        const driverList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDrivers(driverList);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Handle search filter
  const filteredDrivers = drivers.filter((driver) =>
    driver.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sorting
  const sortedDrivers = filteredDrivers.sort((a, b) => {
    if (sortOrder === "driverName") {
      return a.driverName.localeCompare(b.driverName);
    } else if (sortOrder === "busNumber") {
      return a.busNumber.localeCompare(b.busNumber);
    }
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Driver List</h2>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by driver name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Sort Dropdown */}
      <div className="mb-4">
        <label className="mr-2 font-medium text-gray-700">Sort By:</label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
        >
          <option value="busNumber">Bus Number</option>
          <option value="driverName">Driver Name</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-600">Loading drivers...</p>
      ) : sortedDrivers.length > 0 ? (
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">
                Driver Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Bus Number
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Mobile Number
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {driver.driverName}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {driver.busNumber}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-blue-600">
                  <a href={`tel:${driver.phoneNumber}`}>{driver.phoneNumber}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No drivers found.</p>
      )}
    </div>
  );
};

export default DriverList;
