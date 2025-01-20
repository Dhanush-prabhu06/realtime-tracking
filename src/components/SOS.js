import React, { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SOS = () => {
  const [loading, setLoading] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSOSClick = async () => {
    if (
      !window.confirm(
        "Are you sure you want to trigger an emergency SOS alert?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const driverData = JSON.parse(localStorage.getItem("loggedInUser"));
    const { driverName, busNumber } = driverData || {};

    // Validate driver data
    if (!driverName || !busNumber) {
      setError("Driver information not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverName,
          busNumber,
          messageUrl: "https://realtime-tracking-wine.vercel.app/admin",
          phoneNumber: "+919448121495", // Added as required by updated backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSosTriggered(true);
      } else {
        setError(data.error || "Failed to send SOS alert");
        if (data.hint) {
          setError(`${data.error} - ${data.hint}`);
        }
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const emergencyContacts = [
    { title: "Police", number: "100", icon: <AlertOctagon size={20} /> },
    { title: "Ambulance", number: "108", icon: <Phone size={20} /> },
    {
      title: "Admin Helpline",
      number: "+919448121495",
      icon: <MapPin size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/driver")}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-red-600 px-6 py-8 text-center">
            <AlertTriangle size={48} className="text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Emergency SOS
            </h1>
            <p className="text-red-100">
              Press the button below to send an immediate emergency alert
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {sosTriggered ? (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-green-500 text-xl font-semibold mb-2">
                  SOS Alert Triggered Successfully
                </div>
                <p className="text-gray-600 mb-4">
                  Help is on the way. Stay calm and wait for assistance.
                  Emergency services and admin have been notified.
                </p>
                <button
                  onClick={() => setSosTriggered(false)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Send Another Alert
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleSOSClick}
                  disabled={loading}
                  className={`w-48 h-48 rounded-full ${
                    loading ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
                  } text-white text-2xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 mb-6 relative disabled:cursor-not-allowed`}
                >
                  <div className={loading ? "animate-pulse" : "animate-pulse"}>
                    {loading ? "Sending..." : "SOS"}
                  </div>
                </button>
                <p className="text-gray-600">
                  Press to immediately alert emergency services and admin
                </p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Emergency Contacts
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-red-500 mr-2">{contact.icon}</span>
                      <h3 className="font-medium text-gray-800">
                        {contact.title}
                      </h3>
                    </div>
                    <a
                      href={`tel:${contact.number}`}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle
                  className="text-yellow-500 mr-3 mt-1"
                  size={20}
                />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    Important Notice
                  </h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Only use this SOS feature in genuine emergency situations.
                    False alarms may result in disciplinary action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOS;
