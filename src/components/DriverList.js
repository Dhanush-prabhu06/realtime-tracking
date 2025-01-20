import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  ArrowUpDown,
  Phone,
  Bus,
  User,
  Filter,
} from "lucide-react";

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("driverName");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterArea, setFilterArea] = useState("all");
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
      }
    };
    checkAuth();
  }, [navigate]);

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

  const areas = ["all", ...new Set(drivers.map((driver) => driver.area))];

  const filteredDrivers = drivers
    .filter(
      (driver) =>
        driver.driverName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterArea === "all" || driver.area === filterArea)
    )
    .sort((a, b) => {
      const modifier = sortAsc ? 1 : -1;
      if (sortOrder === "driverName") {
        return modifier * a.driverName.localeCompare(b.driverName);
      } else if (sortOrder === "busNumber") {
        return modifier * a.busNumber.localeCompare(b.busNumber);
      }
      return 0;
    });

  const toggleSort = (field) => {
    if (sortOrder === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortOrder(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/driver")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Driver Directory</h1>
          <p className="text-gray-600 mt-1">View and contact other drivers</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Area Filter */}
            <div className="relative">
              <Filter
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area === "all" ? "All Areas" : area}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end text-gray-600">
              {filteredDrivers.length} drivers found
            </div>
          </div>
        </div>

        {/* Driver List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-pulse text-gray-600">
              Loading drivers...
            </div>
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort("driverName")}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                      >
                        <User size={16} className="mr-2" />
                        Driver Name
                        <ArrowUpDown size={16} className="ml-2" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => toggleSort("busNumber")}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                      >
                        <Bus size={16} className="mr-2" />
                        Bus Number
                        <ArrowUpDown size={16} className="ml-2" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">Area</th>
                    <th className="px-6 py-3 text-left">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver, index) => (
                    <tr
                      key={driver.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index !== filteredDrivers.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {driver.driverName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {driver.busNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{driver.area}</td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${driver.phoneNumber}`}
                          className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Phone size={16} className="mr-2" />
                          {driver.phoneNumber}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">
              No drivers found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverList;
