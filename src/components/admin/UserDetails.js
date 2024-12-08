import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "../../firebase";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser } from "react-icons/fa";

const UserDetails = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const q = query(collection(firestore, "users"), orderBy("busNumber"));
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to fetch user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const groupedUsers = users.reduce((acc, user) => {
    const busNumber = user.busNumber || "Unassigned";
    if (!acc[busNumber]) {
      acc[busNumber] = [];
    }
    acc[busNumber].push(user);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
        Admin Panel
      </h1>
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p className="text-center text-lg">Loading users...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedUsers).map(([busNumber, users]) => (
            <div key={busNumber} className="bg-white rounded-lg shadow-md">
              {/* Group Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-3 rounded-t-lg font-bold text-lg">
                Bus Number: {busNumber}
              </div>
              {/* User Details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border border-gray-200 rounded-lg shadow hover:shadow-md transition duration-200 bg-white"
                  >
                    <h2 className="text-xl font-semibold text-blue-600 mb-2">
                      <FaUser className="inline-block mr-2 text-blue-400" />
                      {user.name}
                    </h2>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <FaEnvelope className="inline-block mr-2 text-gray-500" />
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                      <p>
                        <FaPhone className="inline-block mr-2 text-gray-500" />
                        <span className="font-medium">Mobile:</span>{" "}
                        {user.mobileNumber}
                      </p>
                      <p>
                        <FaMapMarkerAlt className="inline-block mr-2 text-gray-500" />
                        <span className="font-medium">Address:</span>{" "}
                        {user.address}
                      </p>
                      <p>
                        <FaUser className="inline-block mr-2 text-gray-500" />
                        <span className="font-medium">Guardian:</span>{" "}
                        {user.guardianName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDetails;
