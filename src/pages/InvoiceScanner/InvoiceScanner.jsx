import { useMemo, useRef, useState } from "react";
import {
  Upload,
  FileImage,
  FileText,
  ScanLine,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Minus,
  PackagePlus,
  RotateCcw,
  Download,
  Eye,
} from "lucide-react";

/* =========================================================
   DEMO OCR DATA
========================================================= */

const demoItems = [
  {
    id: 1,
    name: "Wireless Mouse",
    quantity: 5,
    unitPrice: 699,
    category: "Accessories",
    supplier: "Digital Hub",
    confidence: 96,
  },
  {
    id: 2,
    name: "Keyboard",
    quantity: 3,
    unitPrice: 1099,
    category: "Accessories",
    supplier: "Digital Hub",
    confidence: 93,
  },
  {
    id: 3,
    name: "USB-C Cable",
    quantity: 10,
    unitPrice: 349,
    category: "Accessories",
    supplier: "Tech World",
    confidence: 89,
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function InvoiceScanner({
  onAddToInventory,
}) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] =
    useState("");

  const [scanning, setScanning] =
    useState(false);

  const [scanned, setScanned] =
    useState(false);

  const [invoiceNumber, setInvoiceNumber] =
    useState("INV-2026-091");

  const [supplier, setSupplier] =
    useState("Digital Hub");

  const [items, setItems] =
    useState([]);

  const [message, setMessage] =
    useState("");

  /* =======================================================
     TOTALS
  ======================================================= */

  const totalQuantity = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [items]);

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) return;

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "File size must be below 10 MB."
      );
      return;
    }

    setFile(selectedFile);
    setScanned(false);
    setItems([]);
    setMessage("");

    if (
      selectedFile.type.startsWith(
        "image/"
      )
    ) {
      const url =
        URL.createObjectURL(
          selectedFile
        );

      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  /* =======================================================
     SCAN INVOICE
  ======================================================= */

  const scanInvoice = () => {
    if (!file) {
      setMessage(
        "Please upload an invoice first."
      );
      return;
    }

    setMessage("");
    setScanning(true);
    setScanned(false);

    // Demo mode is intentional until the backend Gemini vision
    // endpoint is available. Do not fake a delayed API response.
    setItems(demoItems);
    setScanning(false);
    setScanned(true);
    setMessage(
      "Demo scan completed. Backend invoice OCR is not connected yet."
    );
  };

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  const updateQuantity = (
    id,
    change
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Number(
                  item.quantity || 1
                ) + change
              ),
            }
          : item
      )
    );
  };

  /* =======================================================
     UPDATE ITEM
  ======================================================= */

  const updateItem = (
    id,
    field,
    value
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field ===
                  "quantity" ||
                field ===
                  "unitPrice"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeItem = (id) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetScanner = () => {
    setFile(null);
    setPreviewUrl("");
    setScanning(false);
    setScanned(false);
    setItems([]);
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const exportCSV = () => {
    if (!items.length) {
      setMessage(
        "No scanned items to export."
      );
      return;
    }

    const header =
      "Product,Quantity,Unit Price,Category,Supplier,Confidence\n";

    const rows = items
      .map(
        (item) =>
          `"${item.name}",${item.quantity},${item.unitPrice},"${item.category}","${item.supplier}",${item.confidence}%`
      )
      .join("\n");

    const blob = new Blob(
      [header + rows],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `${
      invoiceNumber ||
      "invoice"
    }-items.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =======================================================
     ADD TO INVENTORY
  ======================================================= */

  const addToInventory = () => {
    if (!items.length) {
      setMessage(
        "Scan an invoice before adding items."
      );
      return;
    }

    if (
      typeof onAddToInventory ===
      "function"
    ) {
      onAddToInventory({
        invoiceNumber,
        supplier,
        items,
        totalAmount,
      });
    }

    setMessage(
      "Items added to inventory successfully!"
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="retailiq-app min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="
            relative overflow-hidden
            rounded-[2rem]
            border border-white/10
            bg-slate-950/80
            p-6
            shadow-2xl shadow-black/30
            backdrop-blur-2xl
            sm:p-8
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
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute -bottom-32 left-1/3
              h-80 w-80
              rounded-full
              bg-blue-500/15
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

          <div
            className="
              relative
              flex flex-col gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* Heading */}

            <div>
              <div
                className="
                  mb-4 inline-flex
                  items-center gap-2
                  rounded-full
                  border border-violet-400/20
                  bg-violet-500/10
                  px-3 py-1.5
                  text-xs font-bold
                  text-violet-300
                "
              >
                <Sparkles size={14} />

                AI DOCUMENT INTELLIGENCE

                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-2 py-0.5
                    text-[10px]
                    tracking-wider
                  "
                >
                  OCR
                </span>
              </div>

              <h1
                className="
                  bg-gradient-to-r
                  from-white
                  via-violet-100
                  to-blue-300
                  bg-clip-text
                  text-3xl
                  font-black
                  tracking-tight
                  text-transparent
                  sm:text-4xl
                "
              >
                Invoice Scanner
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
                Scan supplier invoices and
                automatically extract products,
                quantities, prices and supplier
                details.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Smart OCR",
                  "Product Extraction",
                  "Confidence Detection",
                  "Inventory Sync",
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

            {/* Demo status */}

            <div
              className="
                flex items-center gap-3
                rounded-2xl
                border border-white/10
                bg-white/5
                px-4 py-3
                shadow-xl
                backdrop-blur-xl
              "
            >
              <div
                className="
                  rounded-xl
                  bg-gradient-to-br
                  from-violet-500/20
                  to-blue-500/10
                  p-2.5
                  text-violet-300
                "
              >
                <ScanLine size={22} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Scanner Status
                </p>

                <p className="font-bold text-white">
                  Demo OCR Mode
                </p>
              </div>

              <span
                className="
                  ml-2 h-2.5 w-2.5
                  animate-pulse
                  rounded-full
                  bg-emerald-400
                  shadow-lg
                  shadow-emerald-400/40
                "
              />
            </div>
          </div>
        </section>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            className={`
              flex items-center gap-3
              rounded-2xl
              border
              px-4 py-3
              text-sm
              shadow-lg
              backdrop-blur-xl
              animate-[fadeIn_0.3s_ease-out]
              ${
                message.includes(
                  "successfully"
                )
                  ? `
                    border-emerald-400/20
                    bg-emerald-950/70
                    text-emerald-200
                  `
                  : `
                    border-rose-400/20
                    bg-rose-950/70
                    text-rose-200
                  `
              }
            `}
          >
            {message.includes(
              "successfully"
            ) ? (
              <CheckCircle2
                className="shrink-0 text-emerald-400"
                size={20}
              />
            ) : (
              <XCircle
                className="shrink-0 text-rose-400"
                size={20}
              />
            )}

            <span>{message}</span>
          </div>
        )}

        {/* =================================================
            UPLOAD + PREVIEW
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ===============================================
              UPLOAD
          =============================================== */}

          <section
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
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="
                    rounded-xl
                    bg-violet-500/10
                    p-2.5
                    text-violet-300
                  "
                >
                  <Upload size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Upload Invoice
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    JPG, PNG or PDF · Maximum 10 MB
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={
                handleFileChange
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              className="
                group
                relative flex min-h-[250px]
                w-full flex-col
                items-center justify-center
                overflow-hidden
                rounded-[1.75rem]
                border border-dashed
                border-violet-400/30
                bg-gradient-to-br
                from-violet-500/5
                to-blue-500/5
                p-6
                text-center
                transition-all duration-300
                hover:-translate-y-1
                hover:border-violet-400/60
                hover:bg-violet-500/10
                hover:shadow-xl
                hover:shadow-violet-950/20
              "
            >
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-br
                  from-violet-500/0
                  via-violet-500/5
                  to-blue-500/5
                  opacity-0
                  transition
                  group-hover:opacity-100
                "
              />

              <div
                className="
                  relative
                  mb-5
                  rounded-2xl
                  bg-violet-500/15
                  p-5
                  text-violet-300
                  shadow-lg
                  shadow-violet-950/20
                  transition-all
                  duration-300
                  group-hover:scale-110
                "
              >
                <Upload size={32} />
              </div>

              <p className="relative font-bold">
                Click to upload invoice
              </p>

              <p className="relative mt-2 text-sm text-slate-400">
                Upload an invoice image or PDF
              </p>

              <p className="relative mt-4 text-[11px] text-slate-600">
                Maximum file size: 10 MB
              </p>
            </button>

            {/* Selected file */}

            {file && (
              <div
                className="
                  mt-4 flex items-center
                  justify-between
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.035]
                  p-4
                  backdrop-blur-xl
                "
              >
                <div className="flex min-w-0 items-center gap-3">
                  {file.type.startsWith(
                    "image/"
                  ) ? (
                    <FileImage
                      className="shrink-0 text-cyan-400"
                      size={25}
                    />
                  ) : (
                    <FileText
                      className="shrink-0 text-rose-400"
                      size={25}
                    />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    resetScanner
                  }
                  className="
                    rounded-xl
                    p-2
                    text-slate-400
                    transition-all
                    hover:bg-rose-500/10
                    hover:text-rose-300
                  "
                >
                  <XCircle size={19} />
                </button>
              </div>
            )}

            {/* Scan */}

            <button
              type="button"
              onClick={
                scanInvoice
              }
              disabled={
                !file || scanning
              }
              className="
                mt-5
                flex w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-gradient-to-r
                from-violet-600
                to-blue-600
                px-5 py-3.5
                font-bold
                text-white
                shadow-xl
                shadow-violet-950/20
                transition-all duration-300
                hover:-translate-y-0.5
                hover:from-violet-500
                hover:to-blue-500
                disabled:cursor-not-allowed
                disabled:opacity-40
                disabled:hover:translate-y-0
              "
            >
              {scanning ? (
                <>
                  <ScanLine
                    className="animate-pulse"
                    size={19}
                  />

                  Scanning Invoice...
                </>
              ) : (
                <>
                  <ScanLine size={19} />

                  Scan Invoice
                </>
              )}
            </button>
          </section>

          {/* ===============================================
              PREVIEW
          =============================================== */}

          <section
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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="
                      rounded-xl
                      bg-blue-500/10
                      p-2.5
                      text-blue-300
                    "
                  >
                    <Eye size={19} />
                  </div>

                  <h2 className="text-lg font-bold">
                    Invoice Preview
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Preview the uploaded document.
                </p>
              </div>

              <Eye
                className="text-slate-600"
                size={20}
              />
            </div>

            <div
              className="
                flex min-h-[250px]
                items-center justify-center
                overflow-hidden
                rounded-[1.75rem]
                border border-white/10
                bg-black/20
              "
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Invoice preview"
                  className="
                    max-h-[320px]
                    w-full
                    object-contain
                  "
                />
              ) : file ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="
                      rounded-2xl
                      bg-rose-500/10
                      p-4
                    "
                  >
                    <FileText
                      className="text-rose-400"
                      size={42}
                    />
                  </div>

                  <p className="font-bold">
                    PDF Invoice Uploaded
                  </p>

                  <p className="max-w-xs text-sm text-slate-500">
                    Preview will be available
                    after OCR integration.
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-600">
                  <FileImage
                    className="mx-auto mb-3"
                    size={48}
                  />

                  <p>
                    No invoice uploaded yet
                  </p>

                  <p className="mt-1 text-xs text-slate-700">
                    Your document preview
                    will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            INVOICE DETAILS
        ================================================= */}

        <section
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
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div
                className="
                  rounded-xl
                  bg-blue-500/10
                  p-2.5
                  text-blue-300
                "
              >
                <FileText size={19} />
              </div>

              <h2 className="text-lg font-bold">
                Invoice Details
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Review the information extracted
              from the invoice.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice Number
              </label>

              <input
                value={invoiceNumber}
                onChange={(e) =>
                  setInvoiceNumber(
                    e.target.value
                  )
                }
                className="
                  mt-2 w-full
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.04]
                  px-4 py-3
                  text-white
                  outline-none
                  transition-all
                  placeholder:text-slate-600
                  focus:border-violet-400/40
                  focus:bg-white/[0.07]
                  focus:ring-4
                  focus:ring-violet-400/5
                "
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supplier
              </label>

              <input
                value={supplier}
                onChange={(e) =>
                  setSupplier(
                    e.target.value
                  )
                }
                className="
                  mt-2 w-full
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.04]
                  px-4 py-3
                  text-white
                  outline-none
                  transition-all
                  focus:border-violet-400/40
                  focus:bg-white/[0.07]
                  focus:ring-4
                  focus:ring-violet-400/5
                "
              />
            </div>
          </div>
        </section>

        {/* =================================================
            EXTRACTED PRODUCTS
        ================================================= */}

        <section
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
              mb-5 flex flex-col gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="
                    rounded-xl
                    bg-cyan-500/10
                    p-2.5
                    text-cyan-300
                  "
                >
                  <PackagePlus size={19} />
                </div>

                <h2 className="text-lg font-bold">
                  Extracted Products
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Review and edit the products detected
                from the invoice.
              </p>
            </div>

            {scanned && (
              <div
                className="
                  inline-flex
                  items-center gap-2
                  self-start
                  rounded-full
                  border border-emerald-400/20
                  bg-emerald-500/10
                  px-4 py-2
                  text-sm font-semibold
                  text-emerald-300
                  sm:self-auto
                "
              >
                <CheckCircle2 size={15} />

                Scan Complete
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div
              className="
                rounded-[1.75rem]
                border border-dashed
                border-white/10
                bg-white/[0.02]
                py-16
                text-center
              "
            >
              <div
                className="
                  mx-auto mb-4
                  flex h-16 w-16
                  items-center justify-center
                  rounded-2xl
                  bg-white/5
                "
              >
                <PackagePlus
                  className="text-slate-600"
                  size={30}
                />
              </div>

              <p className="font-semibold text-slate-300">
                No products extracted yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Upload and scan an invoice to
                see detected products.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="
                    group
                    rounded-[1.75rem]
                    border border-white/10
                    bg-white/[0.035]
                    p-4
                    transition-all duration-300
                    hover:border-violet-400/20
                    hover:bg-white/[0.05]
                    hover:shadow-xl
                    hover:shadow-violet-950/10
                  "
                >
                  <div
                    className="
                      grid gap-4
                      lg:grid-cols-[1.5fr_1fr_1fr_auto]
                      lg:items-center
                    "
                  >
                    {/* Product */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </label>

                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "name",
                            e.target.value
                          )
                        }
                        className="
                          mt-1 w-full
                          rounded-xl
                          border border-white/10
                          bg-slate-950/80
                          px-3 py-2.5
                          text-sm text-white
                          outline-none
                          transition
                          focus:border-violet-400/40
                          focus:ring-4
                          focus:ring-violet-400/5
                        "
                      />
                    </div>

                    {/* Quantity */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Quantity
                      </label>

                      <div
                        className="
                          mt-1 flex
                          items-center
                          rounded-xl
                          border border-white/10
                          bg-slate-950/80
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              -1
                            )
                          }
                          className="
                            rounded-l-xl
                            p-2.5
                            text-slate-400
                            transition
                            hover:bg-white/5
                            hover:text-white
                          "
                        >
                          <Minus size={15} />
                        </button>

                        <span
                          className="
                            min-w-[40px]
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
                            updateQuantity(
                              item.id,
                              1
                            )
                          }
                          className="
                            rounded-r-xl
                            p-2.5
                            text-slate-400
                            transition
                            hover:bg-white/5
                            hover:text-white
                          "
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Price */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unit Price
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          item.unitPrice
                        }
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            e.target.value
                          )
                        }
                        className="
                          mt-1 w-full
                          rounded-xl
                          border border-white/10
                          bg-slate-950/80
                          px-3 py-2.5
                          text-sm text-white
                          outline-none
                          transition
                          focus:border-violet-400/40
                          focus:ring-4
                          focus:ring-violet-400/5
                        "
                      />
                    </div>

                    {/* Delete */}

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-transparent
                        p-3
                        text-rose-400
                        transition-all
                        hover:border-rose-400/10
                        hover:bg-rose-500/10
                        hover:text-rose-300
                      "
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Metadata */}

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
                    <span
                      className="
                        rounded-full
                        border border-white/10
                        bg-white/5
                        px-3 py-1.5
                        text-slate-300
                      "
                    >
                      {item.category}
                    </span>

                    <span
                      className="
                        rounded-full
                        border border-white/10
                        bg-white/5
                        px-3 py-1.5
                        text-slate-300
                      "
                    >
                      {item.supplier}
                    </span>

                    <span
                      className="
                        rounded-full
                        border border-emerald-400/10
                        bg-emerald-500/10
                        px-3 py-1.5
                        font-semibold
                        text-emerald-300
                      "
                    >
                      {item.confidence}%
                      confidence
                    </span>

                    <div
                      className="
                        h-1.5
                        min-w-[100px]
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/10
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-emerald-500
                          to-cyan-400
                          transition-all
                          duration-700
                        "
                        style={{
                          width: `${item.confidence}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Products */}

          <div
            className="
              group
              rounded-[1.75rem]
              border border-white/10
              bg-slate-950/75
              p-5
              shadow-xl shadow-black/10
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-1
              hover:border-violet-400/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Products
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {items.length}
            </p>

            <p className="mt-1 text-xs text-violet-300">
              Extracted items
            </p>
          </div>

          {/* Quantity */}

          <div
            className="
              group
              rounded-[1.75rem]
              border border-white/10
              bg-slate-950/75
              p-5
              shadow-xl shadow-black/10
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-1
              hover:border-cyan-400/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Quantity
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              {totalQuantity}
            </p>

            <p className="mt-1 text-xs text-cyan-300">
              Units detected
            </p>
          </div>

          {/* Amount */}

          <div
            className="
              group
              rounded-[1.75rem]
              border border-white/10
              bg-slate-950/75
              p-5
              shadow-xl shadow-black/10
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-1
              hover:border-blue-400/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invoice Amount
            </p>

            <p className="mt-2 text-3xl font-black text-white">
              ₹
              {totalAmount.toLocaleString(
                "en-IN"
              )}
            </p>

            <p className="mt-1 text-xs text-blue-300">
              Estimated value
            </p>
          </div>

          {/* Status */}

          <div
            className="
              group
              rounded-[1.75rem]
              border border-white/10
              bg-slate-950/75
              p-5
              shadow-xl shadow-black/10
              backdrop-blur-xl
              transition-all duration-300
              hover:-translate-y-1
              hover:border-emerald-400/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>

            <p
              className={`
                mt-2 text-3xl
                font-black
                ${
                  scanned
                    ? "text-emerald-400"
                    : "text-amber-300"
                }
              `}
            >
              {scanned
                ? "Verified"
                : "Pending"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              OCR processing state
            </p>
          </div>
        </section>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <section
          className="
            flex flex-col gap-4
            rounded-[2rem]
            border border-white/10
            bg-slate-950/75
            p-5
            shadow-2xl shadow-black/20
            backdrop-blur-2xl
            sm:flex-row
            sm:flex-wrap
            sm:items-center
            sm:justify-between
            sm:p-6
          "
        >
          <div>
            <div className="flex items-center gap-3">
              <div
                className="
                  rounded-xl
                  bg-emerald-500/10
                  p-2.5
                  text-emerald-300
                "
              >
                <PackagePlus size={19} />
              </div>

              <h2 className="font-bold">
                Inventory Actions
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Add extracted products directly
              to your inventory.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* Export */}

            <button
              type="button"
              onClick={
                exportCSV
              }
              disabled={
                !items.length
              }
              className="
                flex items-center
                justify-center
                gap-2
                rounded-xl
                border border-white/10
                bg-white/5
                px-4 py-3
                text-sm font-semibold
                text-slate-300
                transition-all
                hover:bg-white/10
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <Download size={16} />

              Export CSV
            </button>

            {/* Reset */}

            <button
              type="button"
              onClick={
                resetScanner
              }
              className="
                flex items-center
                justify-center
                gap-2
                rounded-xl
                border border-white/10
                bg-white/5
                px-4 py-3
                text-sm font-semibold
                text-slate-300
                transition-all
                hover:bg-white/10
                hover:text-white
              "
            >
              <RotateCcw size={16} />

              Reset
            </button>

            {/* Add inventory */}

            <button
              type="button"
              onClick={
                addToInventory
              }
              disabled={
                !items.length
              }
              className="
                flex items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-cyan-600
                px-5 py-3
                text-sm font-bold
                text-white
                shadow-xl
                shadow-emerald-950/20
                transition-all duration-300
                hover:-translate-y-0.5
                hover:from-emerald-500
                hover:to-cyan-500
                disabled:cursor-not-allowed
                disabled:from-slate-700
                disabled:to-slate-700
                disabled:text-slate-500
                disabled:shadow-none
              "
            >
              <PackagePlus size={17} />

              Add to Inventory
            </button>
          </div>
        </section>

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <div
          className="
            rounded-2xl
            border border-violet-400/10
            bg-slate-950/50
            px-5 py-4
            text-sm
            leading-6
            text-slate-500
            shadow-lg
            backdrop-blur-xl
          "
        >
          <span className="font-bold text-violet-300">
            AI/OCR Ready:
          </span>{" "}
          This frontend currently uses demo
          extraction data. Later, the upload
          can be connected to an OCR/AI backend
          to extract real invoice details
          automatically.
        </div>
      </div>
    </div>
  );
}