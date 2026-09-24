import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaChartBar,
  FaChartLine,
  FaTruck,
  FaExclamationTriangle,
  FaRobot,
  FaMicrophone,
  FaFileInvoice,
  FaCog,
} from "react-icons/fa";

function Sidebar({ activePage, onNavigate }) {
  const menuItem = (page, label, Icon) => (
    <div
      onClick={() => onNavigate(page)}
      className={`
        group
        relative
        flex
        items-center
        gap-3
        px-3
        py-3
        rounded-xl
        cursor-pointer
        text-sm
        font-medium
        transition-all
        duration-300
        ease-out
        overflow-hidden

        ${
          activePage === page
            ? `
              bg-gradient-to-r
              from-blue-600/90
              to-indigo-600/80
              text-white
              border
              border-blue-400/30
              shadow-lg
              shadow-blue-900/30
              translate-x-1
            `
            : `
              text-white/65
              border
              border-transparent
              hover:bg-white/[0.07]
              hover:text-white
              hover:border-white/10
              hover:translate-x-1
            `
        }
      `}
    >
      {/* Active glow */}
      {activePage === page && (
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-blue-400/10
            via-transparent
            to-indigo-400/10
            pointer-events-none
          "
        />
      )}

      {/* Icon container */}
      <div
        className={`
          relative
          z-10
          w-9
          h-9
          rounded-lg
          flex
          items-center
          justify-center
          transition-all
          duration-300

          ${
            activePage === page
              ? `
                bg-white/15
                border
                border-white/20
                shadow-md
              `
              : `
                bg-white/[0.04]
                border
                border-white/[0.06]
                group-hover:bg-blue-500/10
                group-hover:border-blue-400/20
              `
          }
        `}
      >
        <Icon
          className={`
            text-base
            transition-all
            duration-300

            ${
              activePage === page
                ? "text-white scale-110"
                : "text-white/55 group-hover:text-blue-300 group-hover:scale-110"
            }
          `}
        />
      </div>

      {/* Label */}
      <span className="relative z-10 flex-1">
        {label}
      </span>

      {/* Active indicator */}
      {activePage === page && (
        <span
          className="
            relative
            z-10
            w-1.5
            h-6
            rounded-full
            bg-white
            shadow-[0_0_10px_rgba(255,255,255,0.8)]
            animate-pulse
          "
        />
      )}
    </div>
  );

  return (
    <aside
      className="
        w-64
        min-h-[calc(100vh-73px)]
        bg-slate-950/85
        backdrop-blur-2xl
        border-r
        border-white/10
        text-white
        p-5
        shadow-2xl
        shadow-black/20
        animate-[slideIn_0.6s_ease-out]
        flex
        flex-col
      "
    >
      {/* ================= SIDEBAR HEADER ================= */}

      <div className="mb-7 px-2">
        <div className="flex items-center gap-3">
          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-gradient-to-br
              from-blue-500
              to-indigo-600
              flex
              items-center
              justify-center
              shadow-lg
              shadow-blue-900/30
            "
          >
            <FaChartLine className="text-white text-lg" />
          </div>

          <div>
            <h2
              className="
                text-xl
                font-bold
                tracking-tight
                text-white
              "
            >
              Menu
            </h2>

            <p
              className="
                text-[11px]
                text-white/40
                mt-0.5
              "
            >
              Manage your store
            </p>
          </div>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}

      <nav className="space-y-2">
        {menuItem("dashboard", "Dashboard", FaHome)}

        {menuItem("inventory", "Inventory", FaBox)}

        {menuItem("sales", "Sales", FaShoppingCart)}

        {menuItem("forecast", "Forecast", FaChartLine)}

        {menuItem("smart-restock", "Smart Restock", FaTruck)}

        {menuItem("anomalies", "Anomalies", FaExclamationTriangle)}

        {menuItem("ai-assistant", "AI Assistant", FaRobot)}

        {menuItem("voice-billing", "Voice Billing", FaMicrophone)}

        {menuItem("invoice-scanner", "Invoice Scanner", FaFileInvoice)}

        {menuItem("employees", "Employees", FaUsers)}

        {menuItem("analytics", "Analytics", FaChartBar)}

        {menuItem("settings", "Settings", FaCog)}
      </nav>

      {/* ================= BOTTOM BRANDING ================= */}

      <div className="mt-auto pt-6 px-1">
        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-white/[0.08]
            to-white/[0.03]
            border
            border-white/10
            p-4
            shadow-lg
            transition-all
            duration-300
            hover:border-blue-400/20
            hover:shadow-blue-900/10
          "
        >
          {/* Decorative glow */}
          <div
            className="
              absolute
              -top-8
              -right-8
              w-20
              h-20
              rounded-full
              bg-blue-500/10
              blur-2xl
            "
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-blue-400
                  shadow-[0_0_8px_rgba(96,165,250,0.8)]
                "
              />

              <p
                className="
                  text-xs
                  font-semibold
                  text-blue-300
                  tracking-wide
                "
              >
                RetailIQ
              </p>
            </div>

            <p
              className="
                text-xs
                text-white/50
                leading-relaxed
              "
            >
              Smart Retail Intelligence
            </p>

            <div
              className="
                mt-3
                h-px
                bg-gradient-to-r
                from-blue-400/30
                via-white/10
                to-transparent
              "
            />

            <p
              className="
                text-[10px]
                text-white/30
                mt-2
              "
            >
              AI-powered store management
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;