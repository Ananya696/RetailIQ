import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invitation token is missing.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api("/api/set-password", {
        method: "POST",
        body: {
          token,
          password,
        },
      });

      setSuccess("Password set successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.message || "Unable to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retailiq-app min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-8 shadow-xl bg-white"
      >
        <h1 className="text-2xl font-bold mb-2">
          Set Your Password
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Create a password to activate your RetailIQ staff account.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <label className="block text-sm font-medium mb-2">
          New Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border px-4 py-3 mb-4 outline-none"
          placeholder="Enter password"
          required
        />

        <label className="block text-sm font-medium mb-2">
          Confirm Password
        </label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          className="w-full rounded-lg border px-4 py-3 mb-6 outline-none"
          placeholder="Confirm password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-60"
        >
          {loading ? "Setting Password..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
