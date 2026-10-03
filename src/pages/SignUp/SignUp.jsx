import { useState } from "react";
import { api } from "../../api";

function Signup({ onBackToLogin, onSignup }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    storeName: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Empty field validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.storeName ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Email validation
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api("/api/signup", {
        method: "POST",
        body: {
          fullName: formData.fullName,
          email: formData.email,
          storeName: formData.storeName,
          password: formData.password,
        },
      });

      setSuccess("Account created successfully! 🎉");

      setTimeout(() => {
        onSignup();
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retailiq-app min-h-screen flex items-center justify-center p-6 relative overflow-hidden">

      {/* ================= BACKGROUND DECORATION ================= */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      {/* ================= SIGNUP CARD ================= */}

      <div
        className="
          relative
          z-10
          bg-white/90
          backdrop-blur-xl
          shadow-2xl
          rounded-2xl
          p-8
          w-full
          max-w-lg
          border
          border-white/40
          animate-[scaleIn_0.5s_ease-out]
        "
      >

        {/* ================= LOGO ================= */}

        <div
          className="
            text-5xl
            text-center
            mb-3
            animate-[scaleIn_0.6s_ease-out]
          "
        >
          🛒
        </div>

        {/* ================= BRAND NAME ================= */}

        <h2
          className="
            text-center
            text-2xl
            font-bold
            bg-gradient-to-r
            from-blue-600
            to-purple-600
            bg-clip-text
            text-transparent
            mb-1
          "
        >
          RetailIQ
        </h2>

        {/* ================= HEADING ================= */}

        <h1
          className="
            text-3xl
            font-bold
            text-center
            text-gray-800
          "
        >
          Create Your Account
        </h1>

        {/* ================= SUBTITLE ================= */}

        <p className="text-center text-gray-500 mt-2">
          Start managing your store with RetailIQ.
        </p>

        {/* ================= FORM ================= */}

        <form onSubmit={handleSubmit} className="mt-7">

          {/* FULL NAME */}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled={loading}
            className="
              w-full
              border border-gray-300
              rounded-xl
              p-3
              mb-5
              transition-all duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              hover:border-blue-400
              disabled:opacity-60
            "
          />

          {/* EMAIL */}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={loading}
            className="
              w-full
              border border-gray-300
              rounded-xl
              p-3
              mb-5
              transition-all duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              hover:border-blue-400
              disabled:opacity-60
            "
          />

          {/* STORE NAME */}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Name
          </label>

          <input
            type="text"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            placeholder="Enter your store name"
            disabled={loading}
            className="
              w-full
              border border-gray-300
              rounded-xl
              p-3
              mb-5
              transition-all duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              hover:border-blue-400
              disabled:opacity-60
            "
          />

          {/* PASSWORD */}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            disabled={loading}
            className="
              w-full
              border border-gray-300
              rounded-xl
              p-3
              mb-5
              transition-all duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              hover:border-blue-400
              disabled:opacity-60
            "
          />

          {/* CONFIRM PASSWORD */}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            disabled={loading}
            className="
              w-full
              border border-gray-300
              rounded-xl
              p-3
              mb-5
              transition-all duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:border-blue-500
              hover:border-blue-400
              disabled:opacity-60
            "
          />

          {/* ERROR */}

          {error && (
            <div
              className="
                bg-red-50
                border border-red-200
                text-red-600
                p-3
                rounded-xl
                text-sm
                mb-5
                animate-[fadeIn_0.3s_ease-out]
              "
            >
              ⚠️ {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              className="
                bg-green-50
                border border-green-200
                text-green-600
                p-3
                rounded-xl
                text-sm
                mb-5
                animate-[fadeIn_0.3s_ease-out]
              "
            >
              ✅ {success}
            </div>
          )}

          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-blue-600
              text-white
              py-3
              rounded-xl
              font-semibold
              shadow-md
              transition-all duration-300
              hover:bg-blue-700
              hover:shadow-xl
              hover:-translate-y-1
              active:scale-95
              disabled:opacity-60
              disabled:cursor-not-allowed
              disabled:hover:translate-y-0
            "
          >
            {loading ? "Creating Account..." : "Create Account 🚀"}
          </button>

        </form>

        {/* ================= BACK TO LOGIN ================= */}

        <p className="text-center mt-6 text-gray-600">

          Already have an account?

          <button
            type="button"
            onClick={onBackToLogin}
            className="
              text-blue-600
              font-semibold
              ml-1
              hover:underline
              transition
            "
          >
            Login
          </button>

        </p>

      </div>
    </div>
  );
}

export default Signup;