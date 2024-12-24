import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, firestore } from "../firebase"; // Firestore instance
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect logic on mount
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (loggedInUser?.role) {
      switch (loggedInUser.role) {
        case "admin":
          navigate("/admin");
          break;
        case "driver":
          navigate("/driver");
          break;
        case "user":
          navigate("/user");
          break;
        default:
          navigate("/");
          break;
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Hardcoded Admin Login
      if (email === "admin@gmail.com" && password === "123456") {
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({ role: "admin", email })
        );
        navigate("/admin");
        return;
      }

      // Firebase Authentication for other users
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check "users" collection
      const userDoc = await getDoc(doc(firestore, "users", user.uid));

      if (userDoc.exists()) {
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({ role: "user", email: user.email, uid: user.uid })
        );
        navigate("/user");
      } else {
        // If not in "users", query the "drivers" collection
        const driverQuery = query(
          collection(firestore, "drivers"),
          where("uid", "==", user.uid)
        );
        const driverSnapshot = await getDocs(driverQuery);

        if (!driverSnapshot.empty) {
          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({
              role: "driver",
              email: user.email,
              uid: user.uid,
              ...driverSnapshot.docs[0].data(),
            })
          );
          navigate("/driver");
        } else {
          throw new Error("User or driver data not found!");
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-700 text-center">
          Welcome Back!
        </h1>
        <p className="text-sm text-gray-500 text-center">
          Please sign in to your account
        </p>
        {error && (
          <p className="text-sm text-red-500 bg-red-100 p-2 rounded">{error}</p>
        )}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-gray-600 text-sm font-medium"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-gray-600 text-sm font-medium"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a
            href="/register"
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Sign up
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
