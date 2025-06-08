import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success("Login successful!");
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="max-w-xl w-full space-y-10">
        <div>
          <h2 className="text-4xl md:text-5xl text-center font-extrabold text-white mb-6">
            Sign in to your account
          </h2>
        </div>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-6">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input rounded-t-md text-lg md:text-xl py-4"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input rounded-b-md text-lg md:text-xl py-4"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="form-button text-lg md:text-xl py-4 md:py-5"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
