import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import StatCard from "../../assets/components/StatCard/StatCard.jsx";

function Dashboard({ products = [], sales = [] }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api("/api/dashboard");

        if (!cancelled) {
          setDashboardData(data?.dashboard || data || {});
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load dashboard:", err);
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // These values keep the existing dashboard UI useful while the API
  // response is being populated. No sample/mock values are introduced.
  const totalProducts =
    Number(
      dashboardData?.totalProducts ??
        dashboardData?.productsCount
    ) || products.length;

  const totalUnits = useMemo(() => {
    const apiUnits =
      dashboardData?.totalUnits ??
      dashboardData?.availableUnits ??
      dashboardData?.inventoryUnits;

    if (apiUnits !== undefined && apiUnits !== null) {
      return Number(apiUnits) || 0;
    }

    return products.reduce(
      (total, product) => total + Number(product.stock || 0),
      0
    );
  }, [dashboardData, products]);

  const lowStockProducts =
    Number(
      dashboardData?.lowStockProducts ??
        dashboardData?.lowStock ??
        dashboardData?.lowStockCount
    ) ||
    products.filter(
      (product) =>
        Number(product.stock || 0) > 0 &&
        Number(product.stock || 0) <=
          Number(product.lowStockThreshold || 5)
    ).length;

  const outOfStockProducts =
    Number(
      dashboardData?.outOfStockProducts ??
        dashboardData?.outOfStock ??
        dashboardData?.outOfStockCount
    ) ||
    products.filter(
      (product) => Number(product.stock || 0) === 0
    ).length;

  const totalRevenue =
    Number(
      dashboardData?.totalRevenue ??
        dashboardData?.totalSales ??
        dashboardData?.revenue
    ) ||
    sales.reduce(
      (total, sale) => total + Number(sale.total || 0),
      0
    );

  const totalTransactions =
    Number(
      dashboardData?.totalTransactions ??
        dashboardData?.totalOrders ??
        dashboardData?.orders ??
        dashboardData?.salesCount
    ) || sales.length;

  const totalEmployees =
    Number(
      dashboardData?.totalEmployees ??
        dashboardData?.employeeCount ??
        dashboardData?.employeesCount
    ) || 0;

  const salesOverview = Array.isArray(
    dashboardData?.salesOverview
  )
    ? dashboardData.salesOverview
    : Array.isArray(dashboardData?.salesByMonth)
      ? dashboardData.salesByMonth
      : [];

  const chartValues = salesOverview.map((item) =>
    Number(item?.value ?? item?.sales ?? item?.revenue ?? 0)
  );

  const chartLabels = salesOverview.map(
    (item) => item?.label ?? item?.month ?? ""
  );

  const maxChartValue = Math.max(...chartValues, 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* WELCOME */}
      <div className="mb-8">
        <h1
          className="
            text-2xl
            sm:text-3xl
            font-bold
            text-white
          "
        >
          Welcome to RetailIQ 👋
        </h1>

        <p className="text-white/70 mt-2">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* API ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="mb-6 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white/80">
          Loading dashboard data...
        </div>
      )}

      {/* STAT CARDS */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-4
          lg:gap-6
        "
      >
        <StatCard
          title="Total Sales"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          subtitle="Revenue from sales"
        />

        <StatCard
          title="Orders"
          value={totalTransactions}
          subtitle="Recorded transactions"
        />

        <StatCard
          title="Products"
          value={totalProducts}
          subtitle="Products in inventory"
        />

        <StatCard
          title="Employees"
          value={totalEmployees}
          subtitle="Registered staff"
        />
      </div>

      {/* DASHBOARD SECTIONS */}
      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-6
          mt-8
        "
      >
        {/* SALES OVERVIEW */}
        <div
          className="
            bg-white/90
            backdrop-blur-xl
            border border-white/40
            rounded-xl
            shadow-xl
            p-6
            transition-all
            duration-300
            hover:shadow-2xl
            hover:-translate-y-1
          "
        >
          <h2 className="text-xl font-bold text-gray-800">
            Sales Overview
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Current sales performance
          </p>

          {chartValues.length > 0 ? (
            <>
              <div
                className="
                  mt-6
                  h-48
                  flex
                  items-end
                  justify-around
                  gap-3
                "
              >
                {chartValues.map((value, index) => (
                  <div
                    key={`${chartLabels[index] || "bar"}-${index}`}
                    className="
                      bg-blue-400
                      w-8
                      sm:w-10
                      rounded-t-md
                      transition-all
                      duration-300
                      hover:bg-blue-600
                      hover:scale-105
                      cursor-pointer
                    "
                    style={{
                      height: `${Math.max(
                        8,
                        (value / maxChartValue) * 180
                      )}px`,
                    }}
                    title={`${chartLabels[index] || "Sales"}: ₹${value.toLocaleString(
                      "en-IN"
                    )}`}
                  />
                ))}
              </div>

              <div
                className="
                  flex
                  justify-around
                  text-sm
                  text-gray-500
                  mt-3
                "
              >
                {chartLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 h-48 flex items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
              No sales overview data available yet.
            </div>
          )}
        </div>

        {/* INVENTORY OVERVIEW */}
        <div
          className="
            bg-white/90
            backdrop-blur-xl
            border border-white/40
            rounded-xl
            shadow-xl
            p-6
            transition-all
            duration-300
            hover:shadow-2xl
            hover:-translate-y-1
          "
        >
          <h2 className="text-xl font-bold text-gray-800">
            Inventory Overview
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Current inventory status
          </p>

          <div
            className="
              grid
              grid-cols-2
              gap-4
              mt-6
            "
          >
            <div className="bg-blue-50 rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-blue-100 cursor-pointer">
              <p className="text-gray-500 text-sm">
                Total Products
              </p>
              <h3 className="text-2xl font-bold text-blue-600 mt-2">
                {totalProducts}
              </h3>
            </div>

            <div className="bg-yellow-50 rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-yellow-100 cursor-pointer">
              <p className="text-gray-500 text-sm">
                Low Stock
              </p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-2">
                {lowStockProducts}
              </h3>
            </div>

            <div className="bg-red-50 rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-red-100 cursor-pointer">
              <p className="text-gray-500 text-sm">
                Out of Stock
              </p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">
                {outOfStockProducts}
              </h3>
            </div>

            <div className="bg-green-50 rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-green-100 cursor-pointer">
              <p className="text-gray-500 text-sm">
                Available Units
              </p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">
                {totalUnits}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STORE SUMMARY */}
      <div
        className="
          mt-6
          bg-white/90
          backdrop-blur-xl
          border border-white/40
          rounded-xl
          shadow-xl
          p-5
          sm:p-6
          transition-all
          duration-300
          hover:shadow-2xl
        "
      >
        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Store Summary
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Live overview from your RetailIQ data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/80 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">
                Revenue
              </p>

              <p className="font-bold text-blue-600 mt-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="bg-emerald-50/80 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500">
                Units
              </p>

              <p className="font-bold text-emerald-600 mt-1">
                {totalUnits}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
