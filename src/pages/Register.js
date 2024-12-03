import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver"); // Default role

  const handleSubmit = (e) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User registered:", userCredential.user);
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h1 className="text-xl font-bold">Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block mt-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block mt-2"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="block mt-2"
      >
        <option value="driver">Driver</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="mt-4 p-2 bg-blue-500 text-white">
        Register
      </button>
    </form>
  );
};

export default Register;
