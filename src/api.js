const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const session = {
  get token() {
    return localStorage.getItem("retailiq_token");
  },

  get user() {
    try {
      return JSON.parse(localStorage.getItem("retailiq_user"));
    } catch {
      return null;
    }
  },

  save(token, user) {
    localStorage.setItem("retailiq_token", token);
    localStorage.setItem("retailiq_user", JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem("retailiq_token");
    localStorage.removeItem("retailiq_user");
  },
};

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const payload =
    form || (body ? JSON.stringify(body) : undefined);

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: payload,
  });

  if (res.status === 401 && session.token) {
    session.clear();
    window.location.assign("/login");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || `Request failed (${res.status})`
    );
  }

  return data;
}
// ==================================================
// BACKEND → FRONTEND DATA ADAPTER
// ==================================================

export const toUiProduct = (product) => ({
  id: product.id,
  name: product.name,
  category: product.category || "Other",
  supplier: product.supplier || "-",
  price: Number(product.price || 0),
  cost: Number(product.cost || 0),
  stock: Number(product.stock?.quantity ?? 0),
  lowStockThreshold: Number(
    product.stock?.lowStockThreshold ?? 5
  ),
  expiryDate: product.stock?.expiryDate || null,
});
// ==================================================
// BACKEND → FRONTEND SALE ADAPTER
// ==================================================

export const toUiSale = (sale) => ({
  id: sale.id,
  productId: sale.productId,
  product:
    sale.product?.name ||
    sale.productName ||
    sale.product ||
    "Unknown Product",
  quantity: Number(sale.quantitySold || sale.quantity || 0),
  price: Number(sale.salePrice || sale.price || 0),
  total:
    Number(sale.quantitySold || sale.quantity || 0) *
    Number(sale.salePrice || sale.price || 0),
  payment: sale.paymentMethod || sale.payment || "Cash",
  date: sale.saleDate
    ? new Date(sale.saleDate).toLocaleDateString("en-IN")
    : sale.date || "",
  soldBy: sale.soldBy?.name || sale.soldBy || "",
});