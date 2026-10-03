import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api, session, toUiProduct, toUiSale } from "./api";

import Signup from "./pages/SignUp/SignUp.jsx";
import Login from "./pages/Login/Login.jsx";
import SetPassword from "./pages/SetPassword/SetPassword.jsx";

import Navbar from "./assets/components/Navbar/Navbar.jsx";
import Sidebar from "./assets/components/Sidebar/Sidebar.jsx";

import Inventory from "./pages/Inventory/Inventory.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
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

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();


  // ==================================================
  // LOGIN STATE
  // ==================================================

  const [isLoggedIn, setIsLoggedIn] = useState(!!session.token);

  // ==================================================
  // SHARED PRODUCT DATA
  // ==================================================

  const [products, setProducts] = useState([]);

  // ==================================================
  // SHARED SALES DATA
  // ==================================================

  const [sales, setSales] = useState([]);

  // ==================================================
  // LOAD PRODUCTS + SALES FROM BACKEND
  // ==================================================

  useEffect(() => {
    if (!session.token) return;

    const loadData = async () => {
      try {
        const [productsData, salesData] = await Promise.all([
          api("/api/products"),
          api("/api/sales"),
        ]);

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        const salesList = Array.isArray(salesData)
          ? salesData
          : salesData.sales || [];

        setProducts(productList.map(toUiProduct));
        setSales(salesList.map(toUiSale));
      } catch (error) {
        console.error("Failed to load RetailIQ data:", error);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // ==================================================
  // UPDATE PRODUCT STOCK
  // ==================================================

  const updateProductStock = async (id, change) => {
    try {
      const product = products.find((item) => item.id === id);
      if (!product) return;

      const newQuantity = Math.max(
        0,
        Number(product.stock || 0) + Number(change || 0)
      );

      await api(`/api/stock/${id}`, {
        method: "PUT",
        body: { quantity: newQuantity },
      });

      setProducts((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, stock: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert(error.message);
    }
  };

  // ==================================================
  // ADD PRODUCT
  // ==================================================

  const addProduct = async (product) => {
    try {
      const data = await api("/api/products", {
        method: "POST",
        body: {
          name: product.name,
          category: product.category,
          supplier: product.supplier || "",
          price: Number(product.price || 0),
          cost: Number(product.cost || product.price || 0),
          stock: Number(product.stock || 0),
        },
      });

      const createdProduct = data.product || data;

      setProducts((current) => [
        ...current,
        toUiProduct(createdProduct),
      ]);
    } catch (error) {
      console.error("Failed to add product:", error);
      alert(error.message);
    }
  };

  // ==================================================
  // UPDATE PRODUCT
  // ==================================================

  const updateProduct = async (updatedProduct) => {
    try {
      const data = await api(
        `/api/products/${updatedProduct.id}`,
        {
          method: "PUT",
          body: {
            name: updatedProduct.name,
            category: updatedProduct.category,
            supplier: updatedProduct.supplier || "",
            price: Number(updatedProduct.price || 0),
            cost: Number(
              updatedProduct.cost || updatedProduct.price || 0
            ),
          },
        }
      );

      const returnedProduct = data.product || data;

      setProducts((current) =>
        current.map((product) =>
          product.id === updatedProduct.id
            ? toUiProduct(returnedProduct)
            : product
        )
      );
    } catch (error) {
      console.error("Failed to update product:", error);
      alert(error.message);
    }
  };

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  const deleteProduct = async (id) => {
    try {
      await api(`/api/products/${id}`, {
        method: "DELETE",
      });

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(error.message);
    }
  };

  // ==================================================
  // COMPLETE VOICE BILLING SALE
  // ==================================================

  const completeVoiceSale = async (invoice) => {
    if (!invoice?.items?.length) return;

    try {
      for (const item of invoice.items) {
        const product = products.find(
          (currentProduct) =>
            currentProduct.id === item.id ||
            currentProduct.name === item.name
        );

        if (!product) continue;

        await api("/api/sales", {
          method: "POST",
          body: {
            productId: product.id,
            quantitySold: Number(item.quantity || 0),
            salePrice: Number(item.price || product.price || 0),
            paymentMethod: invoice.payment || "Cash",
          },
        });
      }

      const [productsData, salesData] = await Promise.all([
        api("/api/products"),
        api("/api/sales"),
      ]);

      const productList = Array.isArray(productsData)
        ? productsData
        : productsData.products || [];

      const salesList = Array.isArray(salesData)
        ? salesData
        : salesData.sales || [];

      setProducts(productList.map(toUiProduct));
      setSales(salesList.map(toUiSale));
    } catch (error) {
      console.error("Failed to complete voice sale:", error);
      alert(error.message);
    }
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
  // COMMON PAGE LAYOUT
  // ==================================================

  const pageLayout = (content) => (
    <div className="retailiq-app min-h-screen">
      <Navbar />

      <div className="flex">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => navigate(`/${page}`)}
        />

        <main
          key={location.pathname}
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

  const pathToPage = {
    "/": "dashboard",
    "/dashboard": "dashboard",
    "/inventory": "inventory",
    "/sales": "sales",
    "/forecast": "forecast",
    "/anomalies": "anomalies",
    "/smart-restock": "smart-restock",
    "/ai-assistant": "ai-assistant",
    "/voice-billing": "voice-billing",
    "/invoice-scanner": "invoice-scanner",
    "/employees": "employees",
    "/analytics": "analytics",
    "/settings": "settings",
  };

  const activePage = pathToPage[location.pathname] || "dashboard";

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="/dashboard"
        element={pageLayout(
          <Dashboard products={products} sales={sales} />
        )}
      />

      <Route
        path="/inventory"
        element={pageLayout(
          <Inventory
            products={products}
            updateProductStock={updateProductStock}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
          />
        )}
      />

      <Route
        path="/sales"
        element={pageLayout(
          <Sales
            products={products}
            sales={sales}
            setSales={setSales}
            updateProductStock={updateProductStock}
          />
        )}
      />

      <Route
        path="/forecast"
        element={pageLayout(
          <Forecast products={products} sales={sales} />
        )}
      />

      <Route
        path="/anomalies"
        element={pageLayout(
          <Anomalies products={products} sales={sales} />
        )}
      />

      <Route
        path="/smart-restock"
        element={pageLayout(
          <SmartRestock products={products} sales={sales} />
        )}
      />

      <Route
        path="/ai-assistant"
        element={pageLayout(
          <AIAssistant
            products={products}
            sales={sales}
            onNavigate={(page) => navigate(`/${page}`)}
          />
        )}
      />

      <Route
        path="/voice-billing"
        element={pageLayout(
          <VoiceBilling
            products={products}
            onCompleteSale={completeVoiceSale}
          />
        )}
      />

      <Route
        path="/invoice-scanner"
        element={pageLayout(
          <InvoiceScanner
            onAddToInventory={addInvoiceItemsToInventory}
          />
        )}
      />

      <Route
        path="/employees"
        element={pageLayout(<Employees />)}
      />

      <Route
        path="/analytics"
        element={pageLayout(
          <Analytics sales={sales} products={products} />
        )}
      />

      <Route
        path="/settings"
        element={pageLayout(<Settings />)}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

function ProtectedApp() {
  const [loggedIn, setLoggedIn] = useState(!!session.token);

  useEffect(() => {
    const syncSession = () => setLoggedIn(!!session.token);

    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <AppContent />;
}

function PublicRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Login
            onLogin={() => {
              window.dispatchEvent(new Event("retailiq:auth"));
            }}
            onSignup={() => {
              window.history.pushState({}, "", "/signup");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          />
        }
      />

      <Route
        path="/signup"
        element={
          <Signup
            onBackToLogin={() => {
              window.history.pushState({}, "", "/login");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            onSignup={() => {
              window.history.pushState({}, "", "/login");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          />
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function SetPasswordRoute() {
  return <SetPassword />;
}

function RootRoutes() {
  const [loggedIn, setLoggedIn] = useState(!!session.token);

  useEffect(() => {
    const syncSession = () => setLoggedIn(!!session.token);

    window.addEventListener("retailiq:auth", syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("retailiq:auth", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return (
    <Routes>
      <Route path="/set-password" element={<SetPasswordRoute />} />

      <Route
        path="/*"
        element={
          loggedIn ? <ProtectedApp /> : <PublicRoutes />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RootRoutes />
    </BrowserRouter>
  );
}

export default App;
