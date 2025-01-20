import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import DriverDashboard from "./components/DriverDashboard";
import DriverDetails from "./components/admin/DriverDetails";
import DriverRegistration from "./components/admin/DriverRegistration";
import UserDetails from "./components/admin/UserDetails";
import UserDashboard from "./components/UserDashboard";
import DriverList from "./components/DriverList";
import AdminProfile from "./components/admin/AdminProfile";
import DriverProfile from "./components/DriverProfile";
import SOS from "./components/SOS";
import VoiceCommunication from "./components/communication/VoiceCommunication";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/driverDetails" element={<DriverDetails />} />
        <Route
          path="/admin/driverRegistration"
          element={<DriverRegistration />}
        />
        <Route path="/admin/userDetails" element={<UserDetails />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/list" element={<DriverList />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/sos" element={<SOS />} />
        <Route path="/driver/communication" element={<VoiceCommunication />} />
        <Route path="/user" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
