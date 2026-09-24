import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Eye,
  Filter,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Laptop",
    category: "Electronics",
    price: 55000,
    stock: 12,
    supplier: "Tech World",
  },
  {
    id: 2,
    name: "Wireless Mouse",
    category: "Accessories",
    price: 799,
    stock: 5,
    supplier: "Digital Hub",
  },
  {
    id: 3,
    name: "Keyboard",
    category: "Accessories",
    price: 1299,
    stock: 0,
    supplier: "Digital Hub",
  },
  {
    id: 4,
    name: "Headphones",
    category: "Electronics",
    price: 2499,
    stock: 24,
    supplier: "Tech World",
  },
];

const FALLBACK_SALES = [
  {
    id: "S001",
    productId: 1,
    product: "Laptop",
    quantity: 1,
    price: 55000,
    total: 55000,
    payment: "UPI",
    date: "11 Sep 2026",
  },
  {
    id: "S002",
    productId: 2,
    product: "Wireless Mouse",
    quantity: 2,
    price: 799,
    total: 1598,
    payment: "Cash",
    date: "10 Sep 2026",
  },
  {
    id: "S003",
    productId: 4,
    product: "Headphones",
    quantity: 1,
    price: 2499,
    total: 2499,
    payment: "Card",
    date: "09 Sep 2026",
  },
  {
    id: "S004",
    productId: 3,
    product: "Keyboard",
    quantity: 2,
    price: 1299,
    total: 2598,
    payment: "UPI",
    date: "08 Sep 2026",
  },
];

const severityStyles = {
  Critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    darkBadge: "bg-red-500/10 text-red-300 border-red-400/20",
    dot: "bg-red-500",
    icon: "text-red-600",
    glow: "shadow-red-500/10",
  },
  High: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    darkBadge: "bg-orange-500/10 text-orange-300 border-orange-400/20",
    dot: "bg-orange-500",
    icon: "text-orange-600",
    glow: "shadow-orange-500/10",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    darkBadge: "bg-amber-500/10 text-amber-300 border-amber-400/20",
    dot: "bg-amber-500",
    icon: "text-amber-600",
    glow: "shadow-amber-500/10",
  },
  Low: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    darkBadge: "bg-blue-500/10 text-blue-300 border-blue-400/20",
    dot: "bg-blue-500",
    icon: "text-blue-600",
    glow: "shadow-blue-500/10",
  },
};

const typeIcons = {
  "Sales Spike": TrendingUp,
  "Sales Drop": TrendingDown,
  "High Value": BarChart3,
  "Stock Risk": Package,
  "Inventory Mismatch": RefreshCw,
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function createAnomalies(products, sales) {
  const safeProducts = products.length ? products : FALLBACK_PRODUCTS;
  const safeSales = sales.length ? sales : FALLBACK_SALES;

  const totalRevenue = safeSales.reduce(
    (sum, sale) =>
      sum +
      Number(
        sale.total ?? ((sale.price ?? 0) * (sale.quantity ?? 0))
      ),
    0
  );

  const averageTransaction =
    safeSales.length > 0 ? totalRevenue / safeSales.length : 0;

  const averageQuantity =
    safeSales.length > 0
      ? safeSales.reduce(
          (sum, sale) => sum + Number(sale.quantity || 0),
          0
        ) / safeSales.length
      : 0;

  const generated = [];

  // 1. High-value transactions
  safeSales.forEach((sale, index) => {
    const total = Number(
      sale.total ?? ((sale.price ?? 0) * (sale.quantity ?? 0))
    );

    if (total > Math.max(averageTransaction * 1.8, 10000)) {
      generated.push({
        id: `AN-HV-${index + 1}`,
        type: "High Value",
        severity:
          total > averageTransaction * 3 ? "Critical" : "High",
        title: "Unusually high transaction value",
        product: sale.product || "Multiple products",
        date: sale.date || "Recent",
        score: Math.min(
          99,
          Math.round(
            (total / Math.max(averageTransaction, 1)) * 30
          )
        ),
        value: money(total),
        description: `${
          sale.id || "This transaction"
        } is significantly above the average transaction value.`,
        recommendation:
          "Review the invoice and payment details to confirm the transaction.",
        status: "Open",
      });
    }
  });

  // 2. Quantity spikes
  safeSales.forEach((sale, index) => {
    const quantity = Number(sale.quantity || 0);

    if (
      quantity >=
      Math.max(3, Math.ceil(averageQuantity * 2.5))
    ) {
      generated.push({
        id: `AN-SP-${index + 1}`,
        type: "Sales Spike",
        severity:
          quantity >= Math.ceil(averageQuantity * 4)
            ? "Critical"
            : "High",
        title: "Unusual quantity spike detected",
        product: sale.product || "Unknown product",
        date: sale.date || "Recent",
        score: Math.min(
          98,
          Math.round(
            (quantity / Math.max(averageQuantity, 1)) * 28
          )
        ),
        value: `${quantity} units`,
        description: `This transaction sold ${quantity} units, which is well above the current average quantity per transaction.`,
        recommendation:
          "Check whether this is a genuine bulk order before using it for demand planning.",
        status: "Open",
      });
    }
  });

  // 3. Inventory mismatch
  safeProducts.forEach((product, index) => {
    const matchingSales = safeSales.filter(
      (sale) =>
        String(
          sale.productId ?? sale.product_id ?? ""
        ) === String(product.id) ||
        String(sale.product ?? "").toLowerCase() ===
          String(product.name ?? "").toLowerCase()
    );

    if (
      Number(product.stock) === 0 &&
      matchingSales.length > 0
    ) {
      generated.push({
        id: `AN-IM-${index + 1}`,
        type: "Inventory Mismatch",
        severity: "Critical",
        title: "Product sold while stock is zero",
        product: product.name,
        date: matchingSales[0]?.date || "Recent",
        score: 96,
        value: "0 units in stock",
        description:
          "A recent sale exists for this product, but the current inventory shows zero available units.",
        recommendation:
          "Verify stock movement and update the inventory ledger before the next sale.",
        status: "Open",
      });
    }
  });

  // 4. Stock risk
  safeProducts.forEach((product, index) => {
    const stock = Number(product.stock || 0);

    if (stock > 0 && stock <= 5) {
      generated.push({
        id: `AN-SR-${index + 1}`,
        type: "Stock Risk",
        severity: stock <= 2 ? "High" : "Medium",
        title: "Inventory level is unusually low",
        product: product.name,
        date: "Current",
        score: stock <= 2 ? 88 : 70,
        value: `${stock} units left`,
        description:
          "Current inventory is low enough to create a potential stock-out risk if demand continues.",
        recommendation:
          "Review the Smart Restock recommendation and supplier lead time.",
        status: "Open",
      });
    }
  });

  // 5. Sales drop / inactivity
  safeProducts.forEach((product, index) => {
    const matchingSales = safeSales.filter(
      (sale) =>
        String(
          sale.productId ?? sale.product_id ?? ""
        ) === String(product.id) ||
        String(sale.product ?? "").toLowerCase() ===
          String(product.name ?? "").toLowerCase()
    );

    if (
      matchingSales.length === 0 &&
      Number(product.stock || 0) > 10
    ) {
      generated.push({
        id: `AN-SD-${index + 1}`,
        type: "Sales Drop",
        severity: "Medium",
        title: "No recent sales activity",
        product: product.name,
        date: "Recent period",
        score: 62,
        value: `${product.stock} units in stock`,
        description:
          "There are currently no recorded sales for this product in the demo sales history.",
        recommendation:
          "Check product visibility, pricing and recent customer demand before replenishing.",
        status: "Monitoring",
      });
    }
  });

  if (!generated.length) {
    generated.push({
      id: "AN-NONE",
      type: "Stock Risk",
      severity: "Low",
      title: "No significant anomaly detected",
      product: "All products",
      date: "Current",
      score: 18,
      value: "Normal",
      description:
        "The current demo data does not contain a strong anomaly signal.",
      recommendation:
        "Continue monitoring sales and inventory as new transactions arrive.",
      status: "Monitoring",
    });
  }

  return generated
    .sort((a, b) => {
      const order = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };

      return (
        (order[b.severity] || 0) -
        (order[a.severity] || 0)
      );
    })
    .map((item, index) => ({
      ...item,
      displayIndex: index + 1,
    }));
}

export default function Anomalies({
  products = [],
  sales = [],
  onReviewAnomaly,
}) {
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewed, setReviewed] = useState({});
  const [selectedAnomaly, setSelectedAnomaly] =
    useState(null);

  const anomalies = useMemo(
    () => createAnomalies(products, sales),
    [products, sales]
  );

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((anomaly) => {
      const matchesSeverity =
        severityFilter === "All" ||
        anomaly.severity === severityFilter;

      const matchesType =
        typeFilter === "All" ||
        anomaly.type === typeFilter;

      const currentStatus = reviewed[anomaly.id]
        ? "Reviewed"
        : anomaly.status;

      const matchesStatus =
        statusFilter === "All" ||
        currentStatus === statusFilter;

      const query = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !query ||
        anomaly.title.toLowerCase().includes(query) ||
        anomaly.product.toLowerCase().includes(query) ||
        anomaly.type.toLowerCase().includes(query);

      return (
        matchesSeverity &&
        matchesType &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    anomalies,
    severityFilter,
    typeFilter,
    statusFilter,
    searchTerm,
    reviewed,
  ]);

  const stats = useMemo(() => {
    const critical = anomalies.filter(
      (a) => a.severity === "Critical"
    ).length;

    const high = anomalies.filter(
      (a) => a.severity === "High"
    ).length;

    const medium = anomalies.filter(
      (a) => a.severity === "Medium"
    ).length;

    const reviewedCount =
      Object.values(reviewed).filter(Boolean).length;

    const revenueAtRisk = anomalies
      .filter(
        (a) =>
          a.severity === "Critical" ||
          a.severity === "High"
      )
      .reduce((sum, anomaly) => {
        const numeric = Number(
          String(anomaly.value).replace(/[^\d.]/g, "")
        );

        return (
          sum +
          (Number.isFinite(numeric) ? numeric : 0)
        );
      }, 0);

    return {
      total: anomalies.length,
      critical,
      high,
      medium,
      reviewed: reviewedCount,
      revenueAtRisk,
    };
  }, [anomalies, reviewed]);

  const markReviewed = (anomaly) => {
    setReviewed((prev) => ({
      ...prev,
      [anomaly.id]: !prev[anomaly.id],
    }));

    if (onReviewAnomaly) {
      onReviewAnomaly(anomaly);
    }
  };

  const clearFilters = () => {
    setSeverityFilter("All");
    setTypeFilter("All");
    setStatusFilter("All");
    setSearchTerm("");
  };

  const typeOptions = [
    ...new Set(anomalies.map((a) => a.type)),
  ];

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            HERO
        ====================================================== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            border border-white/10
            bg-slate-950/75
            backdrop-blur-2xl
            p-6 sm:p-8
            shadow-2xl shadow-black/20
            animate-[fadeIn_0.6s_ease-out]
          "
        >
          {/* Aurora glow */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div
                className="
                  mb-4 inline-flex items-center gap-2
                  rounded-full
                  border border-white/10
                  bg-white/5
                  px-3 py-1.5
                  text-xs font-semibold
                  text-slate-200
                  backdrop-blur-xl
                "
              >
                <ShieldAlert
                  size={14}
                  className="text-red-400"
                />

                RetailIQ Intelligence

                <span
                  className="
                    rounded-full
                    border border-amber-300/20
                    bg-amber-400/10
                    px-2 py-0.5
                    text-[10px]
                    font-bold
                    tracking-wide
                    text-amber-300
                  "
                >
                  DEMO
                </span>
              </div>

              <h1
                className="
                  text-3xl font-bold tracking-tight
                  text-white
                  sm:text-4xl
                "
              >
                Anomaly Detection
              </h1>

              <p
                className="
                  mt-3 max-w-2xl
                  text-sm leading-6
                  text-slate-300
                  sm:text-base
                "
              >
                Spot unusual sales, suspicious transaction
                values and inventory mismatches before they
                turn into expensive surprises.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className="
                    inline-flex items-center gap-2
                    rounded-xl
                    border border-red-400/20
                    bg-red-500/10
                    px-3 py-2
                    text-xs font-semibold
                    text-red-200
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  Live signal scan
                </span>

                <span
                  className="
                    inline-flex items-center gap-2
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    px-3 py-2
                    text-xs font-semibold
                    text-slate-300
                  "
                >
                  <Sparkles size={14} />
                  Rule-based intelligence
                </span>
              </div>
            </div>

            {/* Signal counter */}
            <div
              className="
                group relative shrink-0
                overflow-hidden
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                backdrop-blur-xl
                transition-all duration-300
                hover:-translate-y-1
                hover:bg-white/10
              "
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />

              <div className="relative flex items-center gap-4">
                <div
                  className="
                    rounded-2xl
                    border border-red-400/20
                    bg-red-500/10
                    p-3
                    transition-transform duration-300
                    group-hover:scale-110
                  "
                >
                  <AlertTriangle
                    className="text-red-300"
                    size={26}
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Signals detected
                  </p>

                  <p className="mt-1 text-3xl font-bold text-white">
                    {stats.total}
                  </p>

                  <p className="mt-1 text-xs text-red-300">
                    {stats.critical + stats.high} high priority
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}
        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            xl:grid-cols-5
          "
        >
          <StatCard
            title="Total Anomalies"
            value={stats.total}
            icon={<ShieldAlert size={21} />}
            color="blue"
          />

          <StatCard
            title="Critical"
            value={stats.critical}
            icon={<CircleAlert size={21} />}
            color="red"
          />

          <StatCard
            title="High Priority"
            value={stats.high}
            icon={<AlertTriangle size={21} />}
            color="orange"
          />

          <StatCard
            title="Medium"
            value={stats.medium}
            icon={<Eye size={21} />}
            color="yellow"
          />

          <StatCard
            title="Reviewed"
            value={`${stats.reviewed}/${stats.total}`}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />
        </div>

        {/* =====================================================
            INTELLIGENCE SECTION
        ====================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main intelligence */}
          <div
            className="
              group relative overflow-hidden
              rounded-3xl
              border border-white/30
              bg-white/90
              p-5
              shadow-xl shadow-black/10
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-2xl
              lg:col-span-2
            "
          >
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-500/5 blur-3xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex gap-3">
                <div
                  className="
                    flex h-12 w-12 shrink-0
                    items-center justify-center
                    rounded-2xl
                    bg-red-50
                    text-red-600
                    transition-transform duration-300
                    group-hover:scale-110
                  "
                >
                  <Sparkles size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    RetailIQ Investigation
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    The detection engine has identified{" "}
                    <span className="font-bold text-slate-800">
                      {stats.critical + stats.high}
                    </span>{" "}
                    high-priority signals that deserve
                    attention.
                  </p>
                </div>
              </div>

              <span
                className="
                  w-fit rounded-full
                  border border-amber-200
                  bg-amber-50
                  px-3 py-1.5
                  text-xs font-bold
                  text-amber-700
                "
              >
                Rule-based preview
              </span>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-3">

              <MiniInsight
                label="Highest severity"
                value={
                  stats.critical > 0
                    ? "Critical"
                    : "None"
                }
                valueClass={
                  stats.critical > 0
                    ? "text-red-600"
                    : "text-slate-900"
                }
              />

              <MiniInsight
                label="Signals to review"
                value={
                  stats.total - stats.reviewed
                }
              />

              <MiniInsight
                label="Products monitored"
                value={(
                  products.length ||
                  FALLBACK_PRODUCTS.length
                ).toLocaleString("en-IN")}
              />
            </div>
          </div>

          {/* Coverage card */}
          <div
            className="
              relative overflow-hidden
              rounded-3xl
              border border-white/10
              bg-slate-950/85
              p-5
              text-white
              shadow-2xl shadow-black/20
              backdrop-blur-2xl
            "
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  p-3
                "
              >
                <BarChart3 size={21} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Detection coverage
                </p>

                <p className="text-xl font-bold">
                  5 signal types
                </p>
              </div>
            </div>

            <div className="relative mt-5 space-y-2.5">
              {[
                ["Sales spikes", "Quantity changes"],
                ["Sales drops", "Demand inactivity"],
                ["High value", "Transaction size"],
                ["Stock risk", "Low inventory"],
                ["Mismatch", "Stock vs sales"],
              ].map(([label, desc]) => (
                <div
                  key={label}
                  className="
                    flex items-center justify-between
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    px-3 py-2.5
                    transition-all duration-200
                    hover:bg-white/10
                  "
                >
                  <span className="text-sm font-medium">
                    {label}
                  </span>

                  <span className="text-xs text-slate-500">
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================
            FILTER BAR
        ====================================================== */}
        <div
          className="
            rounded-3xl
            border border-white/30
            bg-white/85
            p-4
            shadow-xl shadow-black/10
            backdrop-blur-xl
            sm:p-5
          "
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            <div className="flex items-center gap-3">
              <div
                className="
                  rounded-xl
                  bg-slate-900
                  p-2.5
                  text-white
                  shadow-lg
                "
              >
                <Filter size={18} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Anomaly Feed
                </h2>

                <p className="text-xs text-slate-500">
                  {filteredAnomalies.length} matching signal
                  {filteredAnomalies.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">

              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search
                  size={16}
                  className="
                    absolute left-3 top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  placeholder="Search product or anomaly..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    bg-white
                    py-2.5 pl-9 pr-3
                    text-sm text-slate-800
                    outline-none
                    transition-all
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              {/* Severity */}
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value)
                }
                className="
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-3 py-2.5
                  text-sm text-slate-700
                  outline-none
                  transition-all
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              >
                <option value="All">
                  All severity
                </option>
                <option value="Critical">
                  Critical
                </option>
                <option value="High">
                  High
                </option>
                <option value="Medium">
                  Medium
                </option>
                <option value="Low">
                  Low
                </option>
              </select>

              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value)
                }
                className="
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-3 py-2.5
                  text-sm text-slate-700
                  outline-none
                  transition-all
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              >
                <option value="All">
                  All types
                </option>

                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-3 py-2.5
                  text-sm text-slate-700
                  outline-none
                  transition-all
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              >
                <option value="All">
                  All status
                </option>
                <option value="Open">
                  Open
                </option>
                <option value="Monitoring">
                  Monitoring
                </option>
                <option value="Reviewed">
                  Reviewed
                </option>
              </select>

              {/* Clear */}
              <button
                type="button"
                onClick={clearFilters}
                className="
                  inline-flex items-center
                  justify-center gap-2
                  rounded-xl
                  border border-slate-200
                  bg-white
                  px-4 py-2.5
                  text-sm font-semibold
                  text-slate-600
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-slate-50
                  hover:text-slate-900
                  hover:shadow-md
                "
              >
                <X size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            DESKTOP TABLE
        ====================================================== */}
        <div
          className="
            hidden
            overflow-hidden
            rounded-3xl
            border border-white/30
            bg-white/90
            shadow-xl shadow-black/10
            backdrop-blur-xl
            lg:block
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">

              <thead
                className="
                  border-b border-slate-200
                  bg-slate-50/90
                "
              >
                <tr
                  className="
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                >
                  <th className="px-5 py-4">
                    Anomaly
                  </th>

                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    Severity
                  </th>

                  <th className="px-5 py-4">
                    Score
                  </th>

                  <th className="px-5 py-4">
                    Detected
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAnomalies.map((anomaly) => {
                  const Icon =
                    typeIcons[anomaly.type] ||
                    AlertTriangle;

                  const severity =
                    severityStyles[anomaly.severity];

                  const isReviewed =
                    Boolean(reviewed[anomaly.id]);

                  return (
                    <tr
                      key={anomaly.id}
                      className="
                        group
                        transition-all duration-200
                        hover:bg-blue-50/40
                      "
                    >
                      {/* Anomaly */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">

                          <div
                            className={`
                              mt-0.5
                              rounded-xl
                              bg-slate-100
                              p-2.5
                              transition-transform duration-300
                              group-hover:scale-110
                              ${severity.icon}
                            `}
                          >
                            <Icon size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {anomaly.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {anomaly.type} ·{" "}
                              {anomaly.value}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {anomaly.product}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="px-5 py-4">
                        <span
                          className={`
                            inline-flex items-center gap-2
                            rounded-full
                            border
                            px-2.5 py-1
                            text-xs font-bold
                            ${severity.badge}
                          `}
                        >
                          <span
                            className={`
                              h-1.5 w-1.5
                              rounded-full
                              ${severity.dot}
                            `}
                          />

                          {anomaly.severity}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <div className="w-24">

                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-slate-500">
                              Risk
                            </span>

                            <span className="font-bold text-slate-700">
                              {anomaly.score}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`
                                h-full rounded-full
                                ${severity.dot}
                              `}
                              style={{
                                width: `${anomaly.score}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {anomaly.date}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`
                            rounded-full
                            px-2.5 py-1
                            text-xs font-semibold
                            ${
                              isReviewed
                                ? "bg-emerald-100 text-emerald-700"
                                : anomaly.status ===
                                  "Monitoring"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }
                          `}
                        >
                          {isReviewed
                            ? "Reviewed"
                            : anomaly.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAnomaly(
                              anomaly
                            )
                          }
                          className="
                            mr-2
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3 py-2
                            text-xs font-semibold
                            text-slate-600
                            transition-all duration-200
                            hover:-translate-y-0.5
                            hover:bg-slate-50
                            hover:shadow-sm
                          "
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            markReviewed(anomaly)
                          }
                          className={`
                            rounded-xl
                            px-3 py-2
                            text-xs font-semibold
                            transition-all duration-200
                            hover:-translate-y-0.5
                            ${
                              isReviewed
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-slate-950 text-white hover:bg-slate-800 hover:shadow-lg"
                            }
                          `}
                        >
                          {isReviewed
                            ? "Undo"
                            : "Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filteredAnomalies.length && (
            <EmptyState onClear={clearFilters} />
          )}
        </div>

        {/* =====================================================
            MOBILE CARDS
        ====================================================== */}
        <div className="space-y-4 lg:hidden">
          {filteredAnomalies.map((anomaly) => {
            const Icon =
              typeIcons[anomaly.type] ||
              AlertTriangle;

            const severity =
              severityStyles[anomaly.severity];

            const isReviewed =
              Boolean(reviewed[anomaly.id]);

            return (
              <div
                key={anomaly.id}
                className="
                  group
                  rounded-3xl
                  border border-white/30
                  bg-white/90
                  p-4
                  shadow-xl shadow-black/10
                  backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                "
              >
                <div className="flex items-start justify-between gap-3">

                  <div className="flex gap-3">
                    <div
                      className={`
                        rounded-xl
                        bg-slate-100
                        p-2.5
                        ${severity.icon}
                        transition-transform duration-300
                        group-hover:scale-110
                      `}
                    >
                      <Icon size={19} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {anomaly.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {anomaly.product}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`
                      shrink-0
                      rounded-full
                      border
                      px-2.5 py-1
                      text-[11px]
                      font-bold
                      ${severity.badge}
                    `}
                  >
                    {anomaly.severity}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {anomaly.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">
                      Risk score
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {anomaly.score}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">
                      Detected
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {anomaly.date}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAnomaly(anomaly)
                    }
                    className="
                      flex-1
                      rounded-xl
                      border border-slate-200
                      bg-white
                      px-3 py-2.5
                      text-sm font-semibold
                      text-slate-700
                      transition-all
                      hover:bg-slate-50
                    "
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      markReviewed(anomaly)
                    }
                    className={`
                      flex-1
                      rounded-xl
                      px-3 py-2.5
                      text-sm font-semibold
                      transition-all
                      ${
                        isReviewed
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                      }
                    `}
                  >
                    {isReviewed
                      ? "Reviewed"
                      : "Mark reviewed"}
                  </button>
                </div>
              </div>
            );
          })}

          {!filteredAnomalies.length && (
            <EmptyState onClear={clearFilters} />
          )}
        </div>

        {/* =====================================================
            FOOTER NOTE
        ====================================================== */}
        <div
          className="
            rounded-2xl
            border border-blue-200/60
            bg-blue-50/90
            p-4
            shadow-lg shadow-blue-900/5
            backdrop-blur-xl
          "
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              className="mt-0.5 shrink-0 text-blue-600"
              size={18}
            />

            <p className="text-sm leading-6 text-blue-800">
              <strong>Frontend demo mode:</strong>{" "}
              anomaly signals are generated from the
              available mock sales and inventory data.
              Your backend/ML teammate can later replace
              this rule-based layer with the actual
              anomaly-detection model and live transaction
              stream.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          DETAILS MODAL
      ====================================================== */}
      {selectedAnomaly && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-slate-950/70
            p-4
            backdrop-blur-md
            animate-[fadeIn_0.2s_ease-out]
          "
          onClick={() =>
            setSelectedAnomaly(null)
          }
        >
          <div
            className="
              w-full max-w-2xl
              overflow-hidden
              rounded-3xl
              border border-white/10
              bg-white
              shadow-2xl
              animate-[modalPop_0.25s_ease-out]
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}
            <div
              className="
                relative overflow-hidden
                bg-slate-950
                p-6
                text-white
              "
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">

                <div className="flex gap-3">

                  <div
                    className="
                      rounded-2xl
                      border border-red-400/20
                      bg-red-500/10
                      p-3
                    "
                  >
                    <ShieldAlert
                      className="text-red-300"
                      size={22}
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-xs font-semibold
                        uppercase tracking-wider
                        text-slate-400
                      "
                    >
                      {selectedAnomaly.type}
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {selectedAnomaly.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAnomaly(null)
                  }
                  className="
                    rounded-xl
                    p-2
                    text-slate-400
                    transition-all
                    hover:bg-white/10
                    hover:text-white
                    hover:rotate-90
                  "
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className={`
                    rounded-full
                    border
                    px-3 py-1.5
                    text-xs font-bold
                    ${
                      severityStyles[
                        selectedAnomaly.severity
                      ].badge
                    }
                  `}
                >
                  {selectedAnomaly.severity}
                  {" "}severity
                </span>

                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-3 py-1.5
                    text-xs font-semibold
                    text-slate-600
                  "
                >
                  Risk score:{" "}
                  {selectedAnomaly.score}%
                </span>

                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-3 py-1.5
                    text-xs font-semibold
                    text-slate-600
                  "
                >
                  {selectedAnomaly.date}
                </span>
              </div>

              {/* Product + value */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div
                  className="
                    rounded-2xl
                    border border-slate-100
                    bg-slate-50
                    p-4
                  "
                >
                  <p className="text-xs text-slate-500">
                    Product
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedAnomaly.product}
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    border border-slate-100
                    bg-slate-50
                    p-4
                  "
                >
                  <p className="text-xs text-slate-500">
                    Observed value
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedAnomaly.value}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-slate-900">
                  What happened?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedAnomaly.description}
                </p>
              </div>

              {/* Recommendation */}
              <div
                className="
                  rounded-2xl
                  border border-amber-200
                  bg-gradient-to-br
                  from-amber-50
                  to-orange-50
                  p-4
                "
              >
                <div className="flex gap-3">

                  <div
                    className="
                      shrink-0
                      rounded-xl
                      bg-amber-100
                      p-2
                    "
                  >
                    <Sparkles
                      className="text-amber-600"
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="font-bold text-amber-900">
                      Recommended action
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      {selectedAnomaly.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review button */}
              <button
                type="button"
                onClick={() => {
                  markReviewed(
                    selectedAnomaly
                  );
                  setSelectedAnomaly(null);
                }}
                className="
                  w-full
                  rounded-xl
                  bg-slate-950
                  px-4 py-3
                  text-sm font-bold
                  text-white
                  shadow-lg
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-slate-800
                  hover:shadow-xl
                "
              >
                {reviewed[
                  selectedAnomaly.id
                ]
                  ? "Mark as not reviewed"
                  : "Mark anomaly as reviewed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MINI INSIGHT
============================================================ */

function MiniInsight({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div
      className="
        rounded-2xl
        border border-slate-100
        bg-slate-50
        p-4
        transition-all duration-200
        hover:bg-white
        hover:shadow-sm
      "
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`
          mt-1
          font-bold
          ${valueClass}
        `}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({ onClear }) {
  return (
    <div className="p-10 text-center">

      <div
        className="
          mx-auto
          flex h-16 w-16
          items-center justify-center
          rounded-2xl
          bg-emerald-50
          shadow-inner
        "
      >
        <CheckCircle2
          className="text-emerald-600"
          size={28}
        />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        No matching anomalies
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        Nothing matches the current filters. Try
        changing the filters or clear them to see
        the full anomaly feed.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="
          mt-4
          rounded-xl
          bg-slate-950
          px-4 py-2.5
          text-sm font-semibold
          text-white
          transition-all
          hover:-translate-y-0.5
          hover:bg-slate-800
          hover:shadow-lg
        "
      >
        Clear filters
      </button>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon,
  color = "blue",
}) {
  const colors = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      glow: "group-hover:shadow-blue-500/10",
    },

    red: {
      icon: "bg-red-50 text-red-600",
      glow: "group-hover:shadow-red-500/10",
    },

    orange: {
      icon: "bg-orange-50 text-orange-600",
      glow: "group-hover:shadow-orange-500/10",
    },

    yellow: {
      icon: "bg-amber-50 text-amber-600",
      glow: "group-hover:shadow-amber-500/10",
    },

    green: {
      icon: "bg-emerald-50 text-emerald-600",
      glow: "group-hover:shadow-emerald-500/10",
    },
  };

  const theme =
    colors[color] || colors.blue;

  return (
    <div
      className={`
        group
        relative overflow-hidden
        rounded-2xl
        border border-white/40
        bg-white/90
        p-5
        shadow-xl shadow-black/10
        backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-2
        hover:shadow-2xl
        ${theme.glow}
      `}
    >
      {/* Decorative glow */}
      <div
        className="
          pointer-events-none
          absolute -right-8 -top-8
          h-20 w-20
          rounded-full
          bg-slate-100
          blur-2xl
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
        "
      />

      <div className="relative flex items-center justify-between">

        <div>
          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[11px] font-medium text-slate-400">
              Updated live
            </span>
          </div>
        </div>

        <div
          className={`
            rounded-2xl
            p-3
            transition-all duration-300
            group-hover:scale-110
            group-hover:rotate-3
            ${theme.icon}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}