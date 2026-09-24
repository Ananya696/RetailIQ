import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <nav
      className="
        sticky
        top-0
        z-50

        bg-slate-950/80
        backdrop-blur-xl

        border-b
        border-white/10

        px-6
        py-4

        flex
        justify-between
        items-center

        shadow-lg
        shadow-black/10

        animate-[navDrop_0.6s_ease-out]
      "
    >
      {/* ================= LOGO ================= */}

      <h1
        className="
          text-3xl
          font-bold
          tracking-tight
          text-white

          transition-all
          duration-300

          hover:text-blue-400
          hover:scale-105

          cursor-pointer
        "
      >
        RetailIQ
      </h1>

      {/* ================= RIGHT SECTION ================= */}

      <div className="flex items-center gap-5">

        {/* ================= NOTIFICATION ================= */}

        <div
          className="
            relative
            cursor-pointer
            group

            w-10
            h-10

            flex
            items-center
            justify-center

            rounded-xl

            bg-white/5
            border
            border-white/10

            transition-all
            duration-300

            hover:bg-white/10
            hover:border-white/20
            hover:-translate-y-0.5
          "
        >
          <FaBell
            className="
              text-xl
              text-white/80

              transition-all
              duration-300

              group-hover:text-blue-400
              group-hover:scale-110
            "
          />

          {/* Notification Dot */}

          <span
            className="
              absolute
              top-1.5
              right-1.5

              w-2.5
              h-2.5

              bg-red-500
              rounded-full

              border-2
              border-slate-950

              animate-pulse
            "
          />
        </div>

        {/* ================= PROFILE ================= */}

        <div
          className="
            flex
            items-center
            gap-3

            cursor-pointer

            px-3
            py-2

            rounded-xl

            bg-white/5
            border
            border-white/10

            transition-all
            duration-300

            hover:bg-white/10
            hover:border-white/20
            hover:-translate-y-0.5
          "
        >
          <FaUserCircle
            className="
              text-3xl
              text-white/80

              transition-all
              duration-300

              hover:text-blue-400
            "
          />

          <span
            className="
              font-medium
              text-white/90
            "
          >
            Akshita
          </span>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;