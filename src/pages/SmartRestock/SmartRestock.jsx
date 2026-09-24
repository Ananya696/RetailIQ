import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";

const fallbackProducts = [
  {
    id: 1,
    name: "Laptop",
    category: "Electronics",
    supplier: "Tech World",
    price: 55000,
    stock: 12,
  },
  {
    id: 2,
    name: "Wireless Mouse",
    category: "Accessories",
    supplier: "Digital Hub",
    price: 799,
    stock: 5,
  },
  {
    id: 3,
    name: "Keyboard",
    category: "Accessories",
    supplier: "Digital Hub",
    price: 1299,
    stock: 0,
  },
  {
    id: 4,
    name: "Headphones",
    category: "Electronics",
    supplier: "Tech World",
    price: 2499,
    stock: 24,
  },
];

const fallbackSales = [
  {
    id: "S001",
    product: "Laptop",
    quantity: 1,
    price: 55000,
    total: 55000,
  },
  {
    id: "S002",
    product: "Wireless Mouse",
    quantity: 2,
    price: 799,
    total: 1598,
  },
  {
    id: "S003",
    product: "Headphones",
    quantity: 1,
    price: 2499,
    total: 2499,
  },
  {
    id: "S004",
    product: "Keyboard",
    quantity: 2,
    price: 1299,
    total: 2598,
  },
];

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const getProductName = (sale) =>
  sale?.productName ||
  sale?.product ||
  sale?.product_name ||
  sale?.name ||
  "";

const getQuantity = (sale) =>
  Number(sale?.quantity ?? sale?.qty ?? sale?.units ?? 0);

/* =========================================================
   PRIORITY BADGE
========================================================= */

function PriorityBadge({ priority }) {
  const styles = {
    Critical:
      "bg-rose-500/10 text-rose-300 border-rose-400/20",
    High:
      "bg-orange-500/10 text-orange-300 border-orange-400/20",
    Medium:
      "bg-amber-500/10 text-amber-300 border-amber-400/20",
    Low:
      "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
  };

  const icons = {
    Critical: AlertTriangle,
    High: Zap,
    Medium: Clock3,
    Low: CheckCircle2,
  };

  const Icon = icons[priority] || Clock3;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-bold
        backdrop-blur-md
        ${styles[priority] || styles.Medium}
      `}
    >
      <Icon size={12} />
      {priority}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  positive = true,
  iconClass,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-white/40
        bg-white/90
        backdrop-blur-xl
        p-5
        shadow-xl
        transition-all
        duration-300
        hover:-translate-y-1.5
        hover:shadow-2xl
      "
    >
      {/* Decorative glow */}
      <div
        className="
          absolute
          -right-8
          -top-8
          h-28
          w-28
          rounded-full
          bg-blue-100/70
          blur-2xl
          transition-transform
          duration-500
          group-hover:scale-150
        "
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>

          <span
            className={`
              mt-3
              inline-flex
              items-center
              gap-1
              rounded-full
              px-2
              py-1
              text-[11px]
              font-bold
              ${
                positive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }
            `}
          >
            {positive ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}

            {trend}
          </span>
        </div>

        <div
          className={`
            rounded-xl
            p-3
            shadow-sm
            transition-all
            duration-300
            group-hover:scale-110
            ${iconClass}
          `}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div
        className="
          rounded-xl
          bg-blue-50
          p-2.5
          text-blue-600
          shadow-sm
        "
      >
        <Icon size={19} />
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SmartRestock({
  products = [],
  sales = [],
  onGeneratePurchaseOrder,
}) {
  const [period, setPeriod] = useState(30);
  const [category, setCategory] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [generated, setGenerated] = useState(false);

  const safeProducts = products.length
    ? products
    : fallbackProducts;

  const safeSales = sales.length
    ? sales
    : fallbackSales;

  /* =========================================================
     CATEGORIES
  ========================================================= */

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        safeProducts
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];
  }, [safeProducts]);

  /* =========================================================
     RESTOCK RECOMMENDATIONS
  ========================================================= */

  const recommendations = useMemo(() => {
    return safeProducts.map((product, index) => {
      const productSales = safeSales.filter(
        (sale) =>
          getProductName(sale).toLowerCase() ===
          String(product.name).toLowerCase()
      );

      const totalSold = productSales.reduce(
        (sum, sale) => sum + getQuantity(sale),
        0
      );

      const averageSale =
        productSales.length > 0
          ? totalSold / productSales.length
          : 0.4;

      const demandFactor =
        period === 7
          ? 1
          : period === 30
          ? 4.1
          : 12.5;

      const predictedDemand = Math.max(
        1,
        Math.ceil(averageSale * demandFactor)
      );

      const dailyDemand = Math.max(
        0.25,
        predictedDemand / period
      );

      const currentStock = Number(product.stock || 0);

      const safetyStock = Math.max(
        2,
        Math.ceil(dailyDemand * 5)
      );

      const reorderPoint = Math.ceil(
        dailyDemand * 7 + safetyStock
      );

      const recommendedQuantity = Math.max(
        0,
        Math.ceil(
          predictedDemand +
            safetyStock -
            currentStock
        )
      );

      const stockCover =
        currentStock > 0
          ? Math.floor(currentStock / dailyDemand)
          : 0;

      let priority = "Low";

      if (currentStock === 0 || stockCover <= 2) {
        priority = "Critical";
      } else if (
        stockCover <= 7 ||
        recommendedQuantity >= predictedDemand * 0.75
      ) {
        priority = "High";
      } else if (
        stockCover <= 14 ||
        recommendedQuantity > 0
      ) {
        priority = "Medium";
      }

      const confidence = Math.min(
        96,
        Math.max(
          76,
          82 + productSales.length * 3 - index
        )
      );

      const estimatedCost =
        recommendedQuantity *
        Number(product.price || 0);

      return {
        ...product,
        totalSold,
        predictedDemand,
        dailyDemand,
        currentStock,
        reorderPoint,
        recommendedQuantity,
        stockCover,
        confidence,
        estimatedCost,
        priority,
      };
    });
  }, [safeProducts, safeSales, period]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((product) => {
      const categoryMatch =
        category === "All" ||
        product.category === category;

      const priorityMatch =
        priorityFilter === "All" ||
        product.priority === priorityFilter;

      return categoryMatch && priorityMatch;
    });
  }, [
    recommendations,
    category,
    priorityFilter,
  ]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const critical = recommendations.filter(
      (item) => item.priority === "Critical"
    ).length;

    const high = recommendations.filter(
      (item) => item.priority === "High"
    ).length;

    const units = recommendations.reduce(
      (sum, item) =>
        sum + item.recommendedQuantity,
      0
    );

    const cost = recommendations.reduce(
      (sum, item) =>
        sum + item.estimatedCost,
      0
    );

    return {
      critical,
      high,
      units,
      cost,
    };
  }, [recommendations]);

  /* =========================================================
     SUPPLIER GROUPING
  ========================================================= */

  const groupedSuppliers = useMemo(() => {
    const map = {};

    recommendations
      .filter(
        (item) => item.recommendedQuantity > 0
      )
      .forEach((item) => {
        const supplier =
          item.supplier || "Supplier not assigned";

        if (!map[supplier]) {
          map[supplier] = {
            supplier,
            products: 0,
            units: 0,
            cost: 0,
          };
        }

        map[supplier].products += 1;
        map[supplier].units +=
          item.recommendedQuantity;
        map[supplier].cost +=
          item.estimatedCost;
      });

    return Object.values(map);
  }, [recommendations]);

  /* =========================================================
     GENERATE PURCHASE ORDER
  ========================================================= */

  const handleGeneratePO = () => {
    const orderItems = recommendations.filter(
      (item) => item.recommendedQuantity > 0
    );

    setGenerated(true);

    if (
      typeof onGeneratePurchaseOrder ===
      "function"
    ) {
      onGeneratePurchaseOrder(orderItems);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        min-h-screen
        px-4
        py-5
        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          max-w-[1600px]
          space-y-6
          animate-[fadeIn_0.6s_ease-out]
        "
      >
        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-slate-950/80
            backdrop-blur-2xl
            border
            border-white/10
            p-6
            text-white
            shadow-2xl
            shadow-black/20
            sm:p-8
          "
        >
          {/* Background glow */}
          <div
            className="
              absolute
              -right-20
              -top-20
              h-72
              w-72
              rounded-full
              bg-blue-500/20
              blur-3xl
            "
          />

          <div
            className="
              absolute
              -bottom-32
              left-1/3
              h-72
              w-72
              rounded-full
              bg-indigo-500/15
              blur-3xl
            "
          />

          <div
            className="
              absolute
              right-1/3
              top-1/2
              h-40
              w-40
              rounded-full
              bg-cyan-500/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-6
              xl:flex-row
              xl:items-center
              xl:justify-between
            "
          >
            <div className="max-w-2xl">
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-blue-400/20
                  bg-blue-500/10
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-blue-300
                  backdrop-blur-md
                "
              >
                <Sparkles size={14} />
                RetailIQ Smart Inventory
              </div>

              <h1
                className="
                  text-3xl
                  font-black
                  tracking-tight
                  sm:text-4xl
                "
              >
                Smart Restock
              </h1>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-slate-300
                  sm:text-base
                "
              >
                Convert demand forecasts into
                actionable purchase recommendations.
                RetailIQ calculates what to reorder
                before your shelves run empty.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-3
                  text-xs
                  text-slate-400
                "
              >
                <span className="inline-flex items-center gap-1.5">
                  <Brain size={14} />
                  Forecast-powered
                </span>

                <span>•</span>

                <span>Supplier-aware</span>

                <span>•</span>

                <span>Stock-risk driven</span>
              </div>
            </div>

            <button
              onClick={handleGeneratePO}
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-5
                py-3
                text-sm
                font-bold
                text-slate-950
                shadow-xl
                transition-all
                duration-300
                hover:-translate-y-1
                hover:bg-blue-50
                hover:shadow-blue-500/20
              "
            >
              <ShoppingCart
                size={17}
                className="
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              />

              {generated
                ? "Purchase Order Ready"
                : "Generate Purchase Order"}
            </button>
          </div>
        </section>

        {/* =================================================
            CONTROLS
        ================================================= */}

        <section
          className="
            flex
            flex-col
            gap-4
            rounded-2xl
            border
            border-white/40
            bg-white/90
            backdrop-blur-xl
            p-4
            shadow-xl
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="flex flex-wrap items-center gap-2">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`
                  rounded-xl
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition-all
                  duration-300

                  ${
                    period === value
                      ? `
                        bg-gradient-to-r
                        from-blue-600
                        to-indigo-600
                        text-white
                        shadow-lg
                        shadow-blue-200
                        -translate-y-0.5
                      `
                      : `
                        bg-slate-100
                        text-slate-600
                        hover:bg-blue-50
                        hover:text-blue-600
                      `
                  }
                `}
              >
                {value} Days
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Category */}
            <div className="relative">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-2
                  pl-3
                  pr-9
                  text-sm
                  font-semibold
                  text-slate-600
                  outline-none
                  transition
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === "All"
                      ? "All Categories"
                      : item}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />
            </div>

            {/* Priority */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
                }
                className="
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-2
                  pl-3
                  pr-9
                  text-sm
                  font-semibold
                  text-slate-600
                  outline-none
                  transition
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <option value="All">
                  All Priorities
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

              <ChevronDown
                size={15}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            title="Critical Items"
            value={stats.critical}
            subtitle="Need immediate attention"
            icon={AlertTriangle}
            trend={
              stats.critical
                ? "Action required"
                : "No critical items"
            }
            positive={!stats.critical}
            iconClass="bg-rose-50 text-rose-600"
          />

          <StatCard
            title="High Priority"
            value={stats.high}
            subtitle="Should be reordered soon"
            icon={Zap}
            trend="Monitor closely"
            positive={false}
            iconClass="bg-orange-50 text-orange-600"
          />

          <StatCard
            title="Recommended Units"
            value={formatNumber(stats.units)}
            subtitle={`For the next ${period} days`}
            icon={Package}
            trend="+ inventory coverage"
            positive
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Estimated Cost"
            value={currency(stats.cost)}
            subtitle="Suggested purchase value"
            icon={IndianRupee}
            trend="Planning estimate"
            positive
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </section>

        {/* =================================================
            AI RECOMMENDATION
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-blue-200/50
            bg-white/85
            backdrop-blur-xl
            p-5
            shadow-xl
            sm:p-6
          "
        >
          <div
            className="
              absolute
              -right-12
              -top-12
              h-40
              w-40
              rounded-full
              bg-blue-400/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="flex gap-4">
              <div
                className="
                  h-fit
                  rounded-xl
                  bg-gradient-to-br
                  from-blue-600
                  to-indigo-600
                  p-3
                  text-white
                  shadow-lg
                  shadow-blue-500/20
                "
              >
                <Brain size={21} />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-blue-600
                  "
                >
                  RetailIQ Recommendation
                </p>

                <h2
                  className="
                    mt-1
                    text-lg
                    font-black
                    text-slate-900
                  "
                >
                  {stats.critical > 0
                    ? `${stats.critical} product(s) need immediate restocking`
                    : "Inventory coverage is currently stable"}
                </h2>

                <p
                  className="
                    mt-1
                    max-w-3xl
                    text-sm
                    leading-6
                    text-slate-600
                  "
                >
                  {stats.units > 0
                    ? `Based on the selected forecast window, RetailIQ recommends ordering ${formatNumber(
                        stats.units
                      )} units with an estimated purchase value of ${currency(
                        stats.cost
                      )}.`
                    : "No additional purchase quantity is currently recommended."}
                </p>
              </div>
            </div>

            <button
              onClick={handleGeneratePO}
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-950
                px-5
                py-3
                text-sm
                font-bold
                text-white
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-blue-500/20
              "
            >
              <Zap size={16} />
              Review Order
            </button>
          </div>
        </section>

        {/* =================================================
            RESTOCK TABLE
        ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-white/40
            bg-white/90
            backdrop-blur-xl
            p-5
            shadow-xl
            sm:p-6
          "
        >
          <SectionHeader
            icon={ShoppingCart}
            title="Recommended Restock Plan"
            subtitle="Prioritized purchase recommendations from demand and current stock"
          />

          {filteredRecommendations.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-200
                p-10
                text-center
              "
            >
              <Package
                className="mx-auto text-slate-300"
                size={34}
              />

              <p className="mt-3 text-sm font-bold text-slate-700">
                No products match your filters.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try another category or priority.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      {[
                        "Product",
                        "Supplier",
                        "Stock",
                        "Forecast",
                        "Stock Cover",
                        "Order Qty",
                        "Est. Cost",
                        "Priority",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="
                            px-3
                            py-3
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRecommendations.map(
                      (item) => (
                        <tr
                          key={
                            item.id || item.name
                          }
                          className="
                            border-b
                            border-slate-50
                            transition-all
                            duration-300
                            hover:bg-blue-50/40
                          "
                        >
                          <td className="px-3 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              {item.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {item.category}
                            </p>
                          </td>

                          <td className="px-3 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                              <Truck
                                size={14}
                                className="text-blue-500"
                              />

                              {item.supplier ||
                                "Not assigned"}
                            </span>
                          </td>

                          <td className="px-3 py-4 text-sm font-bold text-slate-800">
                            {formatNumber(
                              item.currentStock
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <span className="text-sm font-bold text-blue-600">
                              {formatNumber(
                                item.predictedDemand
                              )}
                            </span>

                            <span className="ml-1 text-xs text-slate-400">
                              units
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`
                                text-sm
                                font-bold
                                ${
                                  item.stockCover <=
                                  2
                                    ? "text-rose-600"
                                    : item.stockCover <=
                                      7
                                    ? "text-orange-600"
                                    : "text-emerald-600"
                                }
                              `}
                            >
                              {item.stockCover} days
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className="
                                rounded-lg
                                bg-blue-50
                                px-2.5
                                py-1.5
                                text-sm
                                font-black
                                text-blue-700
                              "
                            >
                              +
                              {formatNumber(
                                item.recommendedQuantity
                              )}
                            </span>
                          </td>

                          <td className="px-3 py-4 text-sm font-bold text-slate-800">
                            {currency(
                              item.estimatedCost
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <PriorityBadge
                              priority={
                                item.priority
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="grid gap-3 lg:hidden">
                {filteredRecommendations.map(
                  (item) => (
                    <div
                      key={
                        item.id || item.name
                      }
                      className="
                        rounded-2xl
                        border
                        border-slate-100
                        bg-slate-50/70
                        p-4
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:bg-white
                        hover:shadow-lg
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.category} •{" "}
                            {item.supplier ||
                              "No supplier"}
                          </p>
                        </div>

                        <PriorityBadge
                          priority={
                            item.priority
                          }
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Stock
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-800">
                            {item.currentStock}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Forecast
                          </p>

                          <p className="mt-1 text-sm font-black text-blue-600">
                            {item.predictedDemand}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Cover
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-800">
                            {item.stockCover} days
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Order
                          </p>

                          <p className="mt-1 text-sm font-black text-blue-600">
                            +{item.recommendedQuantity}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-xs text-slate-500">
                          Estimated cost
                        </span>

                        <span className="text-sm font-black text-slate-800">
                          {currency(
                            item.estimatedCost
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {/* =================================================
            SUPPLIER SUMMARY
        ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-white/40
            bg-white/90
            backdrop-blur-xl
            p-5
            shadow-xl
            sm:p-6
          "
        >
          <SectionHeader
            icon={Truck}
            title="Supplier-wise Order Summary"
            subtitle="Group your recommended purchases by supplier"
          />

          {groupedSuppliers.length === 0 ? (
            <p
              className="
                rounded-xl
                bg-slate-50
                p-5
                text-center
                text-sm
                text-slate-500
              "
            >
              No supplier orders are currently
              recommended.
            </p>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {groupedSuppliers.map(
                (supplier) => (
                  <div
                    key={supplier.supplier}
                    className="
                      group
                      rounded-2xl
                      border
                      border-slate-100
                      bg-slate-50/70
                      p-4
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:bg-white
                      hover:shadow-xl
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          rounded-xl
                          bg-white
                          p-2.5
                          text-blue-600
                          shadow-sm
                          transition-all
                          duration-300
                          group-hover:scale-110
                        "
                      >
                        <Truck size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {supplier.supplier}
                        </p>

                        <p className="text-xs text-slate-400">
                          {supplier.products} product(s)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Units
                        </p>

                        <p className="mt-1 text-lg font-black text-blue-600">
                          {formatNumber(
                            supplier.units
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Est. Cost
                        </p>

                        <p className="mt-1 text-lg font-black text-slate-900">
                          {currency(
                            supplier.cost
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-2
            rounded-2xl
            border
            border-white/30
            bg-white/60
            backdrop-blur-xl
            px-5
            py-4
            text-xs
            text-slate-500
            shadow-lg
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw
              size={14}
              className="text-blue-500"
            />

            Recommendations update automatically
            when forecast period or filters change.
          </span>

          <span className="font-medium text-slate-400">
            RetailIQ • Smart Restock
          </span>
        </div>
      </div>
    </div>
  );
}