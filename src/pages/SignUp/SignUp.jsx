import { useState } from "react";

function Signup({ onBackToLogin, onSignup }) {
  // ================= FORM DATA =================
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    storeName: "",
    password: "",
    confirmPassword: "",
  });

  // ================= ERROR =================
  const [error, setError] = useState("");

  // ================= SUCCESS =================
  const [success, setSuccess] = useState("");

  // ================= INPUT HANDLER =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setError("");
    setSuccess("");
  };

  // ================= SIGN UP =================
  const handleSubmit = (e) => {
    e.preventDefault();

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

    // Success
    setSuccess("Account created successfully! 🎉");

    // Small delay before going to Login
    setTimeout(() => {
      onSignup();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      {/* ================= SIGNUP CARD ================= */}

      <div
        className="
          bg-white
          shadow-2xl
          rounded-2xl
          p-8
          w-full
          max-w-lg
          animate-[scaleIn_0.5s_ease-out]
        "
      >

        {/* Logo */}

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

        {/* Heading */}

        <h1
          className="
            text-3xl
            font-bold
            text-center
            text-blue-700
          "
        >
          Create Your Account
        </h1>

        {/* Subtitle */}

        <p className="text-center text-gray-500 mt-2">
          Start managing your store with RetailIQ.
        </p>


        {/* ================= FORM ================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-7"
        >

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
            "
          >
            Create Account 🚀
          </button>

        </form>


        {/* ================= BACK TO LOGIN ================= */}

        <p className="text-center mt-6 text-gray-600">

          Already have an account?

          <button
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