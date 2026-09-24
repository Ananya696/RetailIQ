import { useState } from "react";

import Signup from "./pages/SignUp/SignUp.jsx";
import Login from "./pages/Login/Login.jsx";

import Navbar from "./assets/components/Navbar/Navbar.jsx";
import Sidebar from "./assets/components/Sidebar/Sidebar.jsx";
import StatCard from "./assets/components/StatCard/StatCard.jsx";

import Inventory from "./pages/Inventory/Inventory.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Employees from "./pages/Employee/Employee.jsx";
import Analytics from "./pages/Analytics/Analytics.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Forecast from "./pages/Forecast/Forecast.jsx";
import SmartRestock from "./pages/SmartRestock/SmartRestock.jsx";
import Anomalies from "./pages/Anomalies/Anomalies.jsx";
import AIAssistant from "./pages/AIAssistant/AIAssistant.jsx";
import VoiceBilling from "./pages/VoiceBilling/VoiceBilling.jsx";
import InvoiceScanner from "./pages/InvoiceScanner/InvoiceScanner.jsx";

function App() {
  // ==================================================
  // LOGIN STATE
  // ==================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // ==================================================
  // SHARED PRODUCT DATA
  // ==================================================

  const [products, setProducts] = useState([
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
  ]);

  // ==================================================
  // SHARED SALES DATA
  // ==================================================

  const [sales, setSales] = useState([
    {
      id: "S001",
      product: "Laptop",
      quantity: 1,
      price: 55000,
      total: 55000,
      payment: "UPI",
      date: "11 Sep 2026",
      inventoryAdjusted: false,
    },
    {
      id: "S002",
      product: "Wireless Mouse",
      quantity: 2,
      price: 799,
      total: 1598,
      payment: "Cash",
      date: "10 Sep 2026",
      inventoryAdjusted: false,
    },
    {
      id: "S003",
      product: "Headphones",
      quantity: 1,
      price: 2499,
      total: 2499,
      payment: "Card",
      date: "09 Sep 2026",
      inventoryAdjusted: false,
    },
    {
      id: "S004",
      product: "Keyboard",
      quantity: 2,
      price: 1299,
      total: 2598,
      payment: "UPI",
      date: "08 Sep 2026",
      inventoryAdjusted: false,
    },
  ]);

  // ==================================================
  // UPDATE PRODUCT STOCK
  // ==================================================

  const updateProductStock = (id, change) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: Math.max(
                0,
                Number(product.stock || 0) +
                  Number(change || 0)
              ),
            }
          : product
      )
    );
  };

  // ==================================================
  // ADD PRODUCT
  // ==================================================

  const addProduct = (product) => {
    setProducts((current) => [
      ...current,
      {
        ...product,
        id:
          current.length > 0
            ? Math.max(
                ...current.map((item) => item.id)
              ) + 1
            : 1,
      },
    ]);
  };

  // ==================================================
  // UPDATE PRODUCT
  // ==================================================

  const updateProduct = (updatedProduct) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === updatedProduct.id
          ? {
              ...product,
              ...updatedProduct,
            }
          : product
      )
    );
  };

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  const deleteProduct = (id) => {
    setProducts((current) =>
      current.filter(
        (product) => product.id !== id
      )
    );
  };

  // ==================================================
  // COMPLETE VOICE BILLING SALE
  // ==================================================

  const completeVoiceSale = (invoice) => {
    if (!invoice?.items?.length) return;

    const saleDate =
      invoice.date ||
      new Date().toLocaleDateString("en-IN");

    setSales((currentSales) => {
      let nextId = currentSales.length + 1;

      const newSales = invoice.items.map((item) => ({
        id: `S${String(nextId++).padStart(3, "0")}`,
        product: item.name,
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        total:
          Number(item.price || 0) *
          Number(item.quantity || 0),
        payment: invoice.payment,
        date: saleDate,
        inventoryAdjusted: true,
      }));

      return [...currentSales, ...newSales];
    });

    invoice.items.forEach((item) => {
      const product = products.find(
        (currentProduct) =>
          currentProduct.id === item.id ||
          currentProduct.name === item.name
      );

      if (product) {
        updateProductStock(
          product.id,
          -Number(item.quantity || 0)
        );
      }
    });
  };

  // ==================================================
  // ADD INVOICE ITEMS TO INVENTORY
  // ==================================================

  const addInvoiceItemsToInventory = (invoice) => {
    if (!invoice?.items?.length) return;

    setProducts((currentProducts) => {
      const updatedProducts = [
        ...currentProducts,
      ];

      invoice.items.forEach((item) => {
        const itemName = String(
          item.name || ""
        ).trim();

        if (!itemName) return;

        const existingProductIndex =
          updatedProducts.findIndex(
            (product) =>
              String(product.name || "")
                .trim()
                .toLowerCase() ===
              itemName.toLowerCase()
          );

        if (existingProductIndex !== -1) {
          const existingProduct =
            updatedProducts[
              existingProductIndex
            ];

          updatedProducts[
            existingProductIndex
          ] = {
            ...existingProduct,

            stock:
              Number(existingProduct.stock || 0) +
              Number(item.quantity || 0),

            price:
              Number(item.unitPrice || 0) ||
              Number(existingProduct.price || 0),

            supplier:
              item.supplier ||
              invoice.supplier ||
              existingProduct.supplier,

            category:
              item.category ||
              existingProduct.category,
          };
        } else {
          const nextId =
            updatedProducts.length > 0
              ? Math.max(
                  ...updatedProducts.map(
                    (product) => product.id
                  )
                ) + 1
              : 1;

          updatedProducts.push({
            id: nextId,
            name: itemName,
            category:
              item.category || "Other",
            supplier:
              item.supplier ||
              invoice.supplier ||
              "Unknown",
            price: Number(
              item.unitPrice || 0
            ),
            stock: Number(
              item.quantity || 0
            ),
          });
        }
      });

      return updatedProducts;
    });
  };

  // ==================================================
  // LOGIN / SIGNUP
  // ==================================================

  if (!isLoggedIn) {
    if (showSignup) {
      return (
        <Signup
          onBackToLogin={() =>
            setShowSignup(false)
          }
          onSignup={() =>
            setShowSignup(false)
          }
        />
      );
    }

    return (
      <Login
        onLogin={() =>
          setIsLoggedIn(true)
        }
        onSignup={() =>
          setShowSignup(true)
        }
      />
    );
  }

  // ==================================================
  // COMMON PAGE LAYOUT
  // ==================================================

  const pageLayout = (content) => (
    <div className="retailiq-app min-h-screen">
      <Navbar />

      <div className="flex">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <main
          key={activePage}
          className="
            flex-1
            min-w-0
            animate-pageEnter
          "
        >
          {content}
        </main>
      </div>
    </div>
  );

  // ==================================================
  // INVENTORY PAGE
  // ==================================================

  if (activePage === "inventory") {
    return pageLayout(
      <Inventory
        products={products}
        updateProductStock={
          updateProductStock
        }
        addProduct={addProduct}
        updateProduct={updateProduct}
        deleteProduct={deleteProduct}
      />
    );
  }

  // ==================================================
  // SALES PAGE
  // ==================================================

  if (activePage === "sales") {
    return pageLayout(
      <Sales
        products={products}
        sales={sales}
        setSales={setSales}
        updateProductStock={
          updateProductStock
        }
      />
    );
  }

  // ==================================================
  // FORECAST PAGE
  // ==================================================

  if (activePage === "forecast") {
    return pageLayout(
      <Forecast
        products={products}
        sales={sales}
      />
    );
  }

  // ==================================================
  // ANOMALIES PAGE
  // ==================================================

  if (activePage === "anomalies") {
    return pageLayout(
      <Anomalies
        products={products}
        sales={sales}
      />
    );
  }

  // ==================================================
  // SMART RESTOCK PAGE
  // ==================================================

  if (activePage === "smart-restock") {
    return pageLayout(
      <SmartRestock
        products={products}
        sales={sales}
      />
    );
  }

  // ==================================================
  // AI ASSISTANT PAGE
  // ==================================================

  if (activePage === "ai-assistant") {
    return pageLayout(
      <AIAssistant
        products={products}
        sales={sales}
        onNavigate={setActivePage}
      />
    );
  }

  // ==================================================
  // VOICE BILLING PAGE
  // ==================================================

  if (activePage === "voice-billing") {
    return pageLayout(
      <VoiceBilling
        products={products}
        onCompleteSale={
          completeVoiceSale
        }
      />
    );
  }

  // ==================================================
  // INVOICE SCANNER PAGE
  // ==================================================

  if (activePage === "invoice-scanner") {
    return pageLayout(
      <InvoiceScanner
        onAddToInventory={
          addInvoiceItemsToInventory
        }
      />
    );
  }

  // ==================================================
  // EMPLOYEES PAGE
  // ==================================================

  if (activePage === "employees") {
    return pageLayout(<Employees />);
  }

  // ==================================================
  // ANALYTICS PAGE
  // ==================================================

  if (activePage === "analytics") {
    return pageLayout(
      <Analytics
        sales={sales}
        products={products}
      />
    );
  }

  // ==================================================
  // SETTINGS PAGE
  // ==================================================

  if (activePage === "settings") {
    return pageLayout(<Settings />);
  }

  // ==================================================
  // DASHBOARD DATA
  // ==================================================

  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0),
    0
  );

  const lowStockProducts =
    products.filter(
      (product) =>
        Number(product.stock || 0) > 0 &&
        Number(product.stock || 0) <= 5
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        Number(product.stock || 0) === 0
    ).length;

  const totalRevenue = sales.reduce(
    (total, sale) =>
      total + Number(sale.total || 0),
    0
  );

  const totalTransactions = sales.length;

  // ==================================================
  // DASHBOARD PAGE
  // ==================================================

  return (
    <div className="retailiq-app min-h-screen">

      {/* NAVBAR */}

      <Navbar />

      <div className="flex">

        {/* SIDEBAR */}

        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        {/* MAIN CONTENT */}

        <main
          className="
            flex-1
            min-w-0
            p-4
            sm:p-6
            lg:p-8
          "
        >

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

            <p
              className="
                text-white/70
                mt-2
              "
            >
              Here's what's happening with
              your store today.
            </p>

          </div>

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
              value={`₹${totalRevenue.toLocaleString(
                "en-IN"
              )}`}
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
              value="2"
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

            {/* ============================= */}
            {/* SALES OVERVIEW */}
            {/* ============================= */}

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

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                "
              >
                Sales Overview
              </h2>

              <p
                className="
                  text-gray-500
                  text-sm
                  mt-1
                "
              >
                Current sales performance
              </p>

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

                {[20, 28, 24, 36, 32, 44].map(
                  (height, index) => (
                    <div
                      key={index}
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
                        height: `${height * 4}px`,
                      }}
                    />
                  )
                )}

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
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>

            </div>

            {/* ============================= */}
            {/* INVENTORY OVERVIEW */}
            {/* ============================= */}

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

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                "
              >
                Inventory Overview
              </h2>

              <p
                className="
                  text-gray-500
                  text-sm
                  mt-1
                "
              >
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

                {/* TOTAL PRODUCTS */}

                <div
                  className="
                    bg-blue-50
                    rounded-lg
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-md
                    hover:bg-blue-100
                    cursor-pointer
                  "
                >

                  <p
                    className="
                      text-gray-500
                      text-sm
                    "
                  >
                    Total Products
                  </p>

                  <h3
                    className="
                      text-2xl
                      font-bold
                      text-blue-600
                      mt-2
                    "
                  >
                    {totalProducts}
                  </h3>

                </div>

                {/* LOW STOCK */}

                <div
                  className="
                    bg-yellow-50
                    rounded-lg
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-md
                    hover:bg-yellow-100
                    cursor-pointer
                  "
                >

                  <p
                    className="
                      text-gray-500
                      text-sm
                    "
                  >
                    Low Stock
                  </p>

                  <h3
                    className="
                      text-2xl
                      font-bold
                      text-yellow-600
                      mt-2
                    "
                  >
                    {lowStockProducts}
                  </h3>

                </div>

                {/* OUT OF STOCK */}

                <div
                  className="
                    bg-red-50
                    rounded-lg
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-md
                    hover:bg-red-100
                    cursor-pointer
                  "
                >

                  <p
                    className="
                      text-gray-500
                      text-sm
                    "
                  >
                    Out of Stock
                  </p>

                  <h3
                    className="
                      text-2xl
                      font-bold
                      text-red-600
                      mt-2
                    "
                  >
                    {outOfStockProducts}
                  </h3>

                </div>

                {/* AVAILABLE UNITS */}

                <div
                  className="
                    bg-green-50
                    rounded-lg
                    p-5
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-md
                    hover:bg-green-100
                    cursor-pointer
                  "
                >

                  <p
                    className="
                      text-gray-500
                      text-sm
                    "
                  >
                    Available Units
                  </p>

                  <h3
                    className="
                      text-2xl
                      font-bold
                      text-green-600
                      mt-2
                    "
                  >
                    {totalUnits}
                  </h3>

                </div>

              </div>

            </div>

          </div>

          {/* ============================= */}
          {/* QUICK STORE SUMMARY */}
          {/* ============================= */}

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

              {/* SUMMARY TEXT */}

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
                  Store Summary
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    mt-1
                  "
                >
                  Live overview from your
                  RetailIQ data.
                </p>

              </div>

              {/* SUMMARY VALUES */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >

                {/* REVENUE */}

                <div
                  className="
                    bg-blue-50/80
                    rounded-xl
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    Revenue
                  </p>

                  <p
                    className="
                      font-bold
                      text-blue-600
                      mt-1
                    "
                  >
                    ₹
                    {totalRevenue.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>

                {/* UNITS */}

                <div
                  className="
                    bg-emerald-50/80
                    rounded-xl
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    Units
                  </p>

                  <p
                    className="
                      font-bold
                      text-emerald-600
                      mt-1
                    "
                  >
                    {totalUnits}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default App;