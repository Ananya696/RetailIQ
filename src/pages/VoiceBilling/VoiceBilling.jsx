import { useMemo, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  Volume2,
  Sparkles,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Printer,
} from "lucide-react";

/* =========================================================
   FALLBACK PRODUCTS
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getProductId = (product) =>
  product?.id ?? product?._id ?? product?.productId;

const getProductPrice = (product) =>
  Number(
    product?.price ??
      product?.sellingPrice ??
      product?.unitPrice ??
      0
  );

const getProductStock = (product) =>
  Number(
    product?.stock ??
      product?.quantity ??
      product?.currentStock ??
      0
  );

const getProductName = (product) =>
  product?.name ??
  product?.productName ??
  "Unnamed Product";

/* =========================================================
   VOICE PRODUCT SEARCH
========================================================= */

const findProductFromSpeech = (text, products) => {
  const normalizedText = normalize(text);

  if (!normalizedText) return null;

  const exact = products.find((product) => {
    const name = normalize(getProductName(product));

    return (
      name &&
      normalizedText.includes(name)
    );
  });

  if (exact) return exact;

  const words = normalizedText
    .split(" ")
    .filter(Boolean);

  let bestProduct = null;
  let bestScore = 0;

  products.forEach((product) => {
    const nameWords = normalize(
      getProductName(product)
    ).split(" ");

    const score = nameWords.filter((word) =>
      words.includes(word)
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  });

  return bestScore > 0 ? bestProduct : null;
};

/* =========================================================
   VOICE QUANTITY
========================================================= */

const extractQuantity = (text) => {
  const numberMatch = String(text || "").match(
    /\b(\d+)\b/
  );

  if (numberMatch) {
    return Math.max(
      1,
      Number(numberMatch[1])
    );
  }

  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const normalized = normalize(text);

  for (const [word, number] of Object.entries(
    numberWords
  )) {
    if (normalized.includes(word)) {
      return number;
    }
  }

  return 1;
};

/* =========================================================
   VOICE WAVE
========================================================= */

function VoiceWave({ active }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1.5">
      {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
        <span
          key={bar}
          className={`
            w-1 rounded-full transition-all duration-300
            ${
              active
                ? "animate-pulse bg-cyan-400"
                : "bg-slate-600"
            }
          `}
          style={{
            height: active
              ? `${12 + ((bar * 7) % 18)}px`
              : "8px",
            animationDelay: `${bar * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   PRODUCT ICON
========================================================= */

function ProductIcon({ name }) {
  const firstLetter = String(
    name || "P"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className="
        flex h-11 w-11 shrink-0
        items-center justify-center
        rounded-xl
        border border-cyan-400/10
        bg-gradient-to-br
        from-blue-500/20
        to-cyan-400/10
        text-sm font-bold
        text-cyan-300
        shadow-inner
      "
    >
      {firstLetter}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function VoiceBilling({
  products = [],
  onCompleteSale,
}) {
  const availableProducts = products.length
    ? products
    : fallbackProducts;

  const [cart, setCart] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [transcript, setTranscript] =
    useState("");

  const [voiceStatus, setVoiceStatus] =
    useState(
      "Tap the microphone and speak your billing command."
    );

  const [voiceSupported] = useState(() =>
    Boolean(
      window.SpeechRecognition ||
        window.webkitSpeechRecognition
    )
  );

  const [paymentMethod, setPaymentMethod] =
    useState("UPI");

  const [customerName, setCustomerName] =
    useState("");

  const [showInvoice, setShowInvoice] =
    useState(false);

  const [lastInvoice, setLastInvoice] =
    useState(null);

  const [notice, setNotice] =
    useState(null);

  const recognitionRef = useRef(null);

  const invoiceCounterRef = useRef(1001);

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    const query = normalize(searchTerm);

    if (!query) {
      return availableProducts;
    }

    return availableProducts.filter(
      (product) =>
        normalize(
          getProductName(product)
        ).includes(query)
    );
  }, [availableProducts, searchTerm]);

  /* =========================================================
     BILL TOTALS
  ========================================================= */

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      ),
    [cart]
  );

  const tax = Math.round(
    subtotal * 0.05
  );

  const grandTotal =
    subtotal + tax;

  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const showNotice = (
    type,
    message
  ) => {
    setNotice({
      type,
      message,
    });

    window.setTimeout(() => {
      setNotice(null);
    }, 2800);
  };

  /* =========================================================
     ADD TO CART
  ========================================================= */

  const addToCart = (
    product,
    quantity = 1
  ) => {
    const stock =
      getProductStock(product);

    if (stock <= 0) {
      showNotice(
        "error",
        `${getProductName(
          product
        )} is currently out of stock.`
      );

      return;
    }

    setCart((currentCart) => {
      const productId =
        getProductId(product);

      const existing =
        currentCart.find(
          (item) =>
            item.id === productId
        );

      if (existing) {
        const nextQuantity =
          Math.min(
            existing.quantity +
              quantity,
            stock
          );

        if (
          nextQuantity ===
          existing.quantity
        ) {
          showNotice(
            "error",
            `Only ${stock} unit${
              stock === 1
                ? ""
                : "s"
            } available for ${getProductName(
              product
            )}.`
          );
        }

        return currentCart.map(
          (item) =>
            item.id === productId
              ? {
                  ...item,
                  quantity:
                    nextQuantity,
                }
              : item
        );
      }

      return [
        ...currentCart,
        {
          id: productId,
          name: getProductName(
            product
          ),
          price:
            getProductPrice(
              product
            ),
          stock,
          quantity: Math.min(
            quantity,
            stock
          ),
        },
      ];
    });

    showNotice(
      "success",
      `${getProductName(
        product
      )} added to bill.`
    );
  };

  /* =========================================================
     CHANGE QUANTITY
  ========================================================= */

  const changeQuantity = (
    id,
    change
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const nextQuantity =
            Math.max(
              0,
              Math.min(
                item.quantity +
                  change,
                item.stock
              )
            );

          return {
            ...item,
            quantity:
              nextQuantity,
          };
        })
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  /* =========================================================
     REMOVE PRODUCT
  ========================================================= */

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  /* =========================================================
     VOICE COMMAND
  ========================================================= */

  const processVoiceCommand = (
    command
  ) => {
    const product =
      findProductFromSpeech(
        command,
        availableProducts
      );

    if (!product) {
      setVoiceStatus(
        "I couldn't identify a product. Try: “Add 2 wireless mouse”."
      );

      showNotice(
        "error",
        "Product not recognized. Try speaking the product name."
      );

      return;
    }

    const quantity =
      extractQuantity(command);

    const stock =
      getProductStock(product);

    if (stock <= 0) {
      setVoiceStatus(
        `${getProductName(
          product
        )} is out of stock.`
      );

      showNotice(
        "error",
        `${getProductName(
          product
        )} is out of stock.`
      );

      return;
    }

    const safeQuantity =
      Math.min(
        quantity,
        stock
      );

    addToCart(
      product,
      safeQuantity
    );

    setVoiceStatus(
      `Added ${safeQuantity} × ${getProductName(
        product
      )} to the bill.`
    );

    setTranscript(command);
  };

  /* =========================================================
     VOICE RECOGNITION
  ========================================================= */

  const toggleListening = () => {
    if (!voiceSupported) {
      showNotice(
        "error",
        "Voice recognition is not supported in this browser. Use Chrome or Edge."
      );

      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();

      recognitionRef.current =
        null;

      setIsListening(false);

      setVoiceStatus(
        "Voice input stopped."
      );

      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotice(
        "error",
        "Voice recognition is not supported in this browser. Use Chrome or Edge."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);

      setVoiceStatus(
        "Listening… say a product and quantity."
      );
    };

    recognition.onresult = (
      event
    ) => {
      let finalTranscript =
        "";

      let interimTranscript =
        "";

      for (
        let i =
          event.resultIndex;
        i <
        event.results.length;
        i += 1
      ) {
        const result =
          event.results[i];

        if (result.isFinal) {
          finalTranscript +=
            result[0].transcript;
        } else {
          interimTranscript +=
            result[0].transcript;
        }
      }

      const currentTranscript =
        `${finalTranscript} ${interimTranscript}`.trim();

      setTranscript(
        currentTranscript
      );

      if (
        finalTranscript.trim()
      ) {
        processVoiceCommand(
          finalTranscript.trim()
        );
      }
    };

    recognition.onerror = (
      event
    ) => {
      setIsListening(false);

      recognitionRef.current =
        null;

      if (
        event.error ===
          "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        setVoiceStatus(
          "Microphone permission was blocked. Allow microphone access and try again."
        );
      } else {
        setVoiceStatus(
          "I couldn't hear that clearly. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      recognitionRef.current =
        null;
    };

    recognitionRef.current =
      recognition;

    setTranscript("");

    try {
      recognition.start();
    } catch {
      recognitionRef.current =
        null;

      setIsListening(false);

      setVoiceStatus(
        "Voice input could not start. Please try again."
      );
    }
  };

  /* =========================================================
     CLEAR BILL
  ========================================================= */

  const clearBill = () => {
    setCart([]);

    setTranscript("");

    setVoiceStatus(
      "Bill cleared. Ready for the next customer."
    );

    showNotice(
      "success",
      "Current bill cleared."
    );
  };

  /* =========================================================
     CREATE INVOICE
  ========================================================= */

  const createInvoice = () => {
    if (!cart.length) {
      showNotice(
        "error",
        "Add at least one product before generating an invoice."
      );

      return;
    }

    const invoice = {
      id: `INV-${invoiceCounterRef.current++}`,

      date: new Date().toLocaleDateString(
        "en-IN"
      ),

      time: new Date().toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),

      customer:
        customerName.trim() ||
        "Walk-in Customer",

      payment:
        paymentMethod,

      items: cart.map(
        (item) => ({
          ...item,
        })
      ),

      subtotal,

      tax,

      total:
        grandTotal,
    };

    setLastInvoice(
      invoice
    );

    setShowInvoice(true);

    if (
      typeof onCompleteSale ===
      "function"
    ) {
      onCompleteSale(
        invoice
      );
    }

    showNotice(
      "success",
      "Invoice generated successfully."
    );
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const printInvoice = () => {
    if (!lastInvoice) {
      return;
    }

    window.print();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="retailiq-app min-h-screen px-4 py-5 text-white sm:px-6 lg:px-8">

      {/* =====================================================
          NOTIFICATION
      ===================================================== */}

      {notice && (
        <div
          className={`
            fixed right-4 top-5 z-[100]
            flex max-w-sm items-center gap-3
            rounded-2xl
            border
            px-4 py-3
            shadow-2xl
            backdrop-blur-2xl
            animate-[fadeIn_0.3s_ease-out]
            ${
              notice.type === "error"
                ? "border-red-400/20 bg-red-950/80 text-red-200"
                : "border-emerald-400/20 bg-emerald-950/80 text-emerald-200"
            }
          `}
        >
          {notice.type ===
          "error" ? (
            <XCircle size={20} />
          ) : (
            <CheckCircle2
              size={20}
            />
          )}

          <span className="text-sm">
            {notice.message}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl">

        {/* ===================================================
            HERO
        =================================================== */}

        <section
          className="
            relative mb-6 overflow-hidden
            rounded-[2rem]
            border border-white/10
            bg-slate-950/80
            p-5
            shadow-2xl shadow-black/30
            backdrop-blur-2xl
            sm:p-7
            animate-[fadeIn_0.6s_ease-out]
          "
        >
          {/* Background glow */}

          <div
            className="
              pointer-events-none
              absolute -right-24 -top-32
              h-80 w-80
              rounded-full
              bg-cyan-500/15
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute -bottom-32 left-1/3
              h-80 w-80
              rounded-full
              bg-blue-600/15
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute left-1/4 top-1/2
              h-40 w-40
              rounded-full
              bg-violet-500/10
              blur-3xl
            "
          />

          <div
            className="
              relative flex flex-col gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            {/* Hero content */}

            <div>
              <div
                className="
                  mb-3 inline-flex
                  items-center gap-2
                  rounded-full
                  border border-cyan-400/20
                  bg-cyan-400/10
                  px-3 py-1.5
                  text-xs font-semibold
                  text-cyan-300
                  backdrop-blur-xl
                "
              >
                <Sparkles size={14} />

                SMART VOICE BILLING

                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-2 py-0.5
                    text-[10px]
                    tracking-wider
                    text-cyan-200
                  "
                >
                  AI
                </span>
              </div>

              <h1
                className="
                  bg-gradient-to-r
                  from-white
                  via-cyan-100
                  to-blue-300
                  bg-clip-text
                  text-3xl
                  font-black
                  tracking-tight
                  text-transparent
                  sm:text-4xl
                "
              >
                Voice Billing
              </h1>

              <p
                className="
                  mt-3 max-w-2xl
                  text-sm
                  leading-6
                  text-slate-300
                  sm:text-base
                "
              >
                Create bills faster using
                voice commands, manual
                product selection, and
                automatic invoice calculations.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Voice Commands",
                  "Smart Cart",
                  "Instant Invoice",
                  "UPI / Cash / Card",
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

            {/* Current bill */}

            <div
              className="
                group
                flex items-center gap-3
                rounded-2xl
                border border-white/10
                bg-white/5
                px-4 py-3
                shadow-xl
                backdrop-blur-xl
                transition-all duration-300
                hover:-translate-y-1
                hover:border-cyan-400/20
              "
            >
              <div
                className="
                  rounded-xl
                  bg-gradient-to-br
                  from-blue-500/20
                  to-cyan-400/10
                  p-2.5
                  text-cyan-300
                "
              >
                <ShoppingCart
                  size={22}
                />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Current Bill
                </p>

                <p className="font-bold text-white">
                  {totalItems} item
                  {totalItems === 1
                    ? ""
                    : "s"}{" "}
                  ·{" "}
                  {currency(
                    grandTotal
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div
          className="
            grid gap-6
            lg:grid-cols-[1.05fr_0.95fr]
          "
        >

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <section className="space-y-6">

            {/* ===============================================
                VOICE COMMAND
            =============================================== */}

            <div
              className="
                rounded-[2rem]
                border border-white/10
                bg-slate-950/75
                p-5
                shadow-2xl shadow-black/20
                backdrop-blur-2xl
                sm:p-6
              "
            >
              <div
                className="
                  flex items-center
                  justify-between gap-4
                "
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Volume2
                      className="text-cyan-300"
                      size={20}
                    />

                    <h2 className="text-lg font-bold">
                      Voice Command
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    Example: “Add 2 wireless mouse”
                  </p>
                </div>

                <div
                  className={`
                    rounded-full
                    border px-3 py-1.5
                    text-xs font-semibold
                    ${
                      isListening
                        ? `
                          border-red-400/20
                          bg-red-500/10
                          text-red-300
                        `
                        : `
                          border-white/10
                          bg-white/5
                          text-slate-400
                        `
                    }
                  `}
                >
                  {isListening
                    ? "● Listening"
                    : "Ready"}
                </div>
              </div>

              {/* Voice area */}

              <div
                className="
                  relative mt-6
                  overflow-hidden
                  rounded-[1.75rem]
                  border border-cyan-400/10
                  bg-gradient-to-b
                  from-slate-800/90
                  to-slate-950
                  p-7
                  text-center
                  shadow-inner
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute left-1/2 top-1/2
                    h-48 w-48
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-cyan-500/5
                    blur-3xl
                  "
                />

                {/* Microphone */}

                <button
                  type="button"
                  onClick={
                    toggleListening
                  }
                  aria-label={
                    isListening
                      ? "Stop listening"
                      : "Start voice billing"
                  }
                  className={`
                    relative z-10
                    mx-auto
                    flex h-28 w-28
                    items-center
                    justify-center
                    rounded-full
                    border
                    shadow-2xl
                    transition-all
                    duration-500
                    hover:scale-105
                    active:scale-95
                    ${
                      isListening
                        ? `
                          border-red-400/50
                          bg-red-500/15
                          text-red-300
                          shadow-red-950/50
                          ring-8
                          ring-red-500/5
                        `
                        : `
                          border-cyan-400/30
                          bg-cyan-400/10
                          text-cyan-300
                          shadow-cyan-950/50
                          hover:border-cyan-300/50
                          hover:bg-cyan-400/15
                          hover:shadow-cyan-500/20
                        `
                    }
                  `}
                >
                  {isListening ? (
                    <>
                      <span
                        className="
                          absolute inset-0
                          animate-ping
                          rounded-full
                          border border-red-400/20
                        "
                      />

                      <MicOff
                        size={38}
                      />
                    </>
                  ) : (
                    <Mic size={38} />
                  )}
                </button>

                <div className="relative z-10 mt-6">
                  <VoiceWave
                    active={
                      isListening
                    }
                  />
                </div>

                <p
                  className="
                    relative z-10
                    mt-3
                    text-sm
                    font-medium
                    text-slate-300
                  "
                >
                  {voiceStatus}
                </p>

                {transcript && (
                  <div
                    className="
                      relative z-10
                      mx-auto mt-4
                      max-w-xl
                      rounded-2xl
                      border border-white/10
                      bg-black/20
                      px-4 py-3
                      text-sm
                      text-slate-300
                      backdrop-blur
                    "
                  >
                    <span className="text-slate-500">
                      Heard:{" "}
                    </span>

                    “{transcript}”
                  </div>
                )}

                {!voiceSupported && (
                  <p
                    className="
                      relative z-10
                      mt-4
                      text-xs
                      text-amber-300
                    "
                  >
                    Voice recognition is
                    unavailable in this browser.
                    Chrome or Edge is recommended.
                  </p>
                )}
              </div>
            </div>

            {/* ===============================================
                ADD PRODUCTS
            =============================================== */}

            <div
              className="
                rounded-[2rem]
                border border-white/10
                bg-slate-950/75
                p-5
                shadow-2xl shadow-black/20
                backdrop-blur-2xl
                sm:p-6
              "
            >
              <div
                className="
                  flex flex-col gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <h2 className="text-lg font-bold">
                    Add Products
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Search and add products manually.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search
                    size={17}
                    className="
                      absolute
                      left-3 top-1/2
                      -translate-y-1/2
                      text-slate-500
                    "
                  />

                  <input
                    type="text"
                    value={
                      searchTerm
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search products..."
                    className="
                      w-full
                      rounded-xl
                      border border-white/10
                      bg-white/5
                      py-2.5
                      pl-10 pr-3
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-slate-500
                      transition-all
                      focus:border-cyan-400/40
                      focus:bg-white/10
                      focus:ring-4
                      focus:ring-cyan-400/5
                    "
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {filteredProducts.map(
                  (product) => {
                    const stock =
                      getProductStock(
                        product
                      );

                    const disabled =
                      stock <= 0;

                    return (
                      <div
                        key={getProductId(
                          product
                        )}
                        className="
                          group
                          rounded-2xl
                          border border-white/10
                          bg-white/[0.035]
                          p-4
                          transition-all
                          duration-300
                          hover:-translate-y-1
                          hover:border-cyan-400/20
                          hover:bg-white/[0.06]
                          hover:shadow-xl
                          hover:shadow-cyan-950/20
                        "
                      >
                        <div className="flex items-center gap-3">
                          <ProductIcon
                            name={getProductName(
                              product
                            )}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">
                              {getProductName(
                                product
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {product?.category ||
                                "General"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-cyan-300">
                              {currency(
                                getProductPrice(
                                  product
                                )
                              )}
                            </p>

                            <p
                              className={`
                                mt-0.5 text-xs
                                ${
                                  disabled
                                    ? "text-red-300"
                                    : "text-slate-500"
                                }
                              `}
                            >
                              {disabled
                                ? "Out of stock"
                                : `${stock} in stock`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            disabled={
                              disabled
                            }
                            className="
                              inline-flex
                              items-center gap-1.5
                              rounded-xl
                              bg-gradient-to-r
                              from-blue-600
                              to-cyan-600
                              px-3 py-2
                              text-xs font-bold
                              text-white
                              shadow-lg
                              shadow-blue-950/20
                              transition-all
                              duration-300
                              hover:-translate-y-0.5
                              hover:from-blue-500
                              hover:to-cyan-500
                              disabled:cursor-not-allowed
                              disabled:bg-slate-700
                              disabled:bg-none
                              disabled:text-slate-500
                            "
                          >
                            <Plus
                              size={15}
                            />

                            Add
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {!filteredProducts.length && (
                <div
                  className="
                    py-10
                    text-center
                    text-sm
                    text-slate-500
                  "
                >
                  No products found.
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              RIGHT BILL PANEL
          ================================================= */}

          <section
            className="
              rounded-[2rem]
              border border-white/10
              bg-slate-950/80
              p-5
              shadow-2xl shadow-black/20
              backdrop-blur-2xl
              lg:sticky
              lg:top-5
              lg:h-fit
            "
          >
            {/* Bill heading */}

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt
                    className="text-blue-300"
                    size={20}
                  />

                  <h2 className="text-lg font-bold">
                    Current Bill
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {cart.length
                    ? `${cart.length} product${
                        cart.length === 1
                          ? ""
                          : "s"
                      } added`
                    : "No products added yet"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearBill
                }
                disabled={
                  !cart.length
                }
                className="
                  inline-flex
                  items-center gap-1.5
                  rounded-xl
                  border border-white/10
                  bg-white/5
                  px-3 py-2
                  text-xs font-medium
                  text-slate-400
                  transition-all
                  hover:bg-white/10
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <RotateCcw
                  size={14}
                />

                Clear
              </button>
            </div>

            {/* Cart */}

            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.035]
                    p-4
                    transition-all
                    duration-300
                    hover:border-white/15
                    hover:bg-white/[0.05]
                  "
                >
                  <div className="flex items-center gap-3">
                    <ProductIcon
                      name={item.name}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {currency(
                          item.price
                        )}{" "}
                        each
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                      className="
                        rounded-lg
                        p-2
                        text-slate-500
                        transition-all
                        hover:bg-red-500/10
                        hover:text-red-300
                      "
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div
                      className="
                        flex items-center
                        rounded-xl
                        border border-white/10
                        bg-slate-900/80
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            -1
                          )
                        }
                        className="
                          p-2
                          text-slate-400
                          transition
                          hover:text-white
                        "
                      >
                        <Minus
                          size={15}
                        />
                      </button>

                      <span
                        className="
                          min-w-8
                          text-center
                          text-sm
                          font-bold
                        "
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(
                            item.id,
                            1
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.stock
                        }
                        className="
                          p-2
                          text-slate-400
                          transition
                          hover:text-white
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                        "
                      >
                        <Plus
                          size={15}
                        />
                      </button>
                    </div>

                    <p className="font-bold text-white">
                      {currency(
                        item.price *
                          item.quantity
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {!cart.length && (
                <div
                  className="
                    rounded-2xl
                    border border-dashed
                    border-white/10
                    bg-white/[0.02]
                    py-12
                    text-center
                  "
                >
                  <ShoppingCart
                    size={34}
                    className="
                      mx-auto
                      text-slate-600
                    "
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-400">
                    Your bill is empty
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Use voice or add a
                    product manually.
                  </p>
                </div>
              )}
            </div>

            {/* Bill summary */}

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {currency(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>
                    Tax (5%)
                  </span>

                  <span>
                    {currency(
                      tax
                    )}
                  </span>
                </div>

                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span>Total</span>

                  <span className="text-cyan-300">
                    {currency(
                      grandTotal
                    )}
                  </span>
                </div>
              </div>

              {/* Customer */}

              <div className="mt-5">
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(event) =>
                    setCustomerName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Walk-in Customer"
                  className="
                    w-full
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    px-3 py-2.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                    transition
                    focus:border-cyan-400/40
                    focus:bg-white/10
                    focus:ring-4
                    focus:ring-cyan-400/5
                  "
                />
              </div>

              {/* Payment */}

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-slate-400">
                  Payment Method
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "UPI",
                      icon: Smartphone,
                    },
                    {
                      id: "Cash",
                      icon: Banknote,
                    },
                    {
                      id: "Card",
                      icon: CreditCard,
                    },
                  ].map(
                    ({
                      id,
                      icon: Icon,
                    }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            id
                          )
                        }
                        className={`
                          flex flex-col
                          items-center
                          gap-1.5
                          rounded-xl
                          border
                          px-2 py-2.5
                          text-xs
                          transition-all
                          duration-300
                          ${
                            paymentMethod ===
                            id
                              ? `
                                border-blue-400/40
                                bg-blue-500/10
                                text-blue-300
                                shadow-lg
                                shadow-blue-950/20
                              `
                              : `
                                border-white/10
                                bg-white/[0.03]
                                text-slate-500
                                hover:bg-white/[0.06]
                                hover:text-slate-300
                              `
                          }
                        `}
                      >
                        <Icon
                          size={17}
                        />

                        {id}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Generate */}

              <button
                type="button"
                onClick={
                  createInvoice
                }
                disabled={
                  !cart.length
                }
                className="
                  mt-5
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-600
                  px-4 py-3.5
                  text-sm font-bold
                  text-white
                  shadow-xl
                  shadow-blue-950/30
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:from-blue-500
                  hover:to-cyan-500
                  hover:shadow-cyan-950/40
                  disabled:cursor-not-allowed
                  disabled:from-slate-700
                  disabled:to-slate-700
                  disabled:text-slate-500
                  disabled:shadow-none
                "
              >
                <Receipt
                  size={18}
                />

                Generate Invoice
              </button>
            </div>
          </section>
        </div>

        {/* ===================================================
            FOOTER NOTE
        =================================================== */}

        <div
          className="
            mt-6
            rounded-2xl
            border border-blue-400/10
            bg-slate-950/50
            px-4 py-3
            text-xs leading-5
            text-slate-500
            shadow-lg
            backdrop-blur-xl
          "
        >
          <span className="font-semibold text-cyan-300">
            Demo mode:
          </span>{" "}
          Voice recognition currently runs in
          the browser. The billing UI is ready
          for backend, database, and real
          AI/voice integration later.
        </div>
      </div>

      {/* =====================================================
          INVOICE MODAL
      ===================================================== */}

      {showInvoice &&
        lastInvoice && (
          <div
            className="
              fixed inset-0 z-40
              flex items-center
              justify-center
              bg-black/75
              p-4
              backdrop-blur-md
            "
          >
            <div
              className="
                max-h-[90vh]
                w-full max-w-lg
                overflow-y-auto
                rounded-[2rem]
                border border-white/10
                bg-slate-950
                p-6
                text-white
                shadow-2xl
                shadow-black/50
                animate-[fadeIn_0.3s_ease-out]
              "
            >
              {/* Modal header */}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="
                      inline-flex
                      items-center gap-2
                      rounded-full
                      border border-emerald-400/20
                      bg-emerald-500/10
                      px-3 py-1
                      text-xs font-bold
                      text-emerald-300
                    "
                  >
                    <CheckCircle2
                      size={14}
                    />

                    INVOICE READY
                  </div>

                  <h2 className="mt-3 text-2xl font-black">
                    RetailIQ Invoice
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {lastInvoice.id} ·{" "}
                    {lastInvoice.date} ·{" "}
                    {lastInvoice.time}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowInvoice(
                      false
                    )
                  }
                  className="
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    px-3 py-2
                    text-xs
                    text-slate-400
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  Close
                </button>
              </div>

              {/* Customer information */}

              <div
                className="
                  mt-6
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.035]
                  p-4
                "
              >
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Customer
                  </span>

                  <span className="font-semibold">
                    {lastInvoice.customer}
                  </span>
                </div>

                <div className="mt-2 flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Payment
                  </span>

                  <span className="font-semibold">
                    {lastInvoice.payment}
                  </span>
                </div>
              </div>

              {/* Invoice items */}

              <div className="mt-4 space-y-2">
                {lastInvoice.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="
                        flex items-center
                        justify-between
                        rounded-xl
                        border border-white/5
                        bg-white/[0.025]
                        px-3 py-3
                        text-sm
                      "
                    >
                      <div>
                        <p className="font-semibold">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.quantity} ×{" "}
                          {currency(
                            item.price
                          )}
                        </p>
                      </div>

                      <span className="font-bold">
                        {currency(
                          item.quantity *
                            item.price
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Invoice totals */}

              <div
                className="
                  mt-5
                  border-t border-white/10
                  pt-4
                  text-sm
                "
              >
                <div className="flex justify-between text-slate-400">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {currency(
                      lastInvoice.subtotal
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-slate-400">
                  <span>
                    Tax
                  </span>

                  <span>
                    {currency(
                      lastInvoice.tax
                    )}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-xl font-black">
                  <span>
                    Total
                  </span>

                  <span className="text-cyan-300">
                    {currency(
                      lastInvoice.total
                    )}
                  </span>
                </div>
              </div>

              {/* Print */}

              <button
                type="button"
                onClick={
                  printInvoice
                }
                className="
                  mt-5
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  px-4 py-3
                  text-sm
                  font-bold
                  transition-all
                  hover:bg-white/10
                  hover:-translate-y-0.5
                "
              >
                <Printer
                  size={17}
                />

                Print Invoice
              </button>
            </div>
          </div>
        )}
    </div>
  );
}