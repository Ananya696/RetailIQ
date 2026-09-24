import { useState } from "react";

function Inventory({
  products,
  updateProductStock,
  addProduct,
  updateProduct,
  deleteProduct,
}) {
  // ==================================================
  // SEARCH & FILTER
  // ==================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");
  const [selectedStockStatus, setSelectedStockStatus] =
    useState("All Stock");

  // ==================================================
  // MODALS
  // ==================================================

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ==================================================
  // NEW PRODUCT
  // ==================================================

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Electronics",
    supplier: "",
    price: "",
    stock: "",
  });

  // ==================================================
  // EDIT PRODUCT
  // ==================================================

  const [editingProduct, setEditingProduct] = useState({
    id: null,
    name: "",
    category: "Electronics",
    supplier: "",
    price: "",
    stock: "",
  });

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  const [deletingProduct, setDeletingProduct] = useState(null);

  // ==================================================
  // STATISTICS
  // ==================================================

  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const inStockProducts = products.filter(
    (product) => product.stock > 5
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0
  ).length;

  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0
  );

  // ==================================================
  // INPUT HANDLERS
  // ==================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewProduct((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    setEditingProduct((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==================================================
  // ADD PRODUCT
  // ==================================================

  const handleAddProduct = (e) => {
    e.preventDefault();

    if (!newProduct.name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    if (!newProduct.supplier.trim()) {
      alert("Please enter a supplier name.");
      return;
    }

    if (
      newProduct.price === "" ||
      Number(newProduct.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      newProduct.stock === "" ||
      Number(newProduct.stock) < 0
    ) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      supplier: newProduct.supplier.trim(),
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
    };

    addProduct(product);

    setNewProduct({
      name: "",
      category: "Electronics",
      supplier: "",
      price: "",
      stock: "",
    });

    setShowModal(false);
  };

  // ==================================================
  // EDIT PRODUCT
  // ==================================================

  const handleEditProduct = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      supplier: product.supplier,
      price: product.price,
      stock: product.stock,
    });

    setShowEditModal(true);
  };

  // ==================================================
  // SAVE EDIT
  // ==================================================

  const handleSaveEdit = (e) => {
    e.preventDefault();

    if (!editingProduct.name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    if (!editingProduct.supplier.trim()) {
      alert("Please enter a supplier name.");
      return;
    }

    if (
      editingProduct.price === "" ||
      Number(editingProduct.price) < 0
    ) {
      alert("Please enter a valid price.");
      return;
    }

    if (
      editingProduct.stock === "" ||
      Number(editingProduct.stock) < 0
    ) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    updateProduct({
      id: editingProduct.id,
      name: editingProduct.name.trim(),
      category: editingProduct.category,
      supplier: editingProduct.supplier.trim(),
      price: Number(editingProduct.price),
      stock: Number(editingProduct.stock),
    });

    setShowEditModal(false);
  };

  // ==================================================
  // DELETE
  // ==================================================

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;

    deleteProduct(deletingProduct.id);

    setDeletingProduct(null);
    setShowDeleteModal(false);
  };

  // ==================================================
  // UPDATE STOCK
  // ==================================================

  const updateStock = (id, change) => {
    updateProductStock(id, change);
  };

  // ==================================================
  // STOCK STATUS
  // ==================================================

  const getStatus = (stock) => {
    if (stock === 0) {
      return {
        text: "Out of Stock",
        className:
          "bg-red-50/90 text-red-600 border-red-200",
        dot: "bg-red-500",
      };
    }

    if (stock <= 5) {
      return {
        text: "Low Stock",
        className:
          "bg-amber-50/90 text-amber-600 border-amber-200",
        dot: "bg-amber-500",
      };
    }

    return {
      text: "In Stock",
      className:
        "bg-emerald-50/90 text-emerald-600 border-emerald-200",
      dot: "bg-emerald-500",
    };
  };

  // ==================================================
  // FILTER
  // ==================================================

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.supplier.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category === selectedCategory;

    const matchesStock =
      selectedStockStatus === "All Stock" ||
      (selectedStockStatus === "In Stock" &&
        product.stock > 5) ||
      (selectedStockStatus === "Low Stock" &&
        product.stock > 0 &&
        product.stock <= 5) ||
      (selectedStockStatus === "Out of Stock" &&
        product.stock === 0);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStock
    );
  });

  // ==================================================
  // CLOSE ADD MODAL
  // ==================================================

  const closeAddModal = () => {
    setShowModal(false);

    setNewProduct({
      name: "",
      category: "Electronics",
      supplier: "",
      price: "",
      stock: "",
    });
  };

  // ==================================================
  // PRODUCT CARD
  // ==================================================

  const ProductCard = ({ product }) => {
    const status = getStatus(product.stock);

    return (
      <div
        className="
          bg-white/90
          backdrop-blur-xl
          rounded-2xl
          border border-white/50
          shadow-xl
          p-5

          transition-all
          duration-300
          ease-out

          hover:-translate-y-2
          hover:shadow-2xl

          animate-[fadeIn_0.5s_ease-out]
        "
      >
        {/* TOP */}

        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                border
                border-blue-100
                flex
                items-center
                justify-center
                text-xl
                shadow-sm
              "
            >
              📦
            </div>

            <div>
              <h3 className="font-bold text-gray-900">
                {product.name}
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                {product.category}
              </p>
            </div>
          </div>

          <span
            className={`
              ${status.className}
              border
              px-2.5
              py-1
              rounded-full
              text-xs
              font-semibold
              whitespace-nowrap
            `}
          >
            {status.text}
          </span>
        </div>

        {/* DETAILS */}

        <div
          className="
            grid
            grid-cols-2
            gap-4
            mt-5
            py-4
            border-y
            border-gray-200/70
          "
        >
          <div>
            <p className="text-xs text-gray-500">
              Price
            </p>

            <p className="font-bold text-gray-900 mt-1">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Supplier
            </p>

            <p
              className="
                font-medium
                text-gray-700
                mt-1
                truncate
              "
            >
              {product.supplier}
            </p>
          </div>
        </div>

        {/* STOCK */}

        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-xs text-gray-500">
              Current Stock
            </p>

            <p className="text-xl font-bold text-gray-900">
              {product.stock}

              <span className="text-xs text-gray-400 ml-1 font-normal">
                units
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateStock(product.id, -1)
              }
              disabled={product.stock === 0}
              className="
                w-9
                h-9
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-600
                font-bold
                hover:bg-gray-100
                disabled:opacity-30
                transition-all
                active:scale-90
              "
            >
              −
            </button>

            <button
              onClick={() =>
                updateStock(product.id, 1)
              }
              className="
                w-9
                h-9
                rounded-xl
                bg-blue-600
                text-white
                font-bold
                shadow-md
                shadow-blue-900/20
                hover:bg-blue-500
                hover:-translate-y-0.5
                transition-all
                active:scale-90
              "
            >
              +
            </button>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex gap-3 mt-5">
          <button
            onClick={() =>
              handleEditProduct(product)
            }
            className="
              flex-1
              py-2.5
              rounded-xl
              bg-blue-50
              text-blue-600
              font-semibold
              text-sm
              border
              border-blue-100
              hover:bg-blue-100
              hover:-translate-y-0.5
              transition-all
            "
          >
            ✏️ Edit
          </button>

          <button
            onClick={() =>
              handleDeleteProduct(product)
            }
            className="
              flex-1
              py-2.5
              rounded-xl
              bg-red-50
              text-red-500
              font-semibold
              text-sm
              border
              border-red-100
              hover:bg-red-100
              hover:-translate-y-0.5
              transition-all
            "
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    );
  };

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div
      className="
        min-h-screen
        bg-transparent
        p-4
        sm:p-6
        lg:p-8
        animate-[fadeIn_0.5s_ease-out]
      "
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
          mb-7
        "
      >
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-white
                drop-shadow-lg
              "
            >
              Inventory
            </h1>

            <span
              className="
                bg-blue-500/20
                text-blue-200
                border
                border-blue-300/20
                text-xs
                font-semibold
                px-2.5
                py-1
                rounded-full
                backdrop-blur-md
              "
            >
              RetailIQ
            </span>
          </div>

          <p className="text-sm text-white/65 mt-1">
            Manage products, stock and suppliers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="
            w-full
            sm:w-auto
            bg-blue-600
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
            shadow-lg
            shadow-blue-900/30

            border
            border-blue-400/30

            hover:bg-blue-500
            hover:-translate-y-1
            hover:shadow-xl

            transition-all
            duration-300

            active:scale-95
          "
        >
          + Add Product
        </button>
      </div>

      {/* ==================================================
          STAT CARDS
      ================================================== */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-3
          sm:gap-5
          mb-6
        "
      >
        {/* TOTAL */}

        <InventoryStat
          title="Total Products"
          value={totalProducts}
          subtitle="Products listed"
          icon="📦"
          iconClass="bg-blue-50 text-blue-600"
        />

        {/* IN STOCK */}

        <InventoryStat
          title="In Stock"
          value={inStockProducts}
          subtitle="Healthy stock"
          icon="✓"
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />

        {/* LOW */}

        <InventoryStat
          title="Low Stock"
          value={lowStockProducts}
          subtitle="Needs attention"
          icon="⚠️"
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-500"
        />

        {/* OUT */}

        <InventoryStat
          title="Out of Stock"
          value={outOfStockProducts}
          subtitle="Restock required"
          icon="!"
          iconClass="bg-red-50 text-red-500"
          valueClass="text-red-500"
        />
      </div>

      {/* ==================================================
          INVENTORY OVERVIEW
      ================================================== */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-5
          mb-6
        "
      >
        {/* VALUE */}

        <div
          className="
            rounded-2xl
            p-6
            text-white

            bg-gradient-to-br
            from-blue-600/95
            to-indigo-700/95

            border
            border-white/20

            shadow-xl
            shadow-blue-950/20

            backdrop-blur-xl

            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <p className="text-blue-100 text-sm">
            Total Inventory Value
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold mt-2">
            ₹{inventoryValue.toLocaleString("en-IN")}
          </h2>

          <p className="text-blue-100 text-xs mt-3">
            Estimated value of current stock
          </p>
        </div>

        {/* UNITS */}

        <div
          className="
            bg-white/90
            backdrop-blur-xl
            rounded-2xl
            border
            border-white/50
            shadow-xl
            p-6

            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Total Units
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                {totalUnits}
              </h2>
            </div>

            <div
              className="
                text-4xl
                w-14
                h-14
                rounded-2xl
                bg-blue-50
                flex
                items-center
                justify-center
              "
            >
              📊
            </div>
          </div>

          <div
            className="
              mt-5
              h-2
              bg-gray-100
              rounded-full
              overflow-hidden
            "
          >
            <div
              className="
                h-full
                bg-blue-600
                rounded-full
                transition-all
                duration-700
              "
              style={{
                width:
                  totalUnits > 0
                    ? `${Math.min(totalUnits, 100)}%`
                    : "0%",
              }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Units currently available
          </p>
        </div>
      </div>

      {/* ==================================================
          ALERT
      ================================================== */}

      {(lowStockProducts > 0 ||
        outOfStockProducts > 0) && (
        <div
          className="
            bg-amber-50/90
            backdrop-blur-xl
            border
            border-amber-200
            rounded-2xl
            p-4
            sm:p-5
            mb-6
            shadow-lg
            shadow-amber-900/5
            animate-[fadeIn_0.5s_ease-out]
          "
        >
          <div className="flex gap-3 items-start">
            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-amber-100
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              ⚠️
            </div>

            <div>
              <h3 className="font-bold text-amber-900">
                Inventory needs attention
              </h3>

              <p className="text-sm text-amber-700 mt-1">
                {outOfStockProducts > 0 &&
                  `${outOfStockProducts} out of stock`}

                {outOfStockProducts > 0 &&
                  lowStockProducts > 0 &&
                  " • "}

                {lowStockProducts > 0 &&
                  `${lowStockProducts} running low`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SEARCH & FILTER
      ================================================== */}

      <div
        className="
          bg-white/90
          backdrop-blur-xl
          rounded-2xl
          border
          border-white/50
          shadow-xl
          p-4
          sm:p-5
          mb-6
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
          {/* SEARCH */}

          <div className="relative">
            <span
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                py-3
                pl-10
                pr-4
                text-sm
                bg-gray-50/80

                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:border-transparent
                focus:bg-white

                transition-all
              "
            />
          </div>

          {/* CATEGORY */}

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value)
            }
            className="
              border
              border-gray-200
              rounded-xl
              p-3
              text-sm
              bg-gray-50/80

              focus:outline-none
              focus:ring-2
              focus:ring-blue-500

              cursor-pointer
            "
          >
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Accessories</option>
            <option>Groceries</option>
            <option>Clothing</option>
          </select>

          {/* STOCK */}

          <select
            value={selectedStockStatus}
            onChange={(e) =>
              setSelectedStockStatus(e.target.value)
            }
            className="
              border
              border-gray-200
              rounded-xl
              p-3
              text-sm
              bg-gray-50/80

              focus:outline-none
              focus:ring-2
              focus:ring-blue-500

              cursor-pointer
            "
          >
            <option>All Stock</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ==================================================
          RESULTS
      ================================================== */}

      <div
        className="
          flex
          justify-between
          items-center
          mb-4
        "
      >
        <p className="text-sm text-white/70">
          Showing{" "}
          <span className="font-bold text-white">
            {filteredProducts.length}
          </span>{" "}
          products
        </p>

        {(searchTerm ||
          selectedCategory !== "All Categories" ||
          selectedStockStatus !== "All Stock") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All Categories");
              setSelectedStockStatus("All Stock");
            }}
            className="
              text-xs
              text-blue-300
              font-semibold
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

          bg-white/90
          backdrop-blur-xl

          rounded-2xl

          border
          border-white/50

          shadow-xl

          overflow-hidden
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead
              className="
                bg-gray-50/90
                border-b
                border-gray-200
              "
            >
              <tr>
                {[
                  "Product",
                  "Category",
                  "Supplier",
                  "Price",
                  "Stock",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="
                      text-left
                      p-4
                      text-xs
                      uppercase
                      tracking-wider
                      text-gray-500
                      font-semibold
                    "
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const status = getStatus(product.stock);

                  return (
                    <tr
                      key={product.id}
                      className="
                        border-b
                        border-gray-100
                        last:border-0

                        hover:bg-blue-50/70

                        transition-all
                        duration-300
                      "
                    >
                      {/* PRODUCT */}

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              w-10
                              h-10
                              rounded-xl
                              bg-blue-50
                              border
                              border-blue-100
                              flex
                              items-center
                              justify-center
                            "
                          >
                            📦
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {product.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              ID #{product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="p-4 text-sm text-gray-600">
                        {product.category}
                      </td>

                      {/* SUPPLIER */}

                      <td className="p-4 text-sm text-gray-600">
                        {product.supplier}
                      </td>

                      {/* PRICE */}

                      <td className="p-4 font-semibold text-gray-800">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>

                      {/* STOCK */}

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateStock(product.id, -1)
                            }
                            disabled={product.stock === 0}
                            className="
                              w-8
                              h-8
                              rounded-lg
                              border
                              border-gray-200
                              bg-white
                              font-bold
                              text-gray-600
                              hover:bg-gray-100
                              disabled:opacity-30
                              transition
                            "
                          >
                            −
                          </button>

                          <span
                            className="
                              w-8
                              text-center
                              font-bold
                              text-gray-800
                            "
                          >
                            {product.stock}
                          </span>

                          <button
                            onClick={() =>
                              updateStock(product.id, 1)
                            }
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-blue-600
                              text-white
                              font-bold
                              hover:bg-blue-500
                              transition
                            "
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="p-4">
                        <span
                          className={`
                            ${status.className}
                            border
                            px-3
                            py-1.5
                            rounded-full
                            text-xs
                            font-semibold
                            inline-flex
                            items-center
                            gap-2
                          `}
                        >
                          <span
                            className={`
                              w-2
                              h-2
                              rounded-full
                              ${status.dot}
                            `}
                          />

                          {status.text}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleEditProduct(product)
                            }
                            className="
                              px-3
                              py-2
                              rounded-lg
                              bg-blue-50
                              text-blue-600
                              text-sm
                              font-semibold
                              hover:bg-blue-100
                              transition
                            "
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProduct(product)
                            }
                            className="
                              px-3
                              py-2
                              rounded-lg
                              bg-red-50
                              text-red-500
                              text-sm
                              font-semibold
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
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="p-16 text-center"
                  >
                    <div className="text-5xl mb-4">
                      📦
                    </div>

                    <h3 className="font-bold text-gray-800">
                      No products found
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================
          MOBILE PRODUCT CARDS
      ================================================== */}

      <div
        className="
          lg:hidden
          grid
          grid-cols-1
          sm:grid-cols-2
          gap-4
        "
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        ) : (
          <div
            className="
              sm:col-span-2
              bg-white/90
              backdrop-blur-xl
              rounded-2xl
              p-12
              text-center
              border
              border-white/50
              shadow-xl
            "
          >
            <div className="text-5xl mb-4">
              📦
            </div>

            <h3 className="font-bold text-gray-800">
              No products found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Try changing your filters.
            </p>
          </div>
        )}
      </div>

      {/* ==================================================
          ADD PRODUCT MODAL
      ================================================== */}

      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-50

            bg-black/60
            backdrop-blur-md

            flex
            items-center
            justify-center

            p-4
          "
        >
          <div
            className="
              bg-slate-950/95
              backdrop-blur-2xl

              text-white

              w-full
              max-w-lg
              max-h-[90vh]
              overflow-y-auto

              rounded-3xl

              border
              border-white/10

              shadow-2xl

              p-5
              sm:p-7

              animate-[scaleIn_0.3s_ease-out]
            "
          >
            <ModalHeader
              title="Add New Product"
              subtitle="Add product details to inventory."
              onClose={closeAddModal}
            />

            <form
              onSubmit={handleAddProduct}
              className="space-y-5"
            >
              <FormInput
                label="Product Name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                placeholder="e.g. Smart Watch"
              />

              <FormSelect
                label="Category"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                options={[
                  "Electronics",
                  "Accessories",
                  "Groceries",
                  "Clothing",
                ]}
              />

              <FormInput
                label="Supplier"
                name="supplier"
                value={newProduct.supplier}
                onChange={handleInputChange}
                placeholder="e.g. ABC Traders"
              />

              <FormInput
                label="Price (₹)"
                name="price"
                type="number"
                value={newProduct.price}
                onChange={handleInputChange}
                placeholder="Enter price"
              />

              <FormInput
                label="Stock Quantity"
                name="stock"
                type="number"
                value={newProduct.stock}
                onChange={handleInputChange}
                placeholder="Enter quantity"
              />

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="
                    flex-1
                    border
                    border-white/10
                    py-3
                    rounded-xl
                    font-semibold
                    text-white/70
                    hover:bg-white/10
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="
                    flex-1
                    bg-blue-600
                    text-white
                    py-3
                    rounded-xl
                    font-semibold
                    hover:bg-blue-500
                    transition
                    shadow-lg
                    shadow-blue-900/30
                  "
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          EDIT MODAL
      ================================================== */}

      {showEditModal && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/60
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              bg-slate-950/95
              backdrop-blur-2xl
              text-white

              w-full
              max-w-lg
              max-h-[90vh]
              overflow-y-auto

              rounded-3xl
              border
              border-white/10
              shadow-2xl

              p-5
              sm:p-7

              animate-[scaleIn_0.3s_ease-out]
            "
          >
            <ModalHeader
              title="Edit Product ✏️"
              subtitle="Update product information."
              onClose={() => setShowEditModal(false)}
            />

            <form
              onSubmit={handleSaveEdit}
              className="space-y-5"
            >
              <FormInput
                label="Product Name"
                name="name"
                value={editingProduct.name}
                onChange={handleEditInputChange}
              />

              <FormSelect
                label="Category"
                name="category"
                value={editingProduct.category}
                onChange={handleEditInputChange}
                options={[
                  "Electronics",
                  "Accessories",
                  "Groceries",
                  "Clothing",
                ]}
              />

              <FormInput
                label="Supplier"
                name="supplier"
                value={editingProduct.supplier}
                onChange={handleEditInputChange}
              />

              <FormInput
                label="Price (₹)"
                name="price"
                type="number"
                value={editingProduct.price}
                onChange={handleEditInputChange}
              />

              <FormInput
                label="Stock Quantity"
                name="stock"
                type="number"
                value={editingProduct.stock}
                onChange={handleEditInputChange}
              />

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                  className="
                    flex-1
                    border
                    border-white/10
                    py-3
                    rounded-xl
                    font-semibold
                    text-white/70
                    hover:bg-white/10
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="
                    flex-1
                    bg-emerald-600
                    text-white
                    py-3
                    rounded-xl
                    font-semibold
                    hover:bg-emerald-500
                    transition
                    shadow-lg
                    shadow-emerald-900/20
                  "
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {showDeleteModal && deletingProduct && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/60
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              bg-slate-950/95
              backdrop-blur-2xl
              text-white

              w-full
              max-w-md

              rounded-3xl
              border
              border-white/10

              shadow-2xl

              p-6
              sm:p-8

              text-center

              animate-[scaleIn_0.3s_ease-out]
            "
          >
            <div
              className="
                w-16
                h-16
                mx-auto
                rounded-2xl
                bg-red-500/10
                border
                border-red-500/20
                flex
                items-center
                justify-center
                text-3xl
                mb-5
              "
            >
              🗑️
            </div>

            <h2 className="text-xl sm:text-2xl font-bold">
              Delete Product?
            </h2>

            <p className="text-sm text-white/60 mt-3">
              You're about to delete{" "}
              <span className="font-semibold text-white">
                "{deletingProduct.name}"
              </span>
              .
            </p>

            <p className="text-xs text-white/40 mt-2">
              This action cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-7">
              <button
                onClick={() => {
                  setDeletingProduct(null);
                  setShowDeleteModal(false);
                }}
                className="
                  flex-1
                  border
                  border-white/10
                  py-3
                  rounded-xl
                  font-semibold
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
                  bg-red-600
                  text-white
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-red-500
                  transition
                  shadow-lg
                  shadow-red-900/20
                "
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================
// INVENTORY STAT
// ==================================================

function InventoryStat({
  title,
  value,
  subtitle,
  icon,
  iconClass,
  valueClass = "text-gray-900",
}) {
  return (
    <div
      className="
        bg-white/90
        backdrop-blur-xl

        rounded-2xl

        p-4
        sm:p-5

        border
        border-white/50

        shadow-xl

        transition-all
        duration-300

        hover:-translate-y-2
        hover:shadow-2xl
      "
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">
            {title}
          </p>

          <h2
            className={`
              text-2xl
              sm:text-3xl
              font-bold
              mt-2
              ${valueClass}
            `}
          >
            {value}
          </h2>
        </div>

        <div
          className={`
            w-9
            h-9
            sm:w-11
            sm:h-11
            rounded-xl
            flex
            items-center
            justify-center
            text-lg
            font-bold
            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {subtitle}
      </p>
    </div>
  );
}

// ==================================================
// MODAL HEADER
// ==================================================

function ModalHeader({
  title,
  subtitle,
  onClose,
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">
          {title}
        </h2>

        <p className="text-sm text-white/50 mt-1">
          {subtitle}
        </p>
      </div>

      <button
        onClick={onClose}
        className="
          w-9
          h-9
          rounded-xl
          bg-white/10
          text-white/60
          text-xl
          hover:bg-red-500/20
          hover:text-red-300
          transition
        "
      >
        ×
      </button>
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
          block
          text-sm
          font-semibold
          text-white/80
          mb-2
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
        min={type === "number" ? "0" : undefined}
        className="
          w-full
          border
          border-white/10
          rounded-xl
          p-3

          text-sm
          text-white

          bg-white/5

          placeholder:text-white/30

          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-400

          transition-all
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
          block
          text-sm
          font-semibold
          text-white/80
          mb-2
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
          border
          border-white/10
          rounded-xl
          p-3

          text-sm
          text-white

          bg-slate-900

          focus:outline-none
          focus:ring-2
          focus:ring-blue-500

          transition
          cursor-pointer
        "
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-slate-900 text-white"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Inventory;