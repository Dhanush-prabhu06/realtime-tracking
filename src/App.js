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
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/list" element={<DriverList />} />
        <Route path="/user" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
