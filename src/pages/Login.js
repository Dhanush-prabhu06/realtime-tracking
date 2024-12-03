import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.email === "admin@gmail.com") navigate("/admin");
        else navigate("/driver");
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <form onSubmit={handleLogin} className="p-4">
      <h1 className="text-xl font-bold">Login</h1>
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
      <button type="submit" className="mt-4 p-2 bg-green-500 text-white">
        Login
      </button>
    </form>
  );
};

export default Login;
