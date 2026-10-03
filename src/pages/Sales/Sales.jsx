import { useEffect, useMemo, useState } from "react";
import { api, toUiSale } from "../../api";

function Sales({ products, sales, setSales, updateProductStock }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState("All Payments");
  const [selectedDate, setSelectedDate] =
    useState("All Dates");
  const [chartRange, setChartRange] =
    useState("7 Days");

  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSale, setDeletingSale] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);

  const [newSale, setNewSale] = useState({
    product: "",
    quantity: 1,
    payment: "UPI",
  });

  const [loadingSales, setLoadingSales] = useState(false);
  const [salesError, setSalesError] = useState("");

  // ==================================================
  // LOAD SALES FROM BACKEND
  // ==================================================

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoadingSales(true);
        setSalesError("");

        const data = await api("/api/sales");

        const saleList = Array.isArray(data)
          ? data
          : data.sales || [];

        setSales(saleList.map(toUiSale));
      } catch (error) {
        console.error("Failed to load sales:", error);
        setSalesError(error.message || "Failed to load sales.");
      } finally {
        setLoadingSales(false);
      }
    };

    loadSales();
  }, [setSales]);

  // ==================================================
  // SELECTED PRODUCT
  // ==================================================

  const selectedProduct = products.find(
    (product) =>
      product.name ===
      newSale.product.replace(" (Out of Stock)", "")
  );

  const saleTotal =
    Number(newSale.quantity || 0) *
    (selectedProduct?.price || 0);

  // ==================================================
  // SALES STATISTICS
  // ==================================================

  const totalRevenue = sales.reduce(
    (total, sale) =>
      total + Number(sale.total || 0),
    0
  );

  const totalTransactions = sales.length;

  const totalItemsSold = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const averageSale =
    totalTransactions > 0
      ? Math.round(
          totalRevenue / totalTransactions
        )
      : 0;

  // ==================================================
  // PAYMENT TOTALS
  // ==================================================

  const paymentTotals = useMemo(() => {
    return ["UPI", "Cash", "Card"].map(
      (method) => ({
        method,

        amount: sales
          .filter(
            (sale) => sale.payment === method
          )
          .reduce(
            (sum, sale) =>
              sum + Number(sale.total || 0),
            0
          ),

        count: sales.filter(
          (sale) => sale.payment === method
        ).length,
      })
    );
  }, [sales]);

  // ==================================================
  // TOP PRODUCTS
  // ==================================================

  const topProducts = useMemo(() => {
    const map = {};

    sales.forEach((sale) => {
      if (!map[sale.product]) {
        map[sale.product] = {
          product: sale.product,
          units: 0,
          revenue: 0,
        };
      }

      map[sale.product].units +=
        Number(sale.quantity || 0);

      map[sale.product].revenue +=
        Number(sale.total || 0);
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  // ==================================================
  // CHART DATA
  // ==================================================

  const chartData = useMemo(() => {
    const days =
      chartRange === "30 Days"
        ? 30
        : chartRange === "14 Days"
        ? 14
        : 7;

    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);

      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - i);

      const label =
        date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });

      const revenue = sales
        .filter((sale) => {
          const parsed = parseSaleDate(sale.date);

          return (
            parsed &&
            parsed.toDateString() ===
              date.toDateString()
          );
        })
        .reduce(
          (sum, sale) =>
            sum + Number(sale.total || 0),
          0
        );

      result.push({
        label,
        revenue,
      });
    }

    return result;
  }, [sales, chartRange]);

  const chartMax = Math.max(
    ...chartData.map(
      (item) => item.revenue
    ),
    1
  );

  // ==================================================
  // FILTERED SALES
  // ==================================================

  const filteredSales = sales.filter((sale) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      String(sale.product)
        .toLowerCase()
        .includes(search) ||
      String(sale.id)
        .toLowerCase()
        .includes(search);

    const matchesPayment =
      selectedPayment === "All Payments" ||
      sale.payment === selectedPayment;

    const saleDate = parseSaleDate(
      sale.date
    );

    const now = new Date();

    const daysAgo = saleDate
      ? (now - saleDate) /
        (1000 * 60 * 60 * 24)
      : Infinity;

    const matchesDate =
      selectedDate === "All Dates" ||
      (selectedDate === "Today" &&
        saleDate?.toDateString() ===
          now.toDateString()) ||
      (selectedDate === "Last 7 Days" &&
        daysAgo >= 0 &&
        daysAgo <= 7) ||
      (selectedDate === "Last 30 Days" &&
        daysAgo >= 0 &&
        daysAgo <= 30);

    return (
      matchesSearch &&
      matchesPayment &&
      matchesDate
    );
  });

  // ==================================================
  // FORM
  // ==================================================

  const resetSaleForm = () => {
    setNewSale({
      product: "",
      quantity: 1,
      payment: "UPI",
    });

    setEditingSale(null);
  };

  const openAddSale = () => {
    resetSaleForm();
    setShowModal(true);
  };

  const openEditSale = (sale) => {
    setEditingSale(sale);

    setNewSale({
      product: sale.product,
      quantity: sale.quantity,
      payment: sale.payment,
    });

    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewSale((current) => ({
      ...current,
      [name]:
        name === "quantity"
          ? Number(value)
          : value,
    }));
  };

  // ==================================================
  // ADD / EDIT SALE
  // ==================================================

  const handleAddSale = async (e) => {
    e.preventDefault();

    if (editingSale) {
      alert(
        "Editing existing sales is not available in the current backend API. You can add new sales normally."
      );
      return;
    }

    if (!newSale.product) {
      alert("Please select a product.");
      return;
    }

    const quantity = Number(newSale.quantity);

    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (!selectedProduct) {
      alert("Product not found.");
      return;
    }

    const availableStock = Number(selectedProduct.stock || 0);

    if (quantity > availableStock) {
      alert(`Only ${availableStock} units are available.`);
      return;
    }

    try {
      const data = await api("/api/sales", {
        method: "POST",
        body: {
          productId: selectedProduct.id,
          quantitySold: quantity,
          salePrice: Number(selectedProduct.price || 0),
          paymentMethod: newSale.payment,
        },
      });

      const createdSale = data.sale || data;

      setSales((current) => [
        toUiSale(createdSale),
        ...current,
      ]);

      setShowModal(false);
      resetSaleForm();

      // The backend decrements stock atomically when the sale is created.
      // Refresh the product stock shown in the UI without changing it twice.
      window.dispatchEvent(new CustomEvent("retailiq:sale-created"));
    } catch (error) {
      console.error("Failed to create sale:", error);
      alert(error.message || "Failed to create sale.");
    }
  };

  // ==================================================
  // DELETE
  // ==================================================

  const confirmDelete = () => {
    if (!deletingSale) return;

    alert(
      "Deleting sales is not available in the current backend API because sales history is preserved for forecasting."
    );

    setDeletingSale(null);
    setShowDeleteModal(false);
  };

  // ==================================================
  // CLEAR FILTERS
  // ==================================================

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPayment("All Payments");
    setSelectedDate("All Dates");
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <>
      <style>{`
        @keyframes salesEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes salesCard {
          from {
            opacity: 0;
            transform: translateY(14px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes barGrow {
          from {
            height: 0;
          }
        }

        .sales-enter {
          animation: salesEnter .55s ease-out both;
        }

        .sales-card {
          animation: salesCard .5s ease-out both;
        }

        .sales-bar {
          animation: barGrow .65s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .sales-enter,
          .sales-card,
          .sales-bar {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="
          min-h-screen
          bg-transparent
          p-4
          sm:p-6
          lg:p-8
          sales-enter
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <header
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
            mb-7
          "
        >
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-white
                  drop-shadow-lg
                "
              >
                Sales Management
              </h1>

              <span
                className="
                  rounded-full
                  bg-blue-500/20
                  border
                  border-blue-300/20
                  px-3
                  py-1
                  text-xs
                  font-bold
                  text-blue-200
                  backdrop-blur-md
                "
              >
                RetailIQ
              </span>
            </div>

            <p
              className="
                mt-1
                text-sm
                text-white/65
              "
            >
              Track revenue, transactions and
              customer purchases in one place.
            </p>
          </div>

          <button
            onClick={openAddSale}
            className="
              w-full
              sm:w-auto
              rounded-xl
              bg-blue-600
              px-5
              py-3
              font-bold
              text-white
              shadow-lg
              shadow-blue-900/30
              border
              border-blue-400/30

              transition-all
              duration-300

              hover:-translate-y-1
              hover:bg-blue-500
              hover:shadow-xl

              active:scale-95
            "
          >
            + Add New Sale
          </button>
        </header>

        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <section
          className="
            grid
            grid-cols-2
            xl:grid-cols-4
            gap-3
            sm:gap-5
            mb-6
          "
        >
          <KpiCard
            icon="💰"
            label="Total Revenue"
            value={`₹${totalRevenue.toLocaleString(
              "en-IN"
            )}`}
            note="Across all recorded sales"
            accent="blue"
          />

          <KpiCard
            icon="🧾"
            label="Transactions"
            value={totalTransactions}
            note="Completed transactions"
            accent="emerald"
          />

          <KpiCard
            icon="📊"
            label="Average Sale"
            value={`₹${averageSale.toLocaleString(
              "en-IN"
            )}`}
            note="Average transaction value"
            accent="purple"
          />

          <KpiCard
            icon="🛍️"
            label="Items Sold"
            value={totalItemsSold}
            note="Total units sold"
            accent="amber"
          />
        </section>

        {/* ==================================================
            CHART + PAYMENT
        ================================================== */}

        <section
          className="
            grid
            grid-cols-1
            xl:grid-cols-3
            gap-5
            mb-6
          "
        >
          {/* SALES TREND */}

          <div
            className="
              xl:col-span-2

              bg-white/90
              backdrop-blur-xl

              rounded-2xl
              border
              border-white/50

              p-5
              sm:p-6

              shadow-xl

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
                gap-3
                mb-6
              "
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sales Trend
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Revenue generated over time
                </p>
              </div>

              <select
                value={chartRange}
                onChange={(e) =>
                  setChartRange(
                    e.target.value
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >
                <option>7 Days</option>
                <option>14 Days</option>
                <option>30 Days</option>
              </select>
            </div>

            <div
              className="
                h-64
                flex
                items-end
                gap-2
                sm:gap-3
                overflow-x-auto
                pb-7
              "
            >
              {chartData.map(
                (item, index) => {
                  const height = Math.max(
                    (item.revenue /
                      chartMax) *
                      100,
                    4
                  );

                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className="
                        group
                        flex
                        h-full
                        min-w-[30px]
                        flex-1
                        flex-col
                        justify-end
                        items-center
                      "
                    >
                      <div
                        className="
                          relative
                          mb-2
                          opacity-0
                          group-hover:opacity-100
                          transition
                        "
                      >
                        <span
                          className="
                            absolute
                            bottom-full
                            left-1/2
                            -translate-x-1/2
                            mb-2
                            whitespace-nowrap
                            rounded-lg
                            bg-slate-900
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            text-white
                          "
                        >
                          ₹
                          {item.revenue.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>

                      <div
                        className="
                          sales-bar
                          w-full
                          max-w-[42px]
                          rounded-t-lg
                          bg-gradient-to-t
                          from-blue-700
                          to-cyan-400
                          transition-all
                          duration-300
                          hover:from-blue-800
                          hover:to-cyan-300
                        "
                        style={{
                          height: `${height}%`,
                        }}
                      />

                      <span
                        className="
                          mt-2
                          text-[9px]
                          sm:text-[10px]
                          text-slate-400
                          whitespace-nowrap
                        "
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* PAYMENT BREAKDOWN */}

          <div
            className="
              bg-white/90
              backdrop-blur-xl

              rounded-2xl
              border
              border-white/50

              p-5
              sm:p-6

              shadow-xl

              transition-all
              duration-300

              hover:shadow-2xl
            "
          >
            <h2 className="text-lg font-bold text-slate-900">
              Payment Breakdown
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Revenue by payment method
            </p>

            <div className="space-y-5 mt-7">
              {paymentTotals.map(
                (item) => {
                  const percent =
                    totalRevenue
                      ? Math.round(
                          (item.amount /
                            totalRevenue) *
                            100
                        )
                      : 0;

                  const icon =
                    item.method === "UPI"
                      ? "📱"
                      : item.method === "Cash"
                      ? "💵"
                      : "💳";

                  return (
                    <div key={item.method}>
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          <span>{icon}</span>
                          {item.method}
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {percent}%
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-blue-600
                            transition-all
                            duration-700
                          "
                          style={{
                            width: `${percent}%`,
                          }}
                        />
                      </div>

                      <div
                        className="
                          flex
                          justify-between
                          mt-1
                          text-xs
                          text-slate-400
                        "
                      >
                        <span>
                          {item.count} transactions
                        </span>

                        <span>
                          ₹
                          {item.amount.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            TOP PRODUCTS + INSIGHT
        ================================================== */}

        <section
          className="
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-5
            mb-6
          "
        >
          {/* TOP PRODUCTS */}

          <div
            className="
              lg:col-span-2

              bg-white/90
              backdrop-blur-xl

              rounded-2xl
              border
              border-white/50

              p-5
              sm:p-6

              shadow-xl

              transition-all
              duration-300

              hover:shadow-2xl
            "
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Top-Selling Products
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Products generating the most revenue
                </p>
              </div>

              <span className="text-2xl">
                🏆
              </span>
            </div>

            {topProducts.length ? (
              <div className="space-y-3">
                {topProducts.map(
                  (item, index) => {
                    const share =
                      totalRevenue
                        ? Math.round(
                            (item.revenue /
                              totalRevenue) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={item.product}
                        className="
                          rounded-xl
                          border
                          border-slate-100
                          p-4

                          transition-all
                          duration-300

                          hover:border-blue-200
                          hover:bg-blue-50/50
                          hover:-translate-y-0.5
                        "
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-50
                              font-bold
                              text-blue-600
                            "
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className="
                                flex
                                flex-col
                                sm:flex-row
                                sm:justify-between
                                gap-1
                              "
                            >
                              <p className="truncate font-bold text-slate-800">
                                {item.product}
                              </p>

                              <p className="font-bold text-blue-600">
                                ₹
                                {item.revenue.toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>

                            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="
                                  h-full
                                  rounded-full
                                  bg-blue-500
                                  transition-all
                                  duration-700
                                "
                                style={{
                                  width: `${Math.max(
                                    share,
                                    3
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {item.units} units •{" "}
                              {share}% of revenue
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <EmptyState text="No product sales yet." />
            )}
          </div>

          {/* INSIGHT */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl

              bg-gradient-to-br
              from-slate-950
              via-blue-950
              to-blue-700

              p-6
              text-white

              shadow-xl
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
                bg-cyan-400/20
                blur-2xl
              "
            />

            <div className="relative">
              <span
                className="
                  inline-flex
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                  px-3
                  py-1
                  text-xs
                  font-bold
                "
              >
                ✨ RetailIQ Insight
              </span>

              <h2 className="mt-5 text-2xl font-bold">
                Your sales data is ready to power
                smarter decisions.
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100">
                Use your sales history with demand
                forecasting to identify products
                that may need restocking before
                demand increases.
              </p>

              <div
                className="
                  mt-7
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  p-4
                  backdrop-blur
                "
              >
                <p className="text-xs uppercase tracking-wider text-blue-200">
                  Current average transaction
                </p>

                <p className="mt-1 text-2xl font-bold">
                  ₹
                  {averageSale.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <section
          className="
            bg-white/90
            backdrop-blur-xl

            rounded-2xl
            border
            border-white/50

            p-4
            sm:p-5

            shadow-xl

            mb-5
          "
        >
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            "
          >
            <div className="relative">
              <span
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              >
                🔍
              </span>

              <input
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search product or invoice..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80

                  py-3
                  pl-10
                  pr-4

                  text-sm
                  outline-none

                  transition

                  focus:bg-white
                  focus:ring-2
                  focus:ring-blue-500
                "
              />
            </div>

            <select
              value={selectedPayment}
              onChange={(e) =>
                setSelectedPayment(
                  e.target.value
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50/80
                p-3
                text-sm
                font-medium
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            >
              <option>All Payments</option>
              <option>UPI</option>
              <option>Cash</option>
              <option>Card</option>
            </select>

            <select
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(
                  e.target.value
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50/80
                p-3
                text-sm
                font-medium
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            >
              <option>All Dates</option>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </section>

        {salesError && (
          <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {salesError}
          </div>
        )}

        {/* RESULTS */}

        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <p className="text-sm text-white/70">
            {loadingSales
              ? "Loading sales..."
              : (
                <>
                  Showing{" "}
                  <span className="font-bold text-white">
                    {filteredSales.length}
                  </span>{" "}
                  sales
                </>
              )}
          </p>

          {(searchTerm ||
            selectedPayment !==
              "All Payments" ||
            selectedDate !==
              "All Dates") && (
            <button
              onClick={clearFilters}
              className="
                text-xs
                font-bold
                text-blue-300
                hover:text-blue-200
                hover:underline
              "
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ==================================================
            DESKTOP TABLE
        ================================================== */}

        <div
          className="
            hidden
            lg:block
            overflow-hidden

            rounded-2xl

            border
            border-white/50

            bg-white/90
            backdrop-blur-xl

            shadow-xl
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead
                className="
                  bg-slate-50/90
                  border-b
                  border-slate-200
                "
              >
                <tr>
                  {[
                    "Invoice",
                    "Product",
                    "Quantity",
                    "Unit Price",
                    "Total",
                    "Payment",
                    "Date",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="
                        p-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                      "
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredSales.length ? (
                  filteredSales.map(
                    (sale) => (
                      <SaleRow
                        key={sale.id}
                        sale={sale}
                        onView={() =>
                          setViewingSale(
                            sale
                          )
                        }
                        onEdit={() =>
                          openEditSale(
                            sale
                          )
                        }
                        onDelete={() => {
                          setDeletingSale(
                            sale
                          );
                          setShowDeleteModal(
                            true
                          );
                        }}
                      />
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-16"
                    >
                      <EmptyState text="No sales match your current filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================================================
            MOBILE
        ================================================== */}

        <div
          className="
            grid
            lg:hidden
            grid-cols-1
            sm:grid-cols-2
            gap-4
          "
        >
          {filteredSales.length ? (
            filteredSales.map(
              (sale) => (
                <MobileSaleCard
                  key={sale.id}
                  sale={sale}
                  onView={() =>
                    setViewingSale(
                      sale
                    )
                  }
                  onEdit={() =>
                    openEditSale(
                      sale
                    )
                  }
                  onDelete={() => {
                    setDeletingSale(
                      sale
                    );
                    setShowDeleteModal(
                      true
                    );
                  }}
                />
              )
            )
          ) : (
            <div
              className="
                sm:col-span-2

                rounded-2xl

                border
                border-white/50

                bg-white/90
                backdrop-blur-xl

                p-12

                shadow-xl
              "
            >
              <EmptyState text="No sales match your current filters." />
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showModal && (
        <ModalOverlay>
          <div
            className="
              w-full
              max-w-lg

              rounded-3xl

              bg-slate-950/95
              backdrop-blur-2xl

              border
              border-white/10

              p-5
              sm:p-7

              text-white

              shadow-2xl
            "
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {editingSale
                    ? "Edit Sale ✏️"
                    : "Add New Sale 🛍️"}
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  {editingSale
                    ? "Editing is currently unavailable because the backend exposes sales creation only."
                    : "Record a new customer transaction."}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetSaleForm();
                }}
                className="
                  h-9
                  w-9
                  rounded-xl
                  bg-white/10
                  text-xl
                  text-white/60

                  hover:bg-red-500/20
                  hover:text-red-300

                  transition
                "
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddSale}
              className="space-y-5"
            >
              <FormSelect
                label="Product"
                name="product"
                value={newSale.product}
                onChange={handleInputChange}
                options={products.map(
                  (product) =>
                    product.stock > 0
                      ? product.name
                      : `${product.name} (Out of Stock)`
                )}
              />

              {selectedProduct && (
                <div
                  className="
                    grid
                    grid-cols-2
                    gap-4

                    rounded-xl
                    border
                    border-blue-400/20

                    bg-blue-500/10

                    p-4
                  "
                >
                  <div>
                    <p className="text-xs text-blue-300">
                      Available Stock
                    </p>

                    <p className="mt-1 font-bold text-white">
                      {selectedProduct.stock} units
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-blue-300">
                      Unit Price
                    </p>

                    <p className="mt-1 font-bold text-white">
                      ₹
                      {selectedProduct.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>
              )}

              <FormInput
                label="Quantity"
                name="quantity"
                type="number"
                value={newSale.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
              />

              <FormSelect
                label="Payment Method"
                name="payment"
                value={newSale.payment}
                onChange={handleInputChange}
                options={[
                  "UPI",
                  "Cash",
                  "Card",
                ]}
              />

              <div
                className="
                  flex
                  items-center
                  justify-between

                  rounded-2xl

                  border
                  border-white/10

                  bg-white/5

                  p-5
                "
              >
                <div>
                  <p className="text-sm text-white/60">
                    Total Amount
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Quantity × Unit Price
                  </p>
                </div>

                <p className="text-2xl font-bold text-blue-400">
                  ₹
                  {saleTotal.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetSaleForm();
                  }}
                  className="
                    flex-1
                    rounded-xl

                    border
                    border-white/10

                    py-3

                    font-bold
                    text-white/70

                    hover:bg-white/10

                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={Boolean(editingSale)}
                  className="
                    flex-1
                    rounded-xl
                    bg-blue-600
                    py-3
                    font-bold
                    text-white

                    shadow-lg
                    shadow-blue-900/30

                    hover:bg-blue-500
                    disabled:cursor-not-allowed
                    disabled:opacity-50

                    transition
                  "
                >
                  {editingSale
                    ? "Editing Unavailable"
                    : "Add Sale"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ==================================================
          VIEW INVOICE
      ================================================== */}

      {viewingSale && (
        <ModalOverlay>
          <div
            className="
              w-full
              max-w-md

              rounded-3xl

              bg-slate-950/95
              backdrop-blur-2xl

              border
              border-white/10

              p-6
              sm:p-8

              text-white

              shadow-2xl
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  RetailIQ Invoice
                </span>

                <h2 className="mt-1 text-2xl font-bold">
                  #{viewingSale.id}
                </h2>
              </div>

              <button
                onClick={() =>
                  setViewingSale(null)
                }
                className="
                  h-9
                  w-9
                  rounded-xl
                  bg-white/10
                  text-xl
                  text-white/60

                  hover:bg-red-500/20
                  hover:text-red-300
                "
              >
                ×
              </button>
            </div>

            <div
              className="
                mt-6
                rounded-2xl
                bg-white/5
                border
                border-white/10
                p-5
              "
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs text-white/40">
                    Product
                  </p>

                  <p className="mt-1 font-bold text-white">
                    {viewingSale.product}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/40">
                    Date
                  </p>

                  <p className="mt-1 font-semibold text-white/80">
                    {viewingSale.date}
                  </p>
                </div>
              </div>

              <div className="my-5 border-t border-white/10" />

              <div className="space-y-3 text-sm">
                <InvoiceLine
                  label="Quantity"
                  value={viewingSale.quantity}
                />

                <InvoiceLine
                  label="Unit Price"
                  value={`₹${viewingSale.price.toLocaleString(
                    "en-IN"
                  )}`}
                />

                <InvoiceLine
                  label="Payment"
                  value={viewingSale.payment}
                />

                <div
                  className="
                    flex
                    justify-between
                    border-t
                    border-white/10
                    pt-4
                  "
                >
                  <span className="font-bold">
                    Total
                  </span>

                  <span className="text-xl font-bold text-blue-400">
                    ₹
                    {viewingSale.total.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setViewingSale(null)
              }
              className="
                mt-5
                w-full
                rounded-xl
                bg-white/10
                border
                border-white/10
                py-3
                font-bold
                text-white

                hover:bg-white/15

                transition
              "
            >
              Close Invoice
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {showDeleteModal &&
        deletingSale && (
          <ModalOverlay>
            <div
              className="
                w-full
                max-w-md

                rounded-3xl

                bg-slate-950/95
                backdrop-blur-2xl

                border
                border-white/10

                p-6
                sm:p-8

                text-center
                text-white

                shadow-2xl
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center

                  rounded-2xl

                  bg-red-500/10
                  border
                  border-red-500/20

                  text-3xl
                "
              >
                🗑️
              </div>

              <h2 className="mt-5 text-xl sm:text-2xl font-bold">
                Delete Sale?
              </h2>

              <p className="mt-3 text-sm text-white/60">
                You're about to delete sale{" "}
                <span className="font-bold text-white">
                  #{deletingSale.id}
                </span>
                .
              </p>

              <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setDeletingSale(null);
                    setShowDeleteModal(false);
                  }}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-white/10
                    py-3
                    font-bold
                    text-white/70
                    hover:bg-white/10
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="
                    flex-1
                    rounded-xl
                    bg-red-600
                    py-3
                    font-bold
                    text-white
                    hover:bg-red-500
                    transition
                  "
                >
                  Delete Sale
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
    </>
  );
}

// ==================================================
// KPI CARD
// ==================================================

function KpiCard({
  icon,
  label,
  value,
  note,
  accent,
}) {
  const accents = {
    blue: "bg-blue-50 text-blue-600",
    emerald:
      "bg-emerald-50 text-emerald-600",
    purple:
      "bg-purple-50 text-purple-600",
    amber:
      "bg-amber-50 text-amber-600",
  };

  return (
    <div
      className="
        sales-card

        rounded-2xl

        border
        border-white/50

        bg-white/90
        backdrop-blur-xl

        p-4
        sm:p-5

        shadow-xl

        transition-all
        duration-300

        hover:-translate-y-2
        hover:shadow-2xl
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {label}
          </p>

          <h2
            className="
              mt-2
              text-xl
              sm:text-3xl
              font-bold
              text-slate-900
              truncate
            "
          >
            {value}
          </h2>
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            sm:h-11
            sm:w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-lg
            ${accents[accent]}
          `}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {note}
      </p>
    </div>
  );
}

// ==================================================
// SALE ROW
// ==================================================

function SaleRow({
  sale,
  onView,
  onEdit,
  onDelete,
}) {
  const paymentStyle =
    getPaymentStyle(sale.payment);

  return (
    <tr
      className="
        border-b
        border-slate-100
        last:border-0

        hover:bg-blue-50/50

        transition-all
        duration-300
      "
    >
      <td className="p-4">
        <button
          onClick={onView}
          className="
            flex
            items-center
            gap-3
            text-left
          "
        >
          <span
            className="
              flex
              h-10
              w-10
              items-center
              justify-center

              rounded-xl

              bg-blue-50
              border
              border-blue-100
            "
          >
            🧾
          </span>

          <span>
            <span className="block font-bold text-slate-800 hover:text-blue-600">
              #{sale.id}
            </span>

            <span className="text-xs text-slate-400">
              View invoice
            </span>
          </span>
        </button>
      </td>

      <td className="p-4 font-semibold text-slate-800">
        {sale.product}
      </td>

      <td className="p-4 text-sm text-slate-600">
        {sale.quantity} units
      </td>

      <td className="p-4 font-semibold text-slate-800">
        ₹
        {sale.price.toLocaleString(
          "en-IN"
        )}
      </td>

      <td className="p-4 font-bold text-blue-600">
        ₹
        {sale.total.toLocaleString(
          "en-IN"
        )}
      </td>

      <td className="p-4">
        <span
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-full
            border
            px-3
            py-1.5
            text-xs
            font-bold
            ${paymentStyle.className}
          `}
        >
          {paymentStyle.icon}{" "}
          {sale.payment}
        </span>
      </td>

      <td className="p-4 text-sm text-slate-500">
        {sale.date}
      </td>

      <td className="p-4">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="
              rounded-lg
              bg-blue-50
              px-3
              py-2
              text-sm
              font-bold
              text-blue-600
              hover:bg-blue-100
              transition
            "
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="
              rounded-lg
              bg-red-50
              px-3
              py-2
              text-sm
              font-bold
              text-red-500
              hover:bg-red-100
              transition
            "
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ==================================================
// MOBILE SALE CARD
// ==================================================

function MobileSaleCard({
  sale,
  onView,
  onEdit,
  onDelete,
}) {
  const paymentStyle =
    getPaymentStyle(sale.payment);

  return (
    <div
      className="
        sales-card

        rounded-2xl

        border
        border-white/50

        bg-white/90
        backdrop-blur-xl

        p-5

        shadow-xl

        transition-all
        duration-300

        hover:-translate-y-2
        hover:shadow-2xl
      "
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onView}
          className="
            flex
            min-w-0
            items-center
            gap-3
            text-left
          "
        >
          <span
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-xl
            "
          >
            🛍️
          </span>

          <span className="min-w-0">
            <span className="block truncate font-bold text-slate-800">
              {sale.product}
            </span>

            <span className="text-xs text-slate-400">
              Invoice #{sale.id}
            </span>
          </span>
        </button>

        <span
          className="
            rounded-full
            border
            border-emerald-100
            bg-emerald-50
            px-2.5
            py-1
            text-xs
            font-bold
            text-emerald-600
          "
        >
          Completed
        </span>
      </div>

      <div
        className="
          grid
          grid-cols-2
          gap-4
          border-y
          border-slate-100
          py-4
          mt-5
        "
      >
        <div>
          <p className="text-xs text-slate-400">
            Quantity
          </p>

          <p className="mt-1 font-bold text-slate-800">
            {sale.quantity} units
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Unit Price
          </p>

          <p className="mt-1 font-bold text-slate-800">
            ₹
            {sale.price.toLocaleString(
              "en-IN"
            )}
          </p>
        </div>
      </div>

      <div
        className="
          flex
          items-end
          justify-between
          gap-3
          mt-4
        "
      >
        <div>
          <p className="text-xs text-slate-400">
            Total Amount
          </p>

          <p className="mt-1 text-xl font-bold text-blue-600">
            ₹
            {sale.total.toLocaleString(
              "en-IN"
            )}
          </p>
        </div>

        <div className="text-right">
          <span
            className={`
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              px-3
              py-1.5
              text-xs
              font-bold
              ${paymentStyle.className}
            `}
          >
            {paymentStyle.icon}{" "}
            {sale.payment}
          </span>

          <p className="mt-2 text-xs text-slate-400">
            {sale.date}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <button
          onClick={onView}
          className="
            rounded-xl
            bg-slate-100
            py-2.5
            text-sm
            font-bold
            text-slate-700
            hover:bg-slate-200
            transition
          "
        >
          View
        </button>

        <button
          onClick={onEdit}
          className="
            rounded-xl
            bg-blue-50
            py-2.5
            text-sm
            font-bold
            text-blue-600
            hover:bg-blue-100
            transition
          "
        >
          Edit
        </button>

        <button
          onClick={onDelete}
          className="
            rounded-xl
            bg-red-50
            py-2.5
            text-sm
            font-bold
            text-red-500
            hover:bg-red-100
            transition
          "
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ==================================================
// PAYMENT STYLE
// ==================================================

function getPaymentStyle(payment) {
  if (payment === "UPI") {
    return {
      className:
        "bg-blue-50 text-blue-600 border-blue-100",
      icon: "📱",
    };
  }

  if (payment === "Cash") {
    return {
      className:
        "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: "💵",
    };
  }

  return {
    className:
      "bg-purple-50 text-purple-600 border-purple-100",
    icon: "💳",
  };
}

// ==================================================
// MODAL OVERLAY
// ==================================================

function ModalOverlay({ children }) {
  return (
    <div
      className="
        fixed
        inset-0
        z-50

        flex
        items-center
        justify-center

        bg-slate-950/60
        backdrop-blur-md

        p-4
      "
    >
      <div
        className="
          max-h-[92vh]
          w-full
          overflow-y-auto
        "
      >
        {children}
      </div>
    </div>
  );
}

// ==================================================
// FORM INPUT
// ==================================================

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-white/80
        "
      >
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={
          type === "number"
            ? "1"
            : undefined
        }
        className="
          w-full

          rounded-xl

          border
          border-white/10

          bg-white/5

          p-3

          text-sm
          text-white

          placeholder:text-white/30

          outline-none

          transition

          focus:bg-white/10
          focus:ring-2
          focus:ring-blue-500
        "
      />
    </div>
  );
}

// ==================================================
// FORM SELECT
// ==================================================

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-white/80
        "
      >
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full

          cursor-pointer

          rounded-xl

          border
          border-white/10

          bg-slate-900

          p-3

          text-sm
          text-white

          outline-none

          transition

          focus:ring-2
          focus:ring-blue-500
        "
      >
        <option
          value=""
          className="bg-slate-900"
        >
          Select {label}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-slate-900"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// ==================================================
// INVOICE LINE
// ==================================================

function InvoiceLine({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">
        {label}
      </span>

      <span className="font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

// ==================================================
// EMPTY STATE
// ==================================================

function EmptyState({ text }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-3">
        🧾
      </div>

      <h3 className="font-bold text-slate-800">
        No sales found
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

// ==================================================
// DATE PARSER
// ==================================================

function parseSaleDate(dateString) {
  if (!dateString) return null;

  const [
    day,
    monthText,
    year,
  ] = String(dateString).split(" ");

  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const date = new Date(
    Number(year),
    monthMap[monthText] ?? 0,
    Number(day)
  );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

export default Sales;