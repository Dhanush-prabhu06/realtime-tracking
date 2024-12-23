import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../firebase"; // Adjust the path based on your Firebase setup

const AdminProfile = () => {
  const [adminDetails, setAdminDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        // Reference to the admin document
        const adminDocRef = doc(firestore, "admin", "QGZ2CLFPbM6RA4bRqWge");
        const docSnapshot = await getDoc(adminDocRef);

        console.log(docSnapshot.data());

        if (docSnapshot.exists()) {
          setAdminDetails(docSnapshot.data());
        } else {
          console.error("Admin document not found!");
        }
      } catch (error) {
        console.error("Error fetching admin details:", error);
      }
      setLoading(false);
    };

    fetchAdminDetails();
    console.log(adminDetails);
  }, []);

  if (loading) {
    return <div>Loading admin details...</div>;
  }

  if (!adminDetails) {
    return <div>No admin details available!</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto mt-8">
      <h1 className="text-xl font-bold text-center mb-4">Admin Profile</h1>
      <div className="space-y-4">
        <div>
          <span className="font-semibold">Name:</span>{" "}
          {adminDetails.name || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Email:</span>{" "}
          {adminDetails.userID || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Phone Number:</span>{" "}
          {adminDetails.phoneNumber || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Role:</span>{" "}
          {adminDetails.role || "N/A"}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
