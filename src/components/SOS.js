import React from "react";

const SOS = () => {
  const handleSOSClick = async () => {
    const driverData = JSON.parse(localStorage.getItem("loggedInUser"));
    const { driverName, busNumber } = driverData || {};

    console.log(driverName, busNumber);

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
        }),
      });

      console.log(response);

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        alert("SOS triggered successfully!");
      } else {
        alert(`Failed to send SOS: ${data.error}`);
      }
    } catch (error) {
      alert("Error sending SOS. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">SOS Page</h1>
      <button
        onClick={handleSOSClick}
        className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
      >
        SOS
      </button>
    </div>
  );
};

export default SOS;
