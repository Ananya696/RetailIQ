import { useMemo, useRef, useState } from "react";

import {
  ArrowUp,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Package,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Truck,
  User,
  Zap,
} from "lucide-react";

/* =========================================================
   FALLBACK DATA
========================================================= */

const fallbackProducts = [
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

const fallbackSales = [
  {
    id: "S001",
    product: "Laptop",
    quantity: 1,
    price: 55000,
    total: 55000,
    payment: "UPI",
    date: "11 Sep 2026",
  },
  {
    id: "S002",
    product: "Wireless Mouse",
    quantity: 2,
    price: 799,
    total: 1598,
    payment: "Cash",
    date: "10 Sep 2026",
  },
  {
    id: "S003",
    product: "Headphones",
    quantity: 1,
    price: 2499,
    total: 2499,
    payment: "Card",
    date: "09 Sep 2026",
  },
  {
    id: "S004",
    product: "Keyboard",
    quantity: 2,
    price: 1299,
    total: 2598,
    payment: "UPI",
    date: "08 Sep 2026",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const getProductName = (sale) =>
  sale?.productName ||
  sale?.product ||
  sale?.product_name ||
  sale?.name ||
  "";

const getQuantity = (sale) =>
  Number(sale?.quantity ?? sale?.qty ?? sale?.units ?? 0);

const getSaleTotal = (sale) =>
  Number(
    sale?.total ??
      sale?.amount ??
      (Number(sale?.price) || 0) * getQuantity(sale)
  );

/* =========================================================
   BUILD AI CONTEXT
========================================================= */

function buildContext(products, sales) {
  const safeProducts = products.length ? products : fallbackProducts;
  const safeSales = sales.length ? sales : fallbackSales;

  const revenue = safeSales.reduce(
    (sum, sale) => sum + getSaleTotal(sale),
    0
  );

  const unitsSold = safeSales.reduce(
    (sum, sale) => sum + getQuantity(sale),
    0
  );

  const lowStock = safeProducts.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <= 5
  );

  const outOfStock = safeProducts.filter(
    (product) => Number(product.stock || 0) === 0
  );

  const productSales = safeProducts.map((product) => {
    const matchingSales = safeSales.filter(
      (sale) =>
        getProductName(sale).toLowerCase() ===
        String(product.name || "").toLowerCase()
    );

    const units = matchingSales.reduce(
      (sum, sale) => sum + getQuantity(sale),
      0
    );

    const revenueForProduct = matchingSales.reduce(
      (sum, sale) => sum + getSaleTotal(sale),
      0
    );

    return {
      ...product,
      units,
      revenue: revenueForProduct,
    };
  });

  const topProduct = [...productSales].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  return {
    products: safeProducts,
    sales: safeSales,
    revenue,
    unitsSold,
    lowStock,
    outOfStock,
    productSales,
    topProduct,
  };
}

/* =========================================================
   AI RESPONSE ENGINE
========================================================= */

function generateResponse(question, context) {
  const q = question.toLowerCase().trim();

  if (
    q.includes("stock") ||
    q.includes("inventory") ||
    q.includes("restock") ||
    q.includes("reorder")
  ) {
    const urgent = [...context.outOfStock, ...context.lowStock];

    if (!urgent.length) {
      return {
        text:
          "Your current inventory looks healthy. I don't see any products at or below the low-stock threshold in the available data.",
        chips: [
          "Analyze sales",
          "Show revenue",
          "Demand forecast",
        ],
      };
    }

    const names = urgent
      .slice(0, 4)
      .map(
        (product) =>
          `${product.name} (${Number(product.stock || 0)} units)`
      )
      .join(", ");

    return {
      text: `I found ${urgent.length} product${
        urgent.length === 1 ? "" : "s"
      } that need attention: ${names}. The strongest action is to review the Smart Restock page for recommended order quantities and supplier details.`,
      chips: [
        "Open Smart Restock",
        "Analyze sales",
        "Find anomalies",
      ],
    };
  }

  if (
    q.includes("revenue") ||
    q.includes("sales") ||
    q.includes("selling") ||
    q.includes("sold")
  ) {
    const top =
      context.topProduct?.name || "your top product";

    return {
      text: `From the current sales data, revenue is ${currency(
        context.revenue
      )} across ${context.sales.length} transaction${
        context.sales.length === 1 ? "" : "s"
      }, with ${context.unitsSold} units sold. ${top} is currently the highest-revenue product in the available data.`,
      chips: [
        "Show inventory",
        "Find anomalies",
        "Demand forecast",
      ],
    };
  }

  if (
    q.includes("anomal") ||
    q.includes("suspicious") ||
    q.includes("unusual") ||
    q.includes("risk")
  ) {
    const signals = [];

    if (context.outOfStock.length) {
      signals.push(
        `${context.outOfStock.length} out-of-stock product${
          context.outOfStock.length === 1 ? "" : "s"
        }`
      );
    }

    if (context.lowStock.length) {
      signals.push(
        `${context.lowStock.length} low-stock product${
          context.lowStock.length === 1 ? "" : "s"
        }`
      );
    }

    signals.push(
      `${context.sales.length} recent transaction${
        context.sales.length === 1 ? "" : "s"
      } reviewed`
    );

    return {
      text: `The current demo data has ${signals.join(
        ", "
      )}. For a detailed investigation, open Anomalies to see severity, risk scores and recommended actions.`,
      chips: [
        "Open Anomalies",
        "Check inventory",
        "Analyze sales",
      ],
    };
  }

  if (
    q.includes("forecast") ||
    q.includes("demand") ||
    q.includes("future") ||
    q.includes("predict")
  ) {
    return {
      text:
        "The Forecast page is ready to turn your sales history into product-level demand estimates. With the current demo data, I recommend checking Forecast first and then using Smart Restock to convert the prediction into purchase quantities.",
      chips: [
        "Open Forecast",
        "Open Smart Restock",
        "Show inventory",
      ],
    };
  }

  if (
    q.includes("product") ||
    q.includes("top") ||
    q.includes("best")
  ) {
    const top = context.topProduct;

    return {
      text: top
        ? `${top.name} is currently the strongest product by recorded revenue at ${currency(
            top.revenue
          )}, based on the available demo sales. It has ${Number(
            top.stock || 0
          )} units in stock.`
        : "I don't have enough sales data to identify a top product yet.",
      chips: [
        "Analyze sales",
        "Check inventory",
        "Demand forecast",
      ],
    };
  }

  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey") ||
    q.includes("help")
  ) {
    return {
      text:
        "Hey! 👋 I'm your RetailIQ assistant. I can help you understand sales, inventory, demand forecasts, restocking and anomaly signals.",
      chips: [
        "What needs restocking?",
        "How are my sales?",
        "Find anomalies",
      ],
    };
  }

  return {
    text:
      "I can help with your retail data. Try asking about sales, revenue, inventory, products that need restocking, demand forecasts or unusual activity.",
    chips: [
      "What needs restocking?",
      "How are my sales?",
      "Find anomalies",
    ],
  };
}

/* =========================================================
   TYPING INDICATOR
========================================================= */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
    </div>
  );
}

/* =========================================================
   ASSISTANT AVATAR
========================================================= */

function AssistantAvatar({ small = false }) {
  return (
    <div
      className={`
        relative flex shrink-0 items-center justify-center
        rounded-2xl
        bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600
        text-white
        shadow-lg shadow-blue-500/30
        ring-1 ring-white/20
        transition-all duration-300
        hover:scale-105 hover:shadow-blue-500/50
        ${small ? "h-10 w-10" : "h-12 w-12"}
      `}
    >
      <div className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-md" />

      <Bot
        size={small ? 18 : 23}
        className="relative z-10"
      />

      {!small && (
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-slate-950 bg-emerald-400" />
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ icon, label, value }) {
  return (
    <div
      className="
        group flex items-center justify-between
        rounded-2xl
        border border-white/10
        bg-white/5
        px-3.5 py-3
        transition-all duration-300
        hover:-translate-y-0.5
        hover:bg-white/10
        hover:border-white/20
      "
    >
      <div className="flex items-center gap-2.5 text-sm text-slate-300">
        <span className="text-blue-300 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <span className="font-bold text-white">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AIAssistant({
  products = [],
  sales = [],
  onNavigate,
}) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Hi! 👋 I'm RetailIQ AI. Ask me anything about your inventory, sales, demand or restocking.",
      chips: [
        "What needs restocking?",
        "How are my sales?",
        "Find anomalies",
      ],
    },
  ]);

  const inputRef = useRef(null);
  const messageIdRef = useRef(0);

  const context = useMemo(
    () => buildContext(products, sales),
    [products, sales]
  );

  /* =========================================================
     QUICK ACTIONS
  ========================================================= */

  const quickActions = [
    {
      label: "Check Inventory",
      icon: Package,
      question: "What products need restocking?",
    },
    {
      label: "Analyze Sales",
      icon: BarChart3,
      question: "How are my sales?",
    },
    {
      label: "Create Restock Plan",
      icon: Truck,
      question: "What should I restock?",
    },
    {
      label: "Find Anomalies",
      icon: Zap,
      question: "Find unusual activity.",
    },
    {
      label: "Revenue Summary",
      icon: TrendingUp,
      question: "Show me my revenue.",
    },
    {
      label: "Demand Forecast",
      icon: BrainCircuit,
      question: "What does the demand forecast say?",
    },
  ];

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage = (value = input) => {
    const question = String(value || "").trim();

    if (!question || isTyping) return;

    const userMessage = {
      id: `user-${messageIdRef.current++}`,
      role: "user",
      text: question,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      const response = generateResponse(
        question,
        context
      );

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${messageIdRef.current++}`,
          role: "assistant",
          text: response.text,
          chips: response.chips,
        },
      ]);

      setIsTyping(false);
    }, 700);
  };

  /* =========================================================
     CHIP HANDLER
  ========================================================= */

  const handleChip = (chip) => {
    if (chip.startsWith("Open ")) {
      const target = chip.replace("Open ", "");

      const pageMap = {
        "Smart Restock": "smart-restock",
        Anomalies: "anomalies",
        Forecast: "forecast",
        Inventory: "inventory",
      };

      const targetPage = pageMap[target];

      if (targetPage) {
        if (typeof onNavigate === "function") {
          onNavigate(targetPage);
        } else {
          window.dispatchEvent(
            new CustomEvent("retailiq:navigate", {
              detail: targetPage,
            })
          );
        }

        return;
      }
    }

    sendMessage(chip);
  };

  /* =========================================================
     QUICK ACTION HANDLER
  ========================================================= */

  const handleQuickAction = (action) => {
    sendMessage(action.question);
  };

  /* =========================================================
     CLEAR CHAT
  ========================================================= */

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${messageIdRef.current++}`,
        role: "assistant",
        text:
          "Chat cleared. 👋 What would you like me to analyze?",
        chips: [
          "What needs restocking?",
          "How are my sales?",
          "Find anomalies",
        ],
      },
    ]);
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="retailiq-app min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section
          className="
            relative mb-6 overflow-hidden
            rounded-[2rem]
            border border-white/10
            bg-slate-950/75
            p-6 sm:p-8
            text-white
            shadow-2xl shadow-black/20
            backdrop-blur-2xl
            animate-[fadeIn_0.6s_ease-out]
          "
        >
          {/* Glow effects */}

          <div
            className="
              pointer-events-none
              absolute -right-24 -top-32
              h-80 w-80
              rounded-full
              bg-blue-500/20
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute -bottom-32 left-1/3
              h-80 w-80
              rounded-full
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute left-1/4 top-1/2
              h-40 w-40
              rounded-full
              bg-cyan-400/10
              blur-3xl
            "
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            {/* Hero text */}

            <div>
              <div
                className="
                  mb-4 inline-flex items-center gap-2
                  rounded-full
                  border border-white/10
                  bg-white/10
                  px-3 py-1.5
                  text-xs font-semibold
                  text-blue-100
                  backdrop-blur-xl
                "
              >
                <Sparkles
                  size={14}
                  className="text-blue-300"
                />

                RetailIQ Intelligence

                <span
                  className="
                    rounded-full
                    bg-blue-500/20
                    px-2 py-0.5
                    text-[10px]
                    font-bold
                    tracking-wider
                    text-blue-200
                  "
                >
                  AI
                </span>
              </div>

              <h1
                className="
                  bg-gradient-to-r
                  from-white
                  via-blue-100
                  to-violet-200
                  bg-clip-text
                  text-3xl font-black
                  tracking-tight
                  text-transparent
                  sm:text-4xl
                "
              >
                AI Assistant
              </h1>

              <p
                className="
                  mt-3 max-w-2xl
                  text-sm leading-6
                  text-slate-300
                  sm:text-base
                "
              >
                Your retail copilot for sales insights,
                inventory decisions, demand forecasting
                and smarter restocking.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Sales Insights",
                  "Inventory",
                  "Forecasting",
                  "Smart Restock",
                ].map((item) => (
                  <span
                    key={item}
                    className="
                      rounded-full
                      border border-white/10
                      bg-white/5
                      px-3 py-1.5
                      text-[11px]
                      font-medium
                      text-slate-300
                      backdrop-blur
                    "
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* AI status */}

            <div
              className="
                flex items-center gap-3
                rounded-2xl
                border border-white/10
                bg-white/5
                p-4
                shadow-xl
                backdrop-blur-xl
              "
            >
              <div className="relative">
                <AssistantAvatar small />

                <span
                  className="
                    absolute -bottom-0.5 -right-0.5
                    h-3 w-3
                    rounded-full
                    border-2 border-slate-950
                    bg-emerald-400
                    shadow-lg shadow-emerald-400/50
                  "
                />
              </div>

              <div>
                <p className="font-bold text-white">
                  RetailIQ AI
                </p>

                <p className="mt-0.5 text-xs text-emerald-300">
                  ● Online · Demo mode
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div
          className="
            grid gap-6
            xl:grid-cols-[minmax(0,1fr)_310px]
          "
        >

          {/* ===================================================
              CHAT PANEL
          =================================================== */}

          <section
            className="
              flex min-h-[620px]
              flex-col overflow-hidden
              rounded-[2rem]
              border border-white/20
              bg-white/90
              shadow-2xl shadow-black/10
              backdrop-blur-2xl
              animate-[fadeIn_0.7s_ease-out]
            "
          >

            {/* Chat header */}

            <div
              className="
                flex items-center justify-between
                border-b border-slate-200/70
                bg-white/70
                px-4 py-4
                backdrop-blur-xl
                sm:px-6
              "
            >
              <div className="flex items-center gap-3">
                <AssistantAvatar small />

                <div>
                  <p className="font-bold text-slate-900">
                    RetailIQ Assistant
                  </p>

                  <div
                    className="
                      mt-0.5
                      flex items-center gap-1.5
                      text-xs text-emerald-600
                    "
                  >
                    <span
                      className="
                        h-1.5 w-1.5
                        animate-pulse
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    Ready to help
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearChat}
                className="
                  group
                  inline-flex items-center gap-2
                  rounded-xl
                  border border-slate-200
                  bg-white/70
                  px-3 py-2
                  text-xs font-semibold
                  text-slate-500
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:border-blue-200
                  hover:bg-blue-50
                  hover:text-blue-600
                "
              >
                <RefreshCw
                  size={14}
                  className="
                    transition-transform duration-500
                    group-hover:rotate-180
                  "
                />

                Clear
              </button>
            </div>

            {/* Messages */}

            <div
              className="
                flex-1
                space-y-5
                overflow-y-auto
                bg-slate-100/50
                p-4
                sm:p-6
              "
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`
                    flex gap-3
                    animate-[fadeIn_0.4s_ease-out]
                    ${
                      message.role === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }
                  `}
                >

                  {/* Avatar */}

                  {message.role === "assistant" ? (
                    <AssistantAvatar small />
                  ) : (
                    <div
                      className="
                        flex h-10 w-10
                        shrink-0 items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-slate-800
                        to-slate-950
                        text-white
                        shadow-lg
                        shadow-slate-900/20
                      "
                    >
                      <User size={17} />
                    </div>
                  )}

                  <div
                    className={`
                      flex max-w-[88%]
                      flex-col
                      sm:max-w-[72%]
                      ${
                        message.role === "user"
                          ? "items-end"
                          : "items-start"
                      }
                    `}
                  >

                    {/* Message bubble */}

                    <div
                      className={`
                        rounded-2xl
                        px-4 py-3
                        text-sm
                        leading-6
                        shadow-sm
                        transition-all duration-300
                        ${
                          message.role === "user"
                            ? `
                              rounded-tr-md
                              bg-gradient-to-br
                              from-slate-900
                              to-indigo-950
                              text-white
                              shadow-lg
                              shadow-indigo-950/20
                            `
                            : `
                              rounded-tl-md
                              border border-white/70
                              bg-white/90
                              text-slate-700
                              backdrop-blur-xl
                            `
                        }
                      `}
                    >
                      {message.text}
                    </div>

                    {/* Suggested chips */}

                    {message.role === "assistant" &&
                      message.chips?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {message.chips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                handleChip(chip)
                              }
                              className="
                                rounded-full
                                border border-slate-200
                                bg-white/90
                                px-3 py-1.5
                                text-xs font-semibold
                                text-slate-600
                                shadow-sm
                                transition-all duration-300
                                hover:-translate-y-0.5
                                hover:border-blue-300
                                hover:bg-blue-50
                                hover:text-blue-700
                                hover:shadow-md
                              "
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {/* Typing */}

              {isTyping && (
                <div
                  className="
                    flex gap-3
                    animate-[fadeIn_0.3s_ease-out]
                  "
                >
                  <AssistantAvatar small />

                  <div
                    className="
                      rounded-2xl
                      rounded-tl-md
                      border border-white
                      bg-white/90
                      px-4 py-3
                      shadow-sm
                      backdrop-blur-xl
                    "
                  >
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}

            <div
              className="
                border-t border-slate-200/70
                bg-white/80
                p-4
                backdrop-blur-xl
                sm:p-5
              "
            >
              <div
                className="
                  flex items-end gap-2
                  rounded-2xl
                  border border-slate-200
                  bg-slate-50/90
                  p-2
                  shadow-inner
                  transition-all duration-300
                  focus-within:border-blue-400
                  focus-within:bg-white
                  focus-within:ring-4
                  focus-within:ring-blue-100
                "
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask RetailIQ anything..."
                  className="
                    max-h-32
                    min-h-[42px]
                    flex-1
                    resize-none
                    bg-transparent
                    px-3 py-2.5
                    text-sm
                    text-slate-800
                    outline-none
                    placeholder:text-slate-400
                  "
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={
                    !input.trim() || isTyping
                  }
                  className="
                    group
                    flex h-11 w-11
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-600
                    to-violet-600
                    text-white
                    shadow-lg
                    shadow-blue-500/20
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:from-blue-500
                    hover:to-violet-500
                    hover:shadow-blue-500/40
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    disabled:hover:translate-y-0
                  "
                  title="Send message"
                >
                  <ArrowUp
                    size={19}
                    className="
                      transition-transform duration-300
                      group-hover:-translate-y-0.5
                    "
                  />
                </button>
              </div>

              <p
                className="
                  mt-2.5
                  text-center
                  text-[11px]
                  text-slate-400
                "
              >
                Demo responses use your current
                frontend sales and inventory data.
                Real GenAI can be connected later.
              </p>
            </div>
          </section>

          {/* ===================================================
              RIGHT SIDEBAR
          =================================================== */}

          <aside className="space-y-5">

            {/* =================================================
                QUICK ACTIONS
            ================================================= */}

            <div
              className="
                rounded-[2rem]
                border border-white/30
                bg-white/85
                p-5
                shadow-xl shadow-black/10
                backdrop-blur-2xl
                animate-[fadeIn_0.8s_ease-out]
              "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-500/10
                    to-violet-500/10
                    p-2.5
                    text-blue-600
                    ring-1 ring-blue-100
                  "
                >
                  <Zap size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Quick Actions
                  </h2>

                  <p className="text-xs text-slate-500">
                    Ask RetailIQ instantly
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() =>
                        handleQuickAction(action)
                      }
                      className="
                        group
                        rounded-2xl
                        border border-slate-200
                        bg-slate-50/80
                        p-3.5
                        text-left
                        transition-all duration-300
                        hover:-translate-y-1
                        hover:border-blue-200
                        hover:bg-blue-50
                        hover:shadow-lg
                        hover:shadow-blue-500/10
                      "
                    >
                      <div
                        className="
                          flex h-9 w-9
                          items-center justify-center
                          rounded-xl
                          bg-white
                          text-slate-500
                          shadow-sm
                          transition-all duration-300
                          group-hover:bg-blue-600
                          group-hover:text-white
                          group-hover:shadow-blue-500/30
                        "
                      >
                        <Icon size={17} />
                      </div>

                      <p
                        className="
                          mt-3
                          text-xs font-bold
                          text-slate-700
                          transition-colors
                          group-hover:text-blue-700
                        "
                      >
                        {action.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                STORE SNAPSHOT
            ================================================= */}

            <div
              className="
                relative overflow-hidden
                rounded-[2rem]
                border border-white/10
                bg-slate-950/85
                p-5
                text-white
                shadow-2xl shadow-black/20
                backdrop-blur-2xl
              "
            >
              {/* Glow */}

              <div
                className="
                  pointer-events-none
                  absolute -right-16 -top-16
                  h-40 w-40
                  rounded-full
                  bg-blue-500/20
                  blur-3xl
                "
              />

              <div
                className="
                  pointer-events-none
                  absolute -bottom-16 -left-10
                  h-36 w-36
                  rounded-full
                  bg-violet-500/20
                  blur-3xl
                "
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      rounded-xl
                      bg-white/10
                      p-2.5
                      text-blue-300
                    "
                  >
                    <BarChart3 size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Live context
                    </p>

                    <p className="font-bold text-white">
                      Your store snapshot
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <SummaryRow
                    icon={<Package size={16} />}
                    label="Products"
                    value={context.products.length}
                  />

                  <SummaryRow
                    icon={<TrendingUp size={16} />}
                    label="Revenue"
                    value={currency(
                      context.revenue
                    )}
                  />

                  <SummaryRow
                    icon={<Truck size={16} />}
                    label="Low stock"
                    value={context.lowStock.length}
                  />

                  <SummaryRow
                    icon={<CheckCircle2 size={16} />}
                    label="Transactions"
                    value={context.sales.length}
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                AI STATUS
            ================================================= */}

            <div
              className="
                relative overflow-hidden
                rounded-[2rem]
                border border-blue-200/50
                bg-gradient-to-br
                from-blue-50/90
                via-white/90
                to-violet-50/90
                p-5
                shadow-xl shadow-blue-500/5
                backdrop-blur-xl
              "
            >
              <div
                className="
                  absolute -right-8 -top-8
                  h-24 w-24
                  rounded-full
                  bg-blue-400/10
                  blur-2xl
                "
              />

              <div className="relative flex gap-3">
                <div
                  className="
                    flex h-10 w-10
                    shrink-0 items-center justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-500
                    to-violet-600
                    text-white
                    shadow-lg
                    shadow-blue-500/20
                  "
                >
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    AI Insight Engine
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-slate-600
                    "
                  >
                    RetailIQ can analyze your current
                    sales and inventory context to
                    generate useful business insights.
                  </p>
                </div>
              </div>

              <div
                className="
                  mt-4
                  flex items-center gap-2
                  rounded-xl
                  border border-blue-100
                  bg-white/70
                  px-3 py-2
                "
              >
                <span
                  className="
                    h-2 w-2
                    animate-pulse
                    rounded-full
                    bg-emerald-500
                  "
                />

                <span
                  className="
                    text-[11px]
                    font-semibold
                    text-slate-600
                  "
                >
                  AI context connected
                </span>
              </div>
            </div>

            {/* =================================================
                COMING NEXT
            ================================================= */}

            <div
              className="
                relative overflow-hidden
                rounded-[2rem]
                border border-amber-200/60
                bg-amber-50/85
                p-5
                shadow-lg shadow-amber-500/5
                backdrop-blur-xl
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute -right-10 -top-10
                  h-28 w-28
                  rounded-full
                  bg-amber-300/20
                  blur-2xl
                "
              />

              <div className="relative flex gap-3">
                <Sparkles
                  className="
                    mt-0.5
                    shrink-0
                    text-amber-600
                  "
                  size={19}
                />

                <div>
                  <p className="font-bold text-amber-900">
                    Coming next
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-amber-800
                    "
                  >
                    Connect your GenAI teammate's API
                    here so these demo responses become
                    real natural-language retail insights.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div
          className="
            mt-6
            flex flex-col items-center
            justify-between gap-2
            rounded-2xl
            border border-white/20
            bg-white/60
            px-5 py-3
            text-center
            text-[11px]
            text-slate-500
            shadow-lg
            backdrop-blur-xl
            sm:flex-row
          "
        >
          <span>
            RetailIQ AI Assistant · Demo Intelligence
          </span>

          <span className="flex items-center gap-1.5">
            <span
              className="
                h-1.5 w-1.5
                animate-pulse
                rounded-full
                bg-emerald-500
              "
            />

            Context synced with frontend data
          </span>
        </div>
      </div>
    </div>
  );
}