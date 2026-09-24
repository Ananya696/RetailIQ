import { useState } from "react";
import {
  Settings as SettingsIcon,
  Store,
  User,
  Phone,
  Mail,
  CircleDollarSign,
  Package,
  Bell,
  ShieldCheck,
  Info,
  Save,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";

function Settings() {
  // =========================================
  // STORE SETTINGS
  // =========================================

  const [storeSettings, setStoreSettings] = useState({
    storeName: "RetailIQ Store",
    ownerName: "Store Owner",
    phone: "9876543210",
    email: "store@example.com",
    currency: "INR (₹)",
    lowStockThreshold: 5,
    lowStockAlerts: true,
  });

  const [saved, setSaved] = useState(false);

  // =========================================
  // HANDLE INPUT
  // =========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setStoreSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSaved(false);
  };

  // =========================================
  // SAVE SETTINGS
  // =========================================

  const handleSave = (e) => {
    e.preventDefault();

    if (!storeSettings.storeName.trim()) {
      alert("Please enter your store name.");
      return;
    }

    if (!storeSettings.ownerName.trim()) {
      alert("Please enter owner's name.");
      return;
    }

    if (!storeSettings.phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    if (!/^\d{10}$/.test(storeSettings.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (
      !storeSettings.email.trim() ||
      !storeSettings.email.includes("@")
    ) {
      alert("Please enter a valid email address.");
      return;
    }

    if (
      storeSettings.lowStockThreshold === "" ||
      Number(storeSettings.lowStockThreshold) < 1
    ) {
      alert("Low stock threshold must be at least 1.");
      return;
    }

    setStoreSettings((current) => ({
      ...current,
      lowStockThreshold: Number(
        current.lowStockThreshold
      ),
    }));

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="retailiq-app min-h-screen p-4 sm:p-6 lg:p-8 text-white">

      {/* =========================================
          HERO HEADER
      ========================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          mb-7
          border border-white/10
          bg-slate-950/55
          backdrop-blur-2xl
          shadow-2xl shadow-black/20
        "
      >

        {/* Glow effects */}

        <div
          className="
            absolute
            -top-28
            -right-20
            w-80 h-80
            rounded-full
            bg-blue-500/20
            blur-3xl
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            -bottom-32
            left-10
            w-72 h-72
            rounded-full
            bg-violet-500/15
            blur-3xl
            pointer-events-none
          "
        />

        <div
          className="
            relative
            p-6 sm:p-8
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-6
          "
        >

          <div>

            <div className="flex flex-wrap items-center gap-3 mb-3">

              <div
                className="
                  w-11 h-11
                  rounded-2xl
                  bg-blue-500/15
                  border border-blue-400/20
                  flex items-center justify-center
                "
              >
                <SettingsIcon className="w-5 h-5 text-blue-300" />
              </div>

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  px-3 py-1.5
                  rounded-full
                  bg-white/10
                  border border-white/10
                  text-xs
                  font-semibold
                  text-white/70
                "
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                SYSTEM CONFIGURATION
              </span>

            </div>

            <h1
              className="
                text-3xl
                sm:text-4xl
                font-bold
                tracking-tight
              "
            >
              Settings
            </h1>

            <p
              className="
                text-white/55
                mt-2
                max-w-2xl
                text-sm sm:text-base
              "
            >
              Customize your store preferences, inventory
              alerts and RetailIQ configuration.
            </p>

          </div>

          {/* Configuration status */}

          <div
            className="
              min-w-[200px]
              rounded-2xl
              bg-white/5
              border border-white/10
              backdrop-blur-xl
              p-4
              shadow-lg
            "
          >

            <div className="flex items-center gap-2 mb-2">

              <div
                className="
                  w-8 h-8
                  rounded-lg
                  bg-emerald-500/10
                  border border-emerald-400/10
                  flex items-center justify-center
                "
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>

              <p className="text-xs text-white/40">
                Configuration
              </p>

            </div>

            <p className="text-lg font-bold text-white">
              {saved ? "Saved" : "Ready"}
            </p>

            <p className="text-xs text-emerald-300/70 mt-1">
              {saved
                ? "Changes applied successfully"
                : "Your settings are ready to edit"}
            </p>

          </div>

        </div>
      </div>

      {/* =========================================
          SUCCESS MESSAGE
      ========================================= */}

      {saved && (
        <div
          className="
            mb-6
            rounded-2xl
            px-4 py-4
            flex items-center gap-3
            bg-emerald-500/10
            border border-emerald-400/15
            backdrop-blur-xl
            shadow-lg shadow-emerald-500/5
            animate-[fadeIn_0.3s_ease-out]
          "
        >

          <div
            className="
              w-10 h-10
              shrink-0
              rounded-xl
              bg-emerald-500/10
              border border-emerald-400/15
              flex items-center justify-center
            "
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>

          <div>
            <p className="font-semibold text-emerald-200">
              Settings saved successfully.
            </p>

            <p className="text-xs text-emerald-300/60 mt-0.5">
              Your changes have been applied.
            </p>
          </div>

        </div>
      )}

      <form onSubmit={handleSave}>

        {/* =========================================
            STORE PROFILE
        ========================================= */}

        <section
          className="
            relative
            overflow-hidden
            bg-slate-950/55
            backdrop-blur-2xl
            rounded-3xl
            border border-white/10
            shadow-xl shadow-black/15
            p-5 sm:p-6
            mb-6
          "
        >

          <div
            className="
              absolute
              -top-20
              -right-20
              w-48 h-48
              rounded-full
              bg-blue-500/10
              blur-3xl
              pointer-events-none
            "
          />

          <div className="relative flex items-center gap-3 mb-6">

            <SectionIcon
              icon={<Store className="w-5 h-5" />}
              style="bg-blue-500/10 border-blue-400/10 text-blue-300"
            />

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Store Profile
              </h2>

              <p className="text-sm text-white/40 mt-1">
                Basic information about your store.
              </p>
            </div>

          </div>

          <div
            className="
              relative
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            "
          >

            <FormInput
              label="Store Name"
              name="storeName"
              value={storeSettings.storeName}
              onChange={handleChange}
              placeholder="Enter store name"
              icon={<Store className="w-4 h-4" />}
            />

            <FormInput
              label="Owner Name"
              name="ownerName"
              value={storeSettings.ownerName}
              onChange={handleChange}
              placeholder="Enter owner's name"
              icon={<User className="w-4 h-4" />}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              value={storeSettings.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              icon={<Phone className="w-4 h-4" />}
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={storeSettings.email}
              onChange={handleChange}
              placeholder="store@example.com"
              icon={<Mail className="w-4 h-4" />}
            />

            {/* Currency */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-white/80
                  mb-2
                "
              >
                Currency
              </label>

              <div className="relative">

                <CircleDollarSign
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-white/30
                    pointer-events-none
                  "
                />

                <select
                  name="currency"
                  value={storeSettings.currency}
                  onChange={handleChange}
                  className="
                    w-full
                    border border-white/10
                    rounded-xl
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-white
                    bg-white/5
                    outline-none
                    focus:border-blue-400/40
                    focus:ring-2
                    focus:ring-blue-500/10
                    transition-all
                    cursor-pointer
                  "
                >
                  <option className="bg-slate-900">
                    INR (₹)
                  </option>

                  <option className="bg-slate-900">
                    USD ($)
                  </option>

                  <option className="bg-slate-900">
                    EUR (€)
                  </option>

                  <option className="bg-slate-900">
                    GBP (£)
                  </option>
                </select>

              </div>

            </div>

          </div>

        </section>

        {/* =========================================
            INVENTORY SETTINGS
        ========================================= */}

        <section
          className="
            relative
            overflow-hidden
            bg-slate-950/55
            backdrop-blur-2xl
            rounded-3xl
            border border-white/10
            shadow-xl shadow-black/15
            p-5 sm:p-6
            mb-6
          "
        >

          <div
            className="
              absolute
              -bottom-24
              -right-10
              w-60 h-60
              rounded-full
              bg-amber-500/10
              blur-3xl
              pointer-events-none
            "
          />

          <div className="relative flex items-center gap-3 mb-6">

            <SectionIcon
              icon={<Package className="w-5 h-5" />}
              style="bg-amber-500/10 border-amber-400/10 text-amber-300"
            />

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Inventory Preferences
              </h2>

              <p className="text-sm text-white/40 mt-1">
                Configure how RetailIQ handles stock alerts.
              </p>
            </div>

          </div>

          <div
            className="
              relative
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            "
          >

            {/* Threshold */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-white/80
                  mb-2
                "
              >
                Low Stock Threshold
              </label>

              <div className="relative">

                <Boxes
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-white/30
                  "
                />

                <input
                  type="number"
                  name="lowStockThreshold"
                  min="1"
                  value={storeSettings.lowStockThreshold}
                  onChange={handleChange}
                  className="
                    w-full
                    border border-white/10
                    rounded-xl
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-white
                    bg-white/5
                    outline-none
                    focus:border-blue-400/40
                    focus:ring-2
                    focus:ring-blue-500/10
                    transition-all
                  "
                />

              </div>

              <p className="text-xs text-white/30 mt-2">
                Products at or below this quantity will be
                considered low stock.
              </p>

            </div>

            {/* Alerts */}

            <div
              className="
                rounded-2xl
                border border-white/10
                p-4
                bg-white/[0.03]
                flex
                items-center
                justify-between
                gap-4
                hover:bg-white/[0.05]
                transition-all
              "
            >

              <div>

                <div className="flex items-center gap-2">

                  <Bell className="w-4 h-4 text-amber-300" />

                  <p className="font-semibold text-white/85">
                    Low Stock Alerts
                  </p>

                </div>

                <p className="text-xs text-white/35 mt-1">
                  Show alerts when inventory needs attention.
                </p>

              </div>

              <label
                className="
                  relative
                  inline-flex
                  items-center
                  cursor-pointer
                  shrink-0
                "
              >

                <input
                  type="checkbox"
                  name="lowStockAlerts"
                  checked={storeSettings.lowStockAlerts}
                  onChange={handleChange}
                  className="sr-only peer"
                />

                <div
                  className="
                    w-12 h-6
                    bg-white/10
                    border border-white/10
                    rounded-full
                    peer
                    peer-checked:bg-blue-500
                    peer-checked:border-blue-400/30
                    transition-all
                  "
                />

                <div
                  className="
                    absolute
                    left-1
                    top-1
                    w-4 h-4
                    bg-white
                    rounded-full
                    shadow-sm
                    transition-all
                    peer-checked:translate-x-6
                  "
                />

              </label>

            </div>

          </div>

        </section>

        {/* =========================================
            SYSTEM INFORMATION
        ========================================= */}

        <section
          className="
            relative
            overflow-hidden
            bg-slate-950/55
            backdrop-blur-2xl
            rounded-3xl
            border border-white/10
            shadow-xl shadow-black/15
            p-5 sm:p-6
            mb-6
          "
        >

          <div
            className="
              absolute
              -top-24
              left-1/2
              w-60 h-60
              rounded-full
              bg-violet-500/10
              blur-3xl
              pointer-events-none
            "
          />

          <div className="relative flex items-center gap-3 mb-6">

            <SectionIcon
              icon={<Info className="w-5 h-5" />}
              style="bg-violet-500/10 border-violet-400/10 text-violet-300"
            />

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                System Information
              </h2>

              <p className="text-sm text-white/40 mt-1">
                Current RetailIQ application information.
              </p>
            </div>

          </div>

          <div
            className="
              relative
              grid
              grid-cols-2
              md:grid-cols-4
              gap-3
            "
          >

            <InfoBox
              title="Platform"
              value="RetailIQ"
              icon={<Sparkles className="w-4 h-4" />}
            />

            <InfoBox
              title="Version"
              value="1.0.0"
              icon={<SlidersHorizontal className="w-4 h-4" />}
            />

            <InfoBox
              title="Currency"
              value={storeSettings.currency}
              icon={<CircleDollarSign className="w-4 h-4" />}
            />

            <InfoBox
              title="Alerts"
              value={
                storeSettings.lowStockAlerts
                  ? "Enabled"
                  : "Disabled"
              }
              icon={<Bell className="w-4 h-4" />}
            />

          </div>

        </section>

        {/* =========================================
            SAVE BUTTON
        ========================================= */}

        <div
          className="
            flex
            flex-col-reverse
            sm:flex-row
            justify-end
            gap-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-white/30
              mr-auto
            "
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300/70" />
            Your configuration is stored locally.
          </div>

          <button
            type="submit"
            className="
              w-full
              sm:w-auto
              inline-flex
              items-center
              justify-center
              gap-2
              bg-gradient-to-r
              from-blue-500
              to-indigo-500
              text-white
              px-6 py-3.5
              rounded-2xl
              font-semibold
              shadow-lg
              shadow-blue-500/20
              border border-blue-300/10
              hover:from-blue-400
              hover:to-indigo-400
              hover:-translate-y-1
              hover:shadow-xl
              hover:shadow-blue-500/30
              transition-all
              active:scale-95
            "
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>

        </div>

      </form>

    </div>
  );
}

// =========================================
// SECTION ICON
// =========================================

function SectionIcon({ icon, style }) {
  return (
    <div
      className={`
        w-11 h-11
        shrink-0
        rounded-xl
        border
        flex
        items-center
        justify-center
        ${style}
      `}
    >
      {icon}
    </div>
  );
}

// =========================================
// FORM INPUT
// =========================================

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
}) {
  return (
    <div>

      <label
        className="
          block
          text-sm
          font-semibold
          text-white/80
          mb-2
        "
      >
        {label}
      </label>

      <div className="relative">

        <div
          className="
            absolute
            left-3.5
            top-1/2
            -translate-y-1/2
            text-white/30
            pointer-events-none
          "
        >
          {icon}
        </div>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            border border-white/10
            rounded-xl
            py-3
            pl-10
            pr-4
            text-sm
            text-white
            bg-white/5
            placeholder:text-white/25
            outline-none
            focus:border-blue-400/40
            focus:ring-2
            focus:ring-blue-500/10
            transition-all
          "
        />

      </div>

    </div>
  );
}

// =========================================
// INFORMATION BOX
// =========================================

function InfoBox({ title, value, icon }) {
  return (
    <div
      className="
        group
        bg-white/[0.035]
        border border-white/10
        rounded-2xl
        p-4
        hover:bg-white/[0.06]
        hover:border-white/15
        transition-all
      "
    >

      <div className="
        flex
        items-center
        justify-between
        gap-2
      ">

        <p className="text-xs text-white/35">
          {title}
        </p>

        <span className="
          text-white/30
          group-hover:text-blue-300
          transition-colors
        ">
          {icon}
        </span>

      </div>

      <p className="
        font-bold
        text-white/85
        mt-2
        text-sm
        break-words
      ">
        {value}
      </p>

    </div>
  );
}

export default Settings;