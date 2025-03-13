import { useState } from "react";
import { auth, firestore } from "../../firebase"; // Import Firestore
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore"; // Firestore functions
import { useNavigate } from "react-router-dom";

const DriverRegistration = () => {
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    busNumber: "",
    vehicleNumber: "",
    driverName: "",
    phoneNumber: "", // Added phone number
    area: "",
    capacity: "",
    route: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // State to track loading
  const [drivers, setDrivers] = useState([]); // Store registered driver details
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); // Set loading to true when processing starts

    try {
      // Create a new user in Firebase Authentication
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.userId, // Generate a dummy email using the User ID
        formData.password
      );

      // Save additional driver details in Firestore
      const docRef = await addDoc(collection(firestore, "drivers"), {
        uid: user.uid,
        userId: formData.userId,
        busNumber: formData.busNumber,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        phoneNumber: formData.phoneNumber, // Added phone number
        area: formData.area,
        capacity: formData.capacity,
        route: formData.route,
        role: "driver", // Assign role as "driver"
        licenseNumber: formData.licenseNumber, // Added license number
        createdAt: Timestamp.now(),
      });

      // Add the registered driver details to the card display
      setDrivers((prev) => [
        ...prev,
        { driverName: formData.driverName, busNumber: formData.busNumber },
      ]);

      setSuccess("Driver account created successfully!");
      setFormData({
        userId: "",
        password: "",
        busNumber: "",
        vehicleNumber: "",
        driverName: "",
        phoneNumber: "", // Reset phone number field
        area: "",
        capacity: "",
        licenseNumber: "", // Reset license number field
        route: "",
      });

      navigate("/admin/driverDetails");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); // Set loading to false after processing
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Register a New Driver
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="userId"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            User ID
          </label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="busNumber"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Bus Number
          </label>
          <input
            type="text"
            id="busNumber"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="vehicleNumber"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Vehicle Number
          </label>
          <input
            type="text"
            id="vehicleNumber"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="driverName"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Driver Name
          </label>
          <input
            type="text"
            id="driverName"
            name="driverName"
            value={formData.driverName}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="phoneNumber"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="area"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Area
          </label>
          <input
            type="text"
            id="area"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="capacity"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Capacity
          </label>
          <input
            type="text"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label
            htmlFor="route"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Route
          </label>
          <input
            type="text"
            id="route"
            name="route"
            value={formData.route}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        {/* ******************************************************** */}
        <div>
          <label
            htmlFor="licenseNumber"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Licence Number
          </label>
          <input
            type="text"
            id="licenseNumber"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            required
          />
        </div>
        {/* ************************************************************ */}
        <button
          type="submit"
          className={`w-full px-4 py-2 rounded-md text-white ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading} // Disable the button while loading
        >
          {loading ? "Loading..." : "Register Driver"}{" "}
          {/* Change button text */}
        </button>
        {success && (
          <p className="mt-4 text-green-600 font-medium">{success}</p>
        )}
        {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
      </form>
    </div>
  );
};

export default DriverRegistration;
