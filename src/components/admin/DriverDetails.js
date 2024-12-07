import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../../firebase";

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingDriver, setEditingDriver] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "drivers"));
        const driverData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDrivers(driverData);
      } catch (error) {
        console.error("Error fetching driver data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const toggleCard = (id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(firestore, "drivers", id));

      setDrivers((prev) => prev.filter((driver) => driver.id !== id));
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-blue-600 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Registered Drivers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Driver Card */}
        <div
          className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 flex justify-center items-center cursor-pointer hover:shadow-xl transition-shadow duration-300 border-dashed border-2 border-blue-500"
          onClick={() => navigate("/admin/driverRegistration")}
        >
          <div className="text-blue-500 text-5xl font-bold">+</div>
        </div>

        {/* Driver Cards */}
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className={`bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 ${
              expandedCard === driver.id && "border-2 border-blue-500"
            }`}
            onClick={() => toggleCard(driver.id)}
          >
            {/* Basic Details */}
            <div className="flex items-center gap-4 hover:cursor-pointer">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {driver.driverName[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {driver.driverName}
                </h3>
                <p className="text-sm text-gray-600">
                  Bus Number: {driver.busNumber}
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-4 border-gray-300" />

            {/* Expanded Details */}
            {expandedCard === driver.id && (
              <div className="mt-2 space-y-2 text-sm">
                <p>
                  <strong className="font-medium text-gray-700">
                    User ID:
                  </strong>{" "}
                  {driver.userID}
                </p>
                <p>
                  <strong className="font-medium text-gray-700">
                    Vehicle Number:
                  </strong>{" "}
                  {driver.vehicleNumber}
                </p>
                <p>
                  <strong className="font-medium text-gray-700">Area:</strong>{" "}
                  {driver.area}
                </p>
                <p>
                  <strong className="font-medium text-gray-700">
                    Capacity:
                  </strong>{" "}
                  {driver.capacity}
                </p>
                <p>
                  <strong className="font-medium text-gray-700">Route:</strong>{" "}
                  {driver.route}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent toggle on delete click
                      handleDelete(driver.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverList;
