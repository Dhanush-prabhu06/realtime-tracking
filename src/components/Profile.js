import React, { useState } from "react";

const Profile = ({ userData }) => {
  const [showProfile, setShowProfile] = useState(false);

  const toggleProfile = () => setShowProfile(!showProfile);

  return (
    <div className="relative">
      {/* Profile Icon */}
      <button
        onClick={toggleProfile}
        className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 focus:outline-none"
      >
        <span className="text-white font-bold">
          {userData?.name?.charAt(0).toUpperCase() || "U"}
        </span>
      </button>

      {/* Profile Details Modal */}
      {showProfile && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="px-4 py-3">
            <h2 className="text-lg font-bold text-gray-800">
              {userData?.name || "User"}
            </h2>
            <p className="text-sm text-gray-600">{userData?.email || "N/A"}</p>
          </div>
          <div className="border-t px-4 py-3 text-sm text-gray-600">
            <div>
              <span className="font-medium">Mobile Number:</span>{" "}
              {userData?.mobileNumber || "Not provided"}
            </div>
            <div>
              <span className="font-medium">Address:</span>{" "}
              {userData?.address || "Not provided"}
            </div>
            <div>
              <span className="font-medium">Bus Number:</span>{" "}
              {userData?.busNumber || "Not provided"}
            </div>
            <div>
              <span className="font-medium">Guardian Name:</span>{" "}
              {userData?.guardianName || "Not provided"}
            </div>
          </div>
          <button
            onClick={toggleProfile}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded-b-md focus:outline-none"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
