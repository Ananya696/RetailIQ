import { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Boxes,
  AlertTriangle,
  Sparkles,
  Receipt,
  Activity,
  ArrowUpRight,
  CircleDollarSign,
} from "lucide-react";

function Analytics({ sales = [], products = [] }) {
  // =========================================
  // BASIC METRICS
  // =========================================

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const totalTransactions = sales.length;

  const totalItemsSold = sales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0),
    0
  );

  const averageSale =
    totalTransactions > 0
      ? Math.round(totalRevenue / totalTransactions)
      : 0;

  // =========================================
  // PRODUCT PERFORMANCE
  // =========================================

  const productPerformance = useMemo(() => {
    const map = {};

    sales.forEach((sale) => {
      const name = sale.product;

      if (!map[name]) {
        map[name] = {
          name,
          units: 0,
          revenue: 0,
        };
      }

      map[name].units += Number(sale.quantity || 0);
      map[name].revenue += Number(sale.total || 0);
    });

    return Object.values(map).sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [sales]);

  const topProducts = productPerformance.slice(0, 5);

  const bestProduct = topProducts[0];

  const maxProductRevenue =
    topProducts.length > 0
      ? Math.max(...topProducts.map((item) => item.revenue))
      : 0;

  // =========================================
  // PAYMENT BREAKDOWN
  // =========================================

  const paymentBreakdown = useMemo(() => {
    const methods = {
      UPI: 0,
      Cash: 0,
      Card: 0,
    };

    sales.forEach((sale) => {
      if (methods[sale.payment] !== undefined) {
        methods[sale.payment] += Number(sale.total || 0);
      }
    });

    return Object.entries(methods).map(
      ([method, revenue]) => ({
        method,
        revenue,
        percentage:
          totalRevenue > 0
            ? Math.round((revenue / totalRevenue) * 100)
            : 0,
      })
    );
  }, [sales, totalRevenue]);

  // =========================================
  // INVENTORY METRICS
  // =========================================

  const inventoryMetrics = useMemo(() => {
    const totalProducts = products.length;

    const inStock = products.filter(
      (product) => product.stock > 5
    ).length;

    const lowStock = products.filter(
      (product) =>
        product.stock > 0 && product.stock <= 5
    ).length;

    const outOfStock = products.filter(
      (product) => product.stock === 0
    ).length;

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        Number(product.price || 0) *
          Number(product.stock || 0),
      0
    );

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      inventoryValue,
    };
  }, [products]);

  // =========================================
  // SIMPLE SALES TREND
  // =========================================

  const salesByDate = useMemo(() => {
    const map = {};

    sales.forEach((sale) => {
      const date = sale.date || "Unknown";

      if (!map[date]) {
        map[date] = {
          date,
          revenue: 0,
          orders: 0,
        };
      }

      map[date].revenue += Number(sale.total || 0);
      map[date].orders += 1;
    });

    return Object.values(map)
      .reverse()
      .slice(-7);
  }, [sales]);

  const maxDailyRevenue =
    salesByDate.length > 0
      ? Math.max(
          ...salesByDate.map((item) => item.revenue)
        )
      : 0;

  // =========================================
  // RETURN
  // =========================================

  return (
    <div className="retailiq-app min-h-screen p-4 sm:p-6 lg:p-8 text-white">

      {/* =========================================
          HERO HEADER
      ========================================= */}

      <div className="
        relative
        overflow-hidden
        rounded-3xl
        mb-7
        border border-white/10
        bg-slate-950/55
        backdrop-blur-2xl
        shadow-2xl shadow-black/20
      ">

        {/* Background glows */}

        <div className="
          absolute
          -top-28
          -right-20
          w-80 h-80
          rounded-full
          bg-blue-500/20
          blur-3xl
          pointer-events-none
        " />

        <div className="
          absolute
          -bottom-32
          left-10
          w-72 h-72
          rounded-full
          bg-violet-500/15
          blur-3xl
          pointer-events-none
        " />

        <div className="
          relative
          p-6 sm:p-8
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-6
        ">

          <div>

            <div className="flex flex-wrap items-center gap-3 mb-3">

              <div className="
                w-11 h-11
                rounded-2xl
                bg-blue-500/15
                border border-blue-400/20
                flex items-center justify-center
              ">
                <BarChart3 className="w-5 h-5 text-blue-300" />
              </div>

              <span className="
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
              ">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                BUSINESS INTELLIGENCE
              </span>

            </div>

            <h1 className="
              text-3xl
              sm:text-4xl
              font-bold
              tracking-tight
            ">
              Analytics
            </h1>

            <p className="
              text-white/55
              mt-2
              max-w-2xl
              text-sm sm:text-base
            ">
              Turn your sales and inventory data into clear,
              actionable business insights.
            </p>

          </div>

          {/* Total sales badge */}

          <div className="
            min-w-[190px]
            rounded-2xl
            bg-white/5
            border border-white/10
            backdrop-blur-xl
            p-4
            shadow-lg
          ">

            <div className="flex items-center gap-2 mb-2">

              <div className="
                w-8 h-8
                rounded-lg
                bg-emerald-500/10
                border border-emerald-400/10
                flex items-center justify-center
              ">
                <Receipt className="w-4 h-4 text-emerald-300" />
              </div>

              <p className="text-xs text-white/40">
                Total Sales Recorded
              </p>

            </div>

            <p className="text-2xl font-bold text-white">
              {totalTransactions}
            </p>

            <p className="text-xs text-emerald-300/70 mt-1">
              Completed transactions
            </p>

          </div>

        </div>
      </div>

      {/* =========================================
          KPI CARDS
      ========================================= */}

      <div className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-3 sm:gap-5
        mb-6
      ">

        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          subtitle="Revenue from all sales"
          icon={<CircleDollarSign className="w-5 h-5" />}
          iconStyle="bg-blue-500/15 text-blue-300 border-blue-400/20"
          valueStyle="text-blue-700"
        />

        <MetricCard
          title="Transactions"
          value={totalTransactions}
          subtitle="Completed sales"
          icon={<Receipt className="w-5 h-5" />}
          iconStyle="bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
          valueStyle="text-emerald-700"
        />

        <MetricCard
          title="Items Sold"
          value={totalItemsSold}
          subtitle="Total units sold"
          icon={<Package className="w-5 h-5" />}
          iconStyle="bg-amber-500/15 text-amber-300 border-amber-400/20"
          valueStyle="text-amber-700"
        />

        <MetricCard
          title="Average Sale"
          value={`₹${averageSale.toLocaleString("en-IN")}`}
          subtitle="Average transaction value"
          icon={<TrendingUp className="w-5 h-5" />}
          iconStyle="bg-violet-500/15 text-violet-300 border-violet-400/20"
          valueStyle="text-violet-700"
        />

      </div>

      {/* =========================================
          SALES TREND + PAYMENT BREAKDOWN
      ========================================= */}

      <div className="
        grid
        grid-cols-1
        xl:grid-cols-2
        gap-6
        mb-6
      ">

        {/* SALES TREND */}

        <section className="
          bg-slate-950/55
          backdrop-blur-2xl
          border border-white/10
          rounded-3xl
          shadow-xl shadow-black/15
          p-5 sm:p-6
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-3
            mb-6
          ">

            <div>

              <div className="flex items-center gap-2">

                <div className="
                  w-9 h-9
                  rounded-xl
                  bg-blue-500/10
                  border border-blue-400/10
                  flex items-center justify-center
                ">
                  <Activity className="w-4 h-4 text-blue-300" />
                </div>

                <h2 className="
                  text-lg sm:text-xl
                  font-bold
                  text-white
                ">
                  Sales Trend
                </h2>

              </div>

              <p className="text-sm text-white/40 mt-2">
                Recent revenue performance
              </p>

            </div>

            <span className="
              text-xs
              font-semibold
              bg-blue-500/10
              text-blue-300
              border border-blue-400/10
              px-3 py-1.5
              rounded-full
            ">
              Last 7 records
            </span>

          </div>

          {salesByDate.length > 0 ? (

            <div className="space-y-5">

              {salesByDate.map((item, index) => (

                <div
                  key={`${item.date}-${index}`}
                  className="group"
                >

                  <div className="
                    flex
                    justify-between
                    items-center
                    text-xs sm:text-sm
                    mb-2
                  ">

                    <span className="text-white/45">
                      {item.date}
                    </span>

                    <span className="
                      font-semibold
                      text-white/80
                    ">
                      ₹{item.revenue.toLocaleString("en-IN")}
                    </span>

                  </div>

                  <div className="
                    h-2.5
                    bg-white/5
                    rounded-full
                    overflow-hidden
                    border border-white/[0.04]
                  ">

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-blue-500
                        to-cyan-400
                        transition-all
                        duration-700
                      "
                      style={{
                        width:
                          maxDailyRevenue > 0
                            ? `${Math.max(
                                (item.revenue /
                                  maxDailyRevenue) *
                                  100,
                                4
                              )}%`
                            : "0%",
                      }}
                    />

                  </div>

                  <div className="
                    flex
                    items-center
                    justify-between
                    mt-1.5
                  ">

                    <p className="text-[11px] text-white/30">
                      {item.orders} transaction
                      {item.orders !== 1 ? "s" : ""}
                    </p>

                    <ArrowUpRight className="
                      w-3.5 h-3.5
                      text-white/20
                      group-hover:text-blue-300
                      transition-colors
                    " />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <EmptyState text="No sales data available yet." />

          )}

        </section>

        {/* PAYMENT BREAKDOWN */}

        <section className="
          bg-slate-950/55
          backdrop-blur-2xl
          border border-white/10
          rounded-3xl
          shadow-xl shadow-black/15
          p-5 sm:p-6
        ">

          <div className="mb-6">

            <div className="flex items-center gap-2">

              <div className="
                w-9 h-9
                rounded-xl
                bg-violet-500/10
                border border-violet-400/10
                flex items-center justify-center
              ">
                <Wallet className="w-4 h-4 text-violet-300" />
              </div>

              <h2 className="
                text-lg sm:text-xl
                font-bold
                text-white
              ">
                Payment Breakdown
              </h2>

            </div>

            <p className="text-sm text-white/40 mt-2">
              Revenue distribution by payment method
            </p>

          </div>

          <div className="space-y-6">

            {paymentBreakdown.map((item) => (

              <div key={item.method}>

                <div className="
                  flex
                  justify-between
                  items-center
                  mb-2
                ">

                  <div className="flex items-center gap-3">

                    <PaymentIcon method={item.method} />

                    <div>
                      <span className="
                        font-semibold
                        text-white/80
                      ">
                        {item.method}
                      </span>

                      <p className="text-[11px] text-white/30">
                        Payment revenue
                      </p>
                    </div>

                  </div>

                  <div className="text-right">

                    <span className="
                      font-bold
                      text-white/85
                    ">
                      ₹{item.revenue.toLocaleString("en-IN")}
                    </span>

                    <span className="
                      text-xs
                      text-white/35
                      ml-2
                    ">
                      {item.percentage}%
                    </span>

                  </div>

                </div>

                <div className="
                  h-3
                  bg-white/5
                  rounded-full
                  overflow-hidden
                  border border-white/[0.04]
                ">

                  <div
                    className={`
                      h-full
                      rounded-full
                      transition-all
                      duration-700
                      ${
                        item.method === "UPI"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                          : item.method === "Cash"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-violet-500 to-fuchsia-400"
                      }
                    `}
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </section>

      </div>

      {/* =========================================
          TOP PRODUCTS + INVENTORY
      ========================================= */}

      <div className="
        grid
        grid-cols-1
        xl:grid-cols-2
        gap-6
      ">

        {/* TOP PRODUCTS */}

        <section className="
          bg-slate-950/55
          backdrop-blur-2xl
          border border-white/10
          rounded-3xl
          shadow-xl shadow-black/15
          p-5 sm:p-6
        ">

          <div className="
            flex
            items-center
            justify-between
            mb-6
          ">

            <div>

              <div className="flex items-center gap-2">

                <div className="
                  w-9 h-9
                  rounded-xl
                  bg-amber-500/10
                  border border-amber-400/10
                  flex items-center justify-center
                ">
                  <ShoppingCart className="w-4 h-4 text-amber-300" />
                </div>

                <h2 className="
                  text-lg sm:text-xl
                  font-bold
                  text-white
                ">
                  Top Products
                </h2>

              </div>

              <p className="text-sm text-white/40 mt-2">
                Best-performing products by revenue
              </p>

            </div>

            <div className="
              w-10 h-10
              rounded-xl
              bg-amber-500/10
              border border-amber-400/10
              flex items-center justify-center
            ">
              🏆
            </div>

          </div>

          {topProducts.length > 0 ? (

            <div className="space-y-3">

              {topProducts.map((product, index) => (

                <div
                  key={product.name}
                  className="
                    group
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-2xl
                    bg-white/[0.025]
                    border border-transparent
                    hover:bg-white/[0.05]
                    hover:border-white/10
                    transition-all
                  "
                >

                  <div className={`
                    w-9 h-9
                    shrink-0
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-sm
                    ${
                      index === 0
                        ? "bg-amber-500/15 text-amber-300 border border-amber-400/15"
                        : "bg-blue-500/10 text-blue-300 border border-blue-400/10"
                    }
                  `}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="
                      flex
                      justify-between
                      gap-3
                    ">

                      <p className="
                        font-semibold
                        text-white/85
                        truncate
                      ">
                        {product.name}
                      </p>

                      <p className="
                        font-bold
                        text-blue-300
                        whitespace-nowrap
                      ">
                        ₹{product.revenue.toLocaleString("en-IN")}
                      </p>

                    </div>

                    <div className="
                      flex
                      justify-between
                      text-xs
                      text-white/30
                      mt-1
                    ">

                      <span>
                        {product.units} units sold
                      </span>

                      <span>
                        {maxProductRevenue > 0
                          ? Math.round(
                              (product.revenue /
                                maxProductRevenue) *
                                100
                            )
                          : 0}
                        %
                      </span>

                    </div>

                    <div className="
                      h-1.5
                      bg-white/5
                      rounded-full
                      mt-2
                      overflow-hidden
                    ">

                      <div
                        className="
                          h-full
                          bg-gradient-to-r
                          from-blue-500
                          to-violet-500
                          rounded-full
                          transition-all
                          duration-700
                        "
                        style={{
                          width: `${
                            maxProductRevenue > 0
                              ? Math.max(
                                  (product.revenue /
                                    maxProductRevenue) *
                                    100,
                                  4
                                )
                              : 0
                          }%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <EmptyState text="No product sales recorded yet." />

          )}

          {bestProduct && (

            <div className="
              mt-5
              rounded-2xl
              p-4
              bg-gradient-to-r
              from-blue-500/10
              to-violet-500/10
              border border-blue-400/10
            ">

              <div className="
                flex
                items-center
                gap-2
                text-xs
                text-blue-300
                font-semibold
                uppercase
                tracking-wider
              ">
                <TrendingUp className="w-3.5 h-3.5" />
                Best Product
              </div>

              <p className="
                font-bold
                text-white
                mt-2
              ">
                {bestProduct.name}
              </p>

              <p className="
                text-xs
                text-white/40
                mt-1
              ">
                ₹{bestProduct.revenue.toLocaleString("en-IN")} revenue
                {" • "}
                {bestProduct.units} units sold
              </p>

            </div>

          )}

        </section>

        {/* INVENTORY INSIGHTS */}

        <section className="
          bg-slate-950/55
          backdrop-blur-2xl
          border border-white/10
          rounded-3xl
          shadow-xl shadow-black/15
          p-5 sm:p-6
        ">

          <div className="
            flex
            items-center
            justify-between
            mb-6
          ">

            <div>

              <div className="flex items-center gap-2">

                <div className="
                  w-9 h-9
                  rounded-xl
                  bg-cyan-500/10
                  border border-cyan-400/10
                  flex items-center justify-center
                ">
                  <Boxes className="w-4 h-4 text-cyan-300" />
                </div>

                <h2 className="
                  text-lg sm:text-xl
                  font-bold
                  text-white
                ">
                  Inventory Insights
                </h2>

              </div>

              <p className="text-sm text-white/40 mt-2">
                Current stock health
              </p>

            </div>

            <div className="
              w-10 h-10
              rounded-xl
              bg-cyan-500/10
              border border-cyan-400/10
              flex items-center justify-center
            ">
              <Package className="w-5 h-5 text-cyan-300" />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <InventoryBox
              label="Products"
              value={inventoryMetrics.totalProducts}
              icon={<Package className="w-4 h-4" />}
              style="
                bg-blue-500/10
                border-blue-400/10
                text-blue-300
              "
            />

            <InventoryBox
              label="In Stock"
              value={inventoryMetrics.inStock}
              icon={<TrendingUp className="w-4 h-4" />}
              style="
                bg-emerald-500/10
                border-emerald-400/10
                text-emerald-300
              "
            />

            <InventoryBox
              label="Low Stock"
              value={inventoryMetrics.lowStock}
              icon={<AlertTriangle className="w-4 h-4" />}
              style="
                bg-amber-500/10
                border-amber-400/10
                text-amber-300
              "
            />

            <InventoryBox
              label="Out of Stock"
              value={inventoryMetrics.outOfStock}
              icon={<AlertTriangle className="w-4 h-4" />}
              style="
                bg-red-500/10
                border-red-400/10
                text-red-300
              "
            />

          </div>

          {/* Inventory Value */}

          <div className="
            mt-5
            rounded-2xl
            p-4
            bg-white/[0.03]
            border border-white/10
          ">

            <div className="flex items-center gap-2">

              <CircleDollarSign className="w-4 h-4 text-cyan-300" />

              <p className="
                text-xs
                text-white/35
              ">
                Current Inventory Value
              </p>

            </div>

            <p className="
              text-2xl
              font-bold
              text-white
              mt-2
            ">
              ₹{inventoryMetrics.inventoryValue.toLocaleString("en-IN")}
            </p>

            <p className="
              text-xs
              text-white/30
              mt-1
            ">
              Based on current stock × selling price
            </p>

          </div>

          {/* Restock warning */}

          {inventoryMetrics.outOfStock > 0 && (

            <div className="
              mt-4
              rounded-2xl
              p-4
              bg-red-500/10
              border border-red-400/10
            ">

              <div className="
                flex
                items-center
                gap-2
                text-red-300
                font-semibold
              ">
                <AlertTriangle className="w-4 h-4" />
                Restock Required
              </div>

              <p className="
                text-xs
                text-red-200/60
                mt-1
              ">
                {inventoryMetrics.outOfStock} product
                {inventoryMetrics.outOfStock !== 1
                  ? "s are"
                  : " is"}{" "}
                currently out of stock.
              </p>

            </div>

          )}

        </section>

      </div>

      {/* =========================================
          FOOTER INSIGHT
      ========================================= */}

      <div className="
        mt-6
        rounded-2xl
        bg-slate-950/45
        backdrop-blur-xl
        border border-white/10
        px-5 py-4
        flex
        items-center
        gap-3
      ">

        <div className="
          w-9 h-9
          shrink-0
          rounded-xl
          bg-blue-500/10
          border border-blue-400/10
          flex items-center justify-center
        ">
          <Sparkles className="w-4 h-4 text-blue-300" />
        </div>

        <div>

          <p className="
            text-sm
            font-semibold
            text-white/80
          ">
            RetailIQ Intelligence
          </p>

          <p className="
            text-xs
            text-white/35
            mt-0.5
          ">
            Analytics are calculated dynamically from your sales
            and inventory data.
          </p>

        </div>

      </div>

    </div>
  );
}

// =========================================
// METRIC CARD
// =========================================

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconStyle,
  valueStyle,
}) {
  return (
    <div className="
      group
      relative
      overflow-hidden
      bg-white/[0.93]
      backdrop-blur-xl
      border border-white/30
      rounded-2xl
      p-4 sm:p-5
      shadow-xl shadow-black/10
      hover:-translate-y-1.5
      hover:shadow-2xl
      transition-all duration-300
    ">

      <div className="
        absolute
        -right-8
        -top-8
        w-24 h-24
        rounded-full
        bg-blue-500/5
        blur-2xl
      " />

      <div className="
        relative
        flex
        items-start
        justify-between
        gap-3
      ">

        <div className="min-w-0">

          <p className="
            text-xs sm:text-sm
            text-slate-500
            font-medium
          ">
            {title}
          </p>

          <h2 className={`
            text-xl sm:text-3xl
            font-bold
            mt-2
            truncate
            ${valueStyle}
          `}>
            {value}
          </h2>

        </div>

        <div className={`
          w-10 h-10 sm:w-11 sm:h-11
          rounded-xl
          border
          flex
          items-center
          justify-center
          shrink-0
          transition-transform
          duration-300
          group-hover:scale-110
          ${iconStyle}
        `}>
          {icon}
        </div>

      </div>

      <p className="
        relative
        text-xs
        text-slate-400
        mt-3
      ">
        {subtitle}
      </p>

    </div>
  );
}

// =========================================
// INVENTORY BOX
// =========================================

function InventoryBox({
  label,
  value,
  icon,
  style,
}) {
  return (
    <div className={`
      rounded-2xl
      p-4
      border
      transition-all
      duration-300
      hover:-translate-y-0.5
      ${style}
    `}>

      <div className="
        flex
        items-center
        justify-between
        gap-2
      ">

        <p className="
          text-xs
          text-white/45
        ">
          {label}
        </p>

        {icon}

      </div>

      <p className="
        text-2xl
        font-bold
        mt-2
      ">
        {value}
      </p>

    </div>
  );
}

// =========================================
// PAYMENT ICON
// =========================================

function PaymentIcon({ method }) {
  if (method === "UPI") {
    return (
      <span className="
        w-10 h-10
        rounded-xl
        bg-blue-500/10
        border border-blue-400/10
        flex items-center justify-center
      ">
        <Smartphone className="w-4 h-4 text-blue-300" />
      </span>
    );
  }

  if (method === "Cash") {
    return (
      <span className="
        w-10 h-10
        rounded-xl
        bg-emerald-500/10
        border border-emerald-400/10
        flex items-center justify-center
      ">
        <Banknote className="w-4 h-4 text-emerald-300" />
      </span>
    );
  }

  return (
    <span className="
      w-10 h-10
      rounded-xl
      bg-violet-500/10
      border border-violet-400/10
      flex items-center justify-center
    ">
      <CreditCard className="w-4 h-4 text-violet-300" />
    </span>
  );
}

// =========================================
// EMPTY STATE
// =========================================

function EmptyState({ text }) {
  return (
    <div className="
      py-12
      text-center
      rounded-2xl
      bg-white/[0.02]
      border border-white/[0.05]
    ">

      <div className="
        w-12 h-12
        mx-auto
        rounded-xl
        bg-blue-500/10
        border border-blue-400/10
        flex items-center justify-center
        mb-3
      ">
        <BarChart3 className="w-5 h-5 text-blue-300/60" />
      </div>

      <p className="
        text-sm
        text-white/35
      ">
        {text}
      </p>

    </div>
  );
}

export default Analytics;