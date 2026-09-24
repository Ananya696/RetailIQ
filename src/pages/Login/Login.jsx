function Login({ onLogin, onSignup }) {
  return (
    <div className="retailiq-app min-h-screen flex items-center justify-center p-6">

      {/* ================= LOGIN CARD ================= */}
      <div
        className="
          w-full
          max-w-lg
          p-10
          rounded-3xl

          bg-slate-950/35
          backdrop-blur-2xl

          border border-white/20
          shadow-2xl

          animate-[scaleIn_0.5s_ease-out]
        "
      >

        {/* ================= LOGO ================= */}
        <div
          className="
            text-5xl
            text-center
            mb-4
            drop-shadow-lg
            animate-[scaleIn_0.6s_ease-out]
          "
        >
          🛒
        </div>

        {/* ================= HEADING ================= */}
        <h1
          className="
            text-3xl
            font-bold
            text-center
            text-white
            drop-shadow-lg
          "
        >
          RetailIQ
        </h1>

        {/* ================= SUBTITLE ================= */}
        <p className="text-center text-white/80 mt-2">
          Smart Retail Intelligence Platform
        </p>

        {/* ================= WELCOME MESSAGE ================= */}
        <p className="text-center text-white/60 text-sm mb-8">
          Welcome back! Please login to continue.
        </p>

        {/* ================= EMAIL ================= */}
        <label className="block text-sm font-medium text-white/90 mb-2">
          Email Address
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          className="
            w-full
            bg-white/10
            text-white
            placeholder:text-white/50

            border border-white/20
            rounded-xl
            p-3
            mb-5

            transition-all
            duration-300

            focus:outline-none
            focus:ring-2
            focus:ring-blue-400
            focus:border-blue-400

            hover:bg-white/15
            hover:border-white/40
          "
        />

        {/* ================= PASSWORD ================= */}
        <label className="block text-sm font-medium text-white/90 mb-2">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter your password"
          className="
            w-full
            bg-white/10
            text-white
            placeholder:text-white/50

            border border-white/20
            rounded-xl
            p-3
            mb-3

            transition-all
            duration-300

            focus:outline-none
            focus:ring-2
            focus:ring-blue-400
            focus:border-blue-400

            hover:bg-white/15
            hover:border-white/40
          "
        />

        {/* ================= FORGOT PASSWORD ================= */}
        <div className="text-right mb-6">
          <button
            type="button"
            className="
              text-blue-300
              text-sm
              hover:text-blue-200
              hover:underline
              transition
            "
          >
            Forgot Password?
          </button>
        </div>

        {/* ================= LOGIN BUTTON ================= */}
        <button
          onClick={onLogin}
          className="
            w-full
            bg-blue-600
            text-white
            py-3
            rounded-xl

            font-semibold

            shadow-lg
            shadow-blue-900/30

            transition-all
            duration-300

            hover:bg-blue-500
            hover:shadow-xl
            hover:shadow-blue-500/30
            hover:-translate-y-1

            active:scale-95
          "
        >
          Login
        </button>

        {/* ================= SIGN UP ================= */}
        <p className="text-center mt-6 text-white/70">
          Don't have an account?

          <button
            onClick={onSignup}
            className="
              text-blue-300
              cursor-pointer
              font-semibold
              ml-1

              hover:text-blue-200
              hover:underline

              transition
            "
          >
            Sign Up
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;