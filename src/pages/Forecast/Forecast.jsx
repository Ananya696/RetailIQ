import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";

/*
  RetailIQ - Forecast Page

  Props:
    products: shared inventory products from App.jsx
    sales: shared sales data from App.jsx
    onGenerateRestock: optional callback kept for the existing UI

  Forecast values come from the backend ML API required by the
  RetailIQ integration guide. The existing UI is preserved.
*/

const PERIODS = {
  7: { label: "7 Days", multiplier: 1 },
  30: { label: "30 Days", multiplier: 1 },
  90: { label: "90 Days", multiplier: 1 },
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const parseDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) return value;

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const match = String(value).match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );

  if (!match) return null;

  const [, day, month, year] = match;

  const result = new Date(`${day} ${month} ${year}`);

  return Number.isNaN(result.getTime()) ? null : result;
};

const getSaleProductName = (sale) =>
  sale?.productName ||
  sale?.product ||
  sale?.product_name ||
  sale?.name ||
  "Unknown Product";

const getSaleQuantity = (sale) =>
  Number(sale?.quantity ?? sale?.qty ?? sale?.units ?? 0);

const getSaleTotal = (sale) =>
  Number(sale?.total ?? sale?.amount ?? 0) ||
  getSaleQuantity(sale) * Number(sale?.price ?? 0);

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  iconClass = "bg-indigo-50 text-indigo-600",
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-white/50
        bg-white/90
        p-5
        shadow-xl
        backdrop-blur-xl
        transition-all
        duration-300
        ease-out
        hover:-translate-y-2
        hover:shadow-2xl
      "
    >
      <div
        className="
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          bg-indigo-100/60
          blur-xl
          transition-transform
          duration-500
          group-hover:scale-150
        "
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}

          {trend && (
            <div
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                trendPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {trendPositive ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}

              {trend}
            </div>
          )}
        </div>

        <div
          className={`
            rounded-xl
            p-3
            transition-all
            duration-300
            group-hover:scale-110
            group-hover:rotate-3
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

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className="
            rounded-xl
            border
            border-indigo-100
            bg-indigo-50
            p-2.5
            text-indigo-600
            shadow-sm
            transition-all
            duration-300
            hover:scale-105
          "
        >
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   MINI BAR
========================================================= */

function MiniBar({ value, max, label }) {
  const width =
    max > 0
      ? Math.max(5, Math.min(100, (value / max) * 100))
      : 5;

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-medium text-slate-700">
          {label}
        </span>

        <span className="shrink-0 font-semibold text-slate-900">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-indigo-500
            to-violet-500
            transition-all
            duration-700
          "
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   FORECAST CHART
========================================================= */

function ForecastChart({ data }) {
  const width = 900;
  const height = 330;

  const padding = {
    top: 28,
    right: 25,
    bottom: 45,
    left: 45,
  };

  const values = data.flatMap((item) => [
    Number(item.actual || 0),
    Number(item.predicted || 0),
  ]);

  const maxValue = Math.max(...values, 5);

  const chartWidth =
    width - padding.left - padding.right;

  const chartHeight =
    height - padding.top - padding.bottom;

  const x = (index) =>
    padding.left +
    (index / Math.max(data.length - 1, 1)) *
      chartWidth;

  const y = (value) =>
    padding.top +
    chartHeight -
    (value / maxValue) * chartHeight;

  const actualPoints = data
    .map(
      (item, index) =>
        `${x(index)},${y(item.actual)}`
    )
    .join(" ");

  const predictedPoints = data
    .map(
      (item, index) =>
        `${x(index)},${y(item.predicted)}`
    )
    .join(" ");

  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[680px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[330px] w-full"
          role="img"
          aria-label="Historical and predicted sales forecast chart"
        >
          {gridValues.map((ratio) => {
            const value = maxValue * ratio;
            const yPos = y(value);

            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yPos}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-slate-100"
                  strokeWidth="1"
                />

                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px]"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          <polyline
            points={actualPoints}
            fill="none"
            stroke="currentColor"
            className="text-slate-500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={predictedPoints}
            fill="none"
            stroke="currentColor"
            className="text-indigo-500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 7"
          />

          {data.map((item, index) => (
            <g key={`${item.label}-${index}`}>
              <circle
                cx={x(index)}
                cy={y(item.actual)}
                r="4"
                className="fill-white stroke-slate-500"
                strokeWidth="2"
              />

              <circle
                cx={x(index)}
                cy={y(item.predicted)}
                r="4"
                className="fill-white stroke-indigo-500"
                strokeWidth="2"
              />

              <text
                x={x(index)}
                y={height - 16}
                textAnchor="middle"
                className="fill-slate-400 text-[11px]"
              >
                {item.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* =========================================================
   RISK BADGE
========================================================= */

function RiskBadge({ status }) {
  const config = {
    "At Risk": {
      className:
        "bg-rose-50 text-rose-700 border-rose-100",
      icon: TriangleAlert,
    },

    "Restock Soon": {
      className:
        "bg-amber-50 text-amber-700 border-amber-100",
      icon: Clock3,
    },

    Healthy: {
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    },
  };

  const current = config[status] || config.Healthy;

  const Icon = current.icon;

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
        font-semibold
        ${current.className}
      `}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}

/* =========================================================
   CONFIDENCE BADGE
========================================================= */

function ConfidenceBadge({ value }) {
  if (value == null) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
        Confidence unavailable
      </span>
    );
  }

  const strong = value >= 85;

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-[11px]
        font-semibold
        ${
          strong
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }
      `}
    >
      {value}% confidence
    </span>
  );
}

/* =========================================================
   FORECAST PAGE
========================================================= */

export default function Forecast({
  products = [],
  sales = [],
  onGenerateRestock,
}) {
  const [period, setPeriod] = useState(30);
  const [category, setCategory] = useState("All");
  const [generated, setGenerated] = useState(false);
  const [forecastData, setForecastData] = useState({});
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  const safeProducts = products;
  const safeSales = sales;

  useEffect(() => {
    let cancelled = false;

    const loadForecasts = async () => {
      if (!safeProducts.length) {
        setForecastData({});
        return;
      }

      try {
        setForecastLoading(true);
        setForecastError("");

        const results = await Promise.all(
          safeProducts.map(async (product) => {
            const data = await api(
              `/api/forecast/${product.id}?days=${period}`
            );

            return [product.id, data];
          })
        );

        if (!cancelled) {
          setForecastData(Object.fromEntries(results));
        }
      } catch (error) {
        console.error("Failed to load forecast:", error);

        if (!cancelled) {
          setForecastData({});
          setForecastError(
            error.message || "Failed to load forecast data."
          );
        }
      } finally {
        if (!cancelled) {
          setForecastLoading(false);
        }
      }
    };

    loadForecasts();

    return () => {
      cancelled = true;
    };
  }, [safeProducts, period]);

  const categories = useMemo(() => {
    const values = safeProducts
      .map((product) => product.category)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [safeProducts]);

  const normalizedSales = useMemo(
    () =>
      safeSales.map((sale) => ({
        ...sale,
        productName: getSaleProductName(sale),
        quantity: getSaleQuantity(sale),
        total: getSaleTotal(sale),
        parsedDate: parseDate(
          sale.date || sale.createdAt
        ),
      })),
    [safeSales]
  );

  /* =====================================================
     PRODUCT FORECAST DATA FROM BACKEND ML API
  ===================================================== */

  const productForecasts = useMemo(() => {
    return safeProducts
      .filter(
        (product) =>
          category === "All" ||
          product.category === category
      )
      .map((product) => {
        const response = forecastData[product.id] || {};
        const predictedDemand = Math.max(
          0,
          Number(response.total_demand || 0)
        );

        const dailyDemand =
          period > 0
            ? Number((predictedDemand / period).toFixed(2))
            : 0;

        const currentStock = Number(product.stock || 0);

        const daysUntilStockout =
          dailyDemand > 0 && currentStock > 0
            ? Math.round(currentStock / dailyDemand)
            : currentStock > 0
            ? period
            : 0;

        const recommendedStock = Math.max(
          0,
          Math.ceil(predictedDemand - currentStock)
        );

        let status = "Healthy";

        if (currentStock <= 0 || daysUntilStockout <= 3) {
          status = "At Risk";
        } else if (daysUntilStockout <= 10 || recommendedStock > 0) {
          status = "Restock Soon";
        }

        return {
          ...product,
          totalSold: normalizedSales
            .filter(
              (sale) =>
                sale.productName.toLowerCase() ===
                String(product.name).toLowerCase()
            )
            .reduce((sum, sale) => sum + sale.quantity, 0),
          dailyDemand,
          predictedDemand,
          predictedRevenue:
            predictedDemand * Number(product.price || 0),
          daysUntilStockout,
          recommendedStock,
          confidence:
            response.confidence != null
              ? Number(response.confidence)
              : null,
          status,
          forecastDates: Array.isArray(response.forecast_dates)
            ? response.forecast_dates
            : [],
          forecastValues: Array.isArray(response.forecast)
            ? response.forecast.map(Number)
            : [],
        };
      });
  }, [
    safeProducts,
    forecastData,
    normalizedSales,
    category,
    period,
  ]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totals = useMemo(() => {
    const predictedDemand =
      productForecasts.reduce(
        (sum, product) =>
          sum + product.predictedDemand,
        0
      );

    const expectedRevenue =
      productForecasts.reduce(
        (sum, product) =>
          sum + product.predictedRevenue,
        0
      );

    const atRisk =
      productForecasts.filter(
        (product) =>
          product.status === "At Risk"
      ).length;

    const restock =
      productForecasts.reduce(
        (sum, product) =>
          sum + product.recommendedStock,
        0
      );

    const confidenceValues =
      productForecasts
        .map((product) => product.confidence)
        .filter((value) => Number.isFinite(value));

    const confidence =
      confidenceValues.length > 0
        ? Math.round(
            confidenceValues.reduce(
              (sum, value) => sum + value,
              0
            ) / confidenceValues.length
          )
        : null;

    return {
      predictedDemand,
      expectedRevenue,
      atRisk,
      restock,
      confidence,
    };
  }, [productForecasts]);

  /* =====================================================
     TOP PRODUCTS
  ===================================================== */

  const topProducts = useMemo(
    () =>
      [...productForecasts]
        .sort(
          (a, b) =>
            b.predictedDemand -
            a.predictedDemand
        )
        .slice(0, 5),
    [productForecasts]
  );

  /* =====================================================
     CHART DATA FROM BACKEND FORECAST
  ===================================================== */

  const chartData = useMemo(() => {
    const forecastSeries = productForecasts.find(
      (product) => product.forecastValues.length > 0
    );

    if (!forecastSeries) return [];

    const dates = forecastSeries.forecastDates;
    const values = forecastSeries.forecastValues;

    return values.map((predicted, index) => ({
      label: dates[index] || `Day ${index + 1}`,
      actual: 0,
      predicted: Number(predicted || 0),
    }));
  }, [productForecasts]);

  /* =====================================================
     AI INSIGHT
  ===================================================== */

  const insight = useMemo(() => {
    const riskProduct =
      [...productForecasts].sort(
        (a, b) =>
          a.daysUntilStockout -
          b.daysUntilStockout
      )[0];

    const topProduct =
      topProducts[0];

    if (!riskProduct) {
      return {
        title: "Forecast is ready",
        text:
          "Add products and sales history to generate product-level demand predictions.",
      };
    }

    if (
      riskProduct.status === "At Risk"
    ) {
      return {
        title: `${riskProduct.name} needs attention`,
        text: `${riskProduct.name} is projected to run out in about ${Math.max(
          0,
          riskProduct.daysUntilStockout
        )} day(s). RetailIQ recommends planning a restock of ${riskProduct.recommendedStock} unit(s).`,
      };
    }

    return {
      title: `${
        topProduct?.name ||
        "Top product"
      } is driving demand`,
      text: `Based on the current sales history, RetailIQ expects around ${formatNumber(
        totals.predictedDemand
      )} units of demand over the next ${period} days. Keep an eye on products with short stock cover.`,
    };
  }, [
    productForecasts,
    topProducts,
    totals.predictedDemand,
    period,
  ]);

  /* =====================================================
     RESTOCK
  ===================================================== */

  const handleGenerateRestock = () => {
    setGenerated(true);

    if (
      typeof onGenerateRestock ===
      "function"
    ) {
      onGenerateRestock(
        productForecasts
      );
    }
  };

  /* =====================================================
     EXPORT CSV
  ===================================================== */

  const handleExport = () => {
    const headers = [
      "Product",
      "Category",
      "Current Stock",
      `Predicted Demand (${period} Days)`,
      "Days Until Stockout",
      "Recommended Restock",
      "Confidence",
      "Status",
    ];

    const rows =
      productForecasts.map(
        (product) => [
          product.name,
          product.category,
          product.stock,
          product.predictedDemand,
          product.daysUntilStockout,
          product.recommendedStock,
          product.confidence == null
            ? "N/A"
            : `${product.confidence}%`,
          product.status,
        ]
      );

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(
                cell ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `retailiq-forecast-${period}-days.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className="
        retailiq-forecast
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
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-slate-950/90
            p-6
            text-white
            shadow-2xl
            shadow-black/20
            backdrop-blur-2xl
            sm:p-8
            animate-[fadeIn_0.6s_ease-out]
          "
        >
          <div
            className="
              absolute
              -right-20
              -top-24
              h-72
              w-72
              rounded-full
              bg-indigo-500/20
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
              bg-violet-500/10
              blur-3xl
            "
          />

          <div
            className="
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-indigo-400/60
              to-transparent
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
                  border-white/10
                  bg-white/10
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-indigo-200
                  backdrop-blur
                "
              >
                <Sparkles size={14} />

                RetailIQ Intelligence
              </div>

              <h1
                className="
                  text-3xl
                  font-black
                  tracking-tight
                  sm:text-4xl
                "
              >
                Demand Forecast
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
                Predict upcoming product demand,
                identify stock-out risks, and turn
                sales history into smarter inventory
                decisions.
              </p>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  text-xs
                  text-slate-400
                "
              >
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                  "
                >
                  <Brain size={14} />

                  ML-ready forecast engine
                </span>

                <span className="text-slate-600">
                  •
                </span>

                <span>
                  {normalizedSales.length} sales
                  records analyzed
                </span>
              </div>
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                xl:flex-col
              "
            >
              <button
                onClick={
                  handleGenerateRestock
                }
                className="
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
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-indigo-50
                  hover:shadow-indigo-500/20
                  active:scale-95
                "
              >
                <Zap size={17} />

                {generated
                  ? "Restock Plan Generated"
                  : "Generate Restock Plan"}
              </button>

              <button
                onClick={handleExport}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-white/5
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-white/10
                  hover:border-white/25
                  active:scale-95
                "
              >
                <Download size={16} />

                Export Forecast
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTROLS
        ================================================= */}

        <section
          className="
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-white/50
            bg-white/85
            p-4
            shadow-xl
            backdrop-blur-xl
            transition-all
            duration-300
            hover:shadow-2xl
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-slate-700
            "
          >
            <CalendarDays
              size={17}
              className="text-indigo-500"
            />

            Forecast period
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(PERIODS).map(
              ([value, config]) => (
                <button
                  key={value}
                  onClick={() =>
                    setPeriod(Number(value))
                  }
                  className={`
                    rounded-xl
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    transition-all
                    duration-300
                    ${
                      period ===
                      Number(value)
                        ? `
                          bg-indigo-600
                          text-white
                          shadow-md
                          shadow-indigo-200
                          scale-105
                        `
                        : `
                          bg-slate-100
                          text-slate-600
                          hover:bg-indigo-50
                          hover:text-indigo-600
                          hover:-translate-y-0.5
                        `
                    }
                  `}
                >
                  {config.label}
                </button>
              )
            )}

            <div className="relative">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
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
                  transition-all
                  duration-300
                  hover:border-indigo-300
                  focus:border-indigo-400
                  focus:ring-2
                  focus:ring-indigo-100
                "
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item === "All"
                        ? "All Categories"
                        : item}
                    </option>
                  )
                )}
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
            KPI CARDS
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
            title="Predicted Demand"
            value={`${formatNumber(
              totals.predictedDemand
            )} units`}
            subtitle={`Next ${period} days`}
            icon={TrendingUp}
            trend="+8.4% projected"
            trendPositive
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            title="Expected Revenue"
            value={currency(
              totals.expectedRevenue
            )}
            subtitle="Based on forecasted units"
            icon={BarChart3}
            trend="+6.7% potential"
            trendPositive
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            title="Forecast Confidence"
            value={
              totals.confidence == null
                ? "—"
                : `${totals.confidence}%`
            }
            subtitle="Current model confidence"
            icon={Target}
            trend={
              totals.confidence == null
                ? "Not provided by API"
                : totals.confidence >= 85
                ? "High confidence"
                : "Moderate"
            }
            trendPositive={
              totals.confidence != null &&
              totals.confidence >= 85
            }
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Products at Risk"
            value={totals.atRisk}
            subtitle={`${formatNumber(
              totals.restock
            )} units recommended`}
            icon={TriangleAlert}
            trend={
              totals.atRisk
                ? "Action required"
                : "No urgent risks"
            }
            trendPositive={
              !totals.atRisk
            }
            iconClass="bg-amber-50 text-amber-600"
          />
        </section>

        {/* =================================================
            CHART + AI INSIGHT
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-6
            xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-white/50
              bg-white/90
              p-5
              shadow-xl
              backdrop-blur-xl
              transition-all
              duration-300
              hover:shadow-2xl
              sm:p-6
            "
          >
            <SectionHeader
              icon={TrendingUp}
              title="Historical vs Predicted Sales"
              subtitle={`Demand trajectory for the next ${period} days`}
              action={
                <div
                  className="
                    flex
                    items-center
                    gap-4
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-slate-500
                      "
                    />

                    Historical
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-indigo-500
                      "
                    />

                    Predicted
                  </span>
                </div>
              }
            />

            {forecastLoading ? (
              <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                Loading forecast...
              </div>
            ) : chartData.length > 0 ? (
              <ForecastChart data={chartData} />
            ) : (
              <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                Forecast data will appear here once the API returns a prediction.
              </div>
            )}

            <div
              className="
                mt-2
                rounded-xl
                border
                border-indigo-100/60
                bg-indigo-50/60
                px-4
                py-3
                text-xs
                leading-5
                text-slate-500
              "
            >
              <span className="font-semibold text-indigo-700">
                ML forecast:
              </span>{" "}
              Values are loaded from the RetailIQ
              forecasting API for the selected period.
              {forecastLoading && " Loading..."}
            </div>
          </div>

          {/* AI INSIGHT */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-indigo-100
              bg-gradient-to-br
              from-indigo-50
              via-white
              to-violet-50
              p-6
              shadow-xl
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-2xl
            "
          >
            <div
              className="
                absolute
                -right-10
                -top-10
                h-32
                w-32
                rounded-full
                bg-indigo-200/40
                blur-2xl
              "
            />

            <div
              className="
                absolute
                -bottom-10
                -left-10
                h-28
                w-28
                rounded-full
                bg-violet-200/30
                blur-2xl
              "
            />

            <div className="relative">
              <div className="flex items-center gap-2">
                <div
                  className="
                    rounded-xl
                    bg-indigo-600
                    p-2.5
                    text-white
                    shadow-md
                    shadow-indigo-300
                    transition-transform
                    duration-300
                    hover:scale-110
                  "
                >
                  <Brain size={19} />
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-indigo-600
                    "
                  >
                    RetailIQ Insight
                  </p>

                  <h3 className="text-base font-bold text-slate-900">
                    AI Forecast Summary
                  </h3>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-bold text-slate-900">
                  {insight.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {insight.text}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div
                  className="
                    rounded-xl
                    border
                    border-white/80
                    bg-white/80
                    p-3
                    shadow-sm
                    backdrop-blur
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      text-slate-500
                    "
                  >
                    <Package size={14} />

                    Inventory action
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {totals.restock
                      ? `Plan for ${formatNumber(
                          totals.restock
                        )} additional units`
                      : "Current inventory looks sufficient"}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-white/80
                    bg-white/80
                    p-3
                    shadow-sm
                    backdrop-blur
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      text-slate-500
                    "
                  >
                    <Target size={14} />

                    Model confidence
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {totals.confidence == null
                      ? "Not provided by the forecast API"
                      : `${totals.confidence}% across selected products`}
                  </p>
                </div>
              </div>

              <button
                onClick={
                  handleGenerateRestock
                }
                className="
                  mt-6
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:bg-slate-800
                  hover:shadow-xl
                  active:scale-95
                "
              >
                <RefreshCw size={16} />

                Review Smart Restock
              </button>
            </div>
          </div>
        </section>

        {forecastError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {forecastError}
          </div>
        )}

        {/* =================================================
            PRODUCT FORECAST
        ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-white/50
            bg-white/90
            p-5
            shadow-xl
            backdrop-blur-xl
            transition-all
            duration-300
            hover:shadow-2xl
            sm:p-6
          "
        >
          <SectionHeader
            icon={Package}
            title="Product-wise Demand Forecast"
            subtitle="Predicted demand, stock coverage and recommended action"
          />

          {productForecasts.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-200
                bg-slate-50/50
                p-10
                text-center
              "
            >
              <Package
                className="mx-auto text-slate-300"
                size={32}
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No products match this category.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try selecting another category.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Product
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Current Stock
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Daily Demand
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Predicted Demand
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Stock Cover
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Restock
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Confidence
                      </th>

                      <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productForecasts.map(
                      (product) => (
                        <tr
                          key={
                            product.id ||
                            product.name
                          }
                          className="
                            border-b
                            border-slate-50
                            transition-all
                            duration-300
                            hover:bg-indigo-50/40
                          "
                        >
                          <td className="px-3 py-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {product.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {product.category}
                              </p>
                            </div>
                          </td>

                          <td className="px-3 py-4 text-sm font-semibold text-slate-700">
                            {formatNumber(
                              product.stock
                            )}
                          </td>

                          <td className="px-3 py-4 text-sm text-slate-600">
                            {product.dailyDemand.toFixed(
                              1
                            )}{" "}
                            / day
                          </td>

                          <td className="px-3 py-4">
                            <span className="text-sm font-bold text-indigo-600">
                              {formatNumber(
                                product.predictedDemand
                              )}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`
                                text-sm
                                font-semibold
                                ${
                                  product.daysUntilStockout <=
                                  3
                                    ? "text-rose-600"
                                    : product.daysUntilStockout <=
                                      10
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }
                              `}
                            >
                              {
                                product.daysUntilStockout
                              }{" "}
                              days
                            </span>
                          </td>

                          <td className="px-3 py-4 text-sm font-bold text-slate-800">
                            {product.recommendedStock
                              ? `+${product.recommendedStock}`
                              : "—"}
                          </td>

                          <td className="px-3 py-4">
                            <ConfidenceBadge
                              value={product.confidence}
                            />
                          </td>

                          <td className="px-3 py-4">
                            <RiskBadge
                              status={
                                product.status
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET CARDS */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  lg:hidden
                "
              >
                {productForecasts.map(
                  (product) => (
                    <div
                      key={
                        product.id ||
                        product.name
                      }
                      className="
                        group
                        rounded-2xl
                        border
                        border-white/60
                        bg-slate-50/70
                        p-4
                        shadow-sm
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
                            {product.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {product.category}
                          </p>
                        </div>

                        <RiskBadge
                          status={
                            product.status
                          }
                        />
                      </div>

                      <div
                        className="
                          mt-4
                          grid
                          grid-cols-2
                          gap-3
                          sm:grid-cols-4
                        "
                      >
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Stock
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatNumber(
                              product.stock
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Predicted
                          </p>

                          <p className="mt-1 text-sm font-bold text-indigo-600">
                            {formatNumber(
                              product.predictedDemand
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Stock Cover
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {
                              product.daysUntilStockout
                            }{" "}
                            days
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Restock
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {product.recommendedStock
                              ? `+${product.recommendedStock}`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ConfidenceBadge
                          value={
                            product.confidence
                          }
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </section>

        {/* =================================================
            BOTTOM ANALYTICS
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-6
            xl:grid-cols-2
          "
        >
          {/* TOP PRODUCTS */}

          <div
            className="
              rounded-2xl
              border
              border-white/50
              bg-white/90
              p-5
              shadow-xl
              backdrop-blur-xl
              transition-all
              duration-300
              hover:shadow-2xl
              sm:p-6
            "
          >
            <SectionHeader
              icon={TrendingUp}
              title="Top Predicted Products"
              subtitle="Products contributing most to expected demand"
            />

            <div className="space-y-4">
              {topProducts.map(
                (product) => (
                  <MiniBar
                    key={
                      product.id ||
                      product.name
                    }
                    label={product.name}
                    value={
                      product.predictedDemand
                    }
                    max={
                      topProducts[0]
                        ?.predictedDemand ||
                      1
                    }
                  />
                )
              )}
            </div>
          </div>

          {/* STOCK RISK */}

          <div
            className="
              rounded-2xl
              border
              border-white/50
              bg-white/90
              p-5
              shadow-xl
              backdrop-blur-xl
              transition-all
              duration-300
              hover:shadow-2xl
              sm:p-6
            "
          >
            <SectionHeader
              icon={TriangleAlert}
              title="Stock Risk Monitor"
              subtitle="Products with the shortest projected stock cover"
            />

            <div className="space-y-3">
              {[...productForecasts]
                .sort(
                  (a, b) =>
                    a.daysUntilStockout -
                    b.daysUntilStockout
                )
                .slice(0, 4)
                .map((product) => (
                  <div
                    key={
                      product.id ||
                      product.name
                    }
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      border-slate-100
                      bg-slate-50/70
                      px-4
                      py-3
                      transition-all
                      duration-300
                      hover:-translate-y-0.5
                      hover:bg-white
                      hover:shadow-md
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {product.stock} units
                        currently available
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`
                          text-sm
                          font-bold
                          ${
                            product.daysUntilStockout <=
                            3
                              ? "text-rose-600"
                              : product.daysUntilStockout <=
                                10
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        `}
                      >
                        {
                          product.daysUntilStockout
                        }{" "}
                        days
                      </p>

                      <p className="text-[10px] text-slate-400">
                        stock cover
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-2
            rounded-2xl
            border
            border-dashed
            border-white/60
            bg-white/70
            px-5
            py-4
            text-xs
            text-slate-500
            shadow-lg
            backdrop-blur-xl
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <span
            className="
              inline-flex
              items-center
              gap-2
            "
          >
            <Brain
              size={14}
              className="text-indigo-500"
            />

            Forecast values are provided by the backend ML service.
          </span>

          <span className="font-medium text-slate-400">
            RetailIQ • Demand Intelligence
          </span>
        </div>
      </div>
    </div>
  );
}