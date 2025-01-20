import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Circles } from "react-loader-spinner";
import { firestore } from "../firebase";
import {
  ArrowLeft,
  Mail,
  Phone,
  Bus,
  MapPin,
  Hash,
  Users,
  Route,
  Building,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!loggedInUser || loggedInUser.role !== "driver") {
          setError("Unauthorized access! Please log in.");
          setLoading(false);
          return;
        }

        const driverQuery = query(
          collection(firestore, "drivers"),
          where("uid", "==", loggedInUser.uid)
        );
        const driverSnapshot = await getDocs(driverQuery);

        if (!driverSnapshot.empty) {
          const driverData = driverSnapshot.docs[0].data();
          setProfile(driverData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Circles color="#3B82F6" height={80} width={80} />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
              <span className="text-2xl text-red-500">!</span>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-center text-red-500">
              {error}
            </h1>
            <p className="mt-2 text-gray-600 text-center">
              Please check and try again.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileSections = [
    {
      title: "Personal Information",
      fields: [
        { label: "Name", value: profile.driverName, icon: <Users size={20} /> },
        { label: "Email", value: profile.userId, icon: <Mail size={20} /> },
        {
          label: "Phone Number",
          value: profile.phoneNumber,
          icon: <Phone size={20} />,
        },
      ],
    },
    {
      title: "Vehicle Information",
      fields: [
        {
          label: "Bus Number",
          value: profile.busNumber,
          icon: <Bus size={20} />,
        },
        {
          label: "Vehicle Number",
          value: profile.vehicleNumber,
          icon: <Hash size={20} />,
        },
        {
          label: "Capacity",
          value: profile.capacity,
          icon: <Users size={20} />,
        },
      ],
    },
    {
      title: "Route Information",
      fields: [
        { label: "Route", value: profile.route, icon: <Route size={20} /> },
        { label: "Area", value: profile.area, icon: <MapPin size={20} /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Driver Profile
                </h1>
                <p className="text-blue-100 mt-1">
                  Bus Number: {profile.busNumber}
                </p>
              </div>
              <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                <Bus size={32} className="text-white" />
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="p-6">
            {profileSections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className={`${sectionIndex > 0 ? "mt-8" : ""}`}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div
                      key={fieldIndex}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-blue-500 mr-3">{field.icon}</div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500">{field.label}</p>
                        <p className="text-gray-800 font-medium">
                          {field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => alert("Feature coming soon!")}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate("/driver/dashboard")}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
