import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdminProducts = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("http://localhost:5000/api/products");
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImage("");
    setCategory("");
    setBrand("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditId(product._id);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price || "");
    setStock(product.stock || "");
    setImage(product.images?.[0] || "");
    setCategory(product.category || "");
    setBrand(product.brand || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !description || !price || !stock || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const productData = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      brand: brand || "Generic",
      images: image ? [image] : ["https://via.placeholder.com/150"],
    };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editId) {
        await axios.put(`http://localhost:5000/api/products/${editId}`, productData, config);
        toast.success("Product updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/products", productData, config);
        toast.success("Product created successfully!");
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.delete(`http://localhost:5000/api/products/${id}`, config);
        toast.success("Product deleted successfully!");
        fetchProducts();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  // Get unique categories for filtering
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/admin/dashboard"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Admin Product Management
          </h1>
          <p className="text-gray-500 mt-1">
            Create, edit, and delete products in your digital store.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span className="text-lg">+</span> Add New Product
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-800"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main product listing grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading your catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
            <span className="text-4xl">📦</span>
            <h3 className="text-lg font-bold text-gray-800 mt-4">No products found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "All"
                ? "No products match your current search filters. Try resetting them."
                : "Your product catalog is empty. Click the button above to add your first product."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => {
              const mainImage = prod.images?.[0] || "https://via.placeholder.com/150";
              const isLowStock = prod.stock <= (prod.lowStockThreshold || 10);

              return (
                <div
                  key={prod._id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 flex flex-col justify-between overflow-hidden transition-all duration-200 group"
                >
                  <div className="relative">
                    <img
                      src={mainImage}
                      alt={prod.name}
                      className="h-48 w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                      <span className="bg-black/75 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        {prod.category}
                      </span>
                      {isLowStock && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 mb-1">
                        {prod.name}
                      </h3>
                      {prod.brand && (
                        <p className="text-xs text-blue-600 font-medium mb-2">
                          {prod.brand}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs line-clamp-2 mb-4">
                        {prod.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-3 mb-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Price</p>
                          <p className="font-extrabold text-blue-600 text-lg">
                            ${prod.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Stock</p>
                          <p
                            className={`font-bold text-sm ${
                              isLowStock ? "text-red-500" : "text-gray-700"
                            }`}
                          >
                            {prod.stock} units
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-yellow-200/50"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-red-200/50"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog for Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Gaming Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe your product's key features, specifications, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Electronics, Apparel, etc."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sony, Nike"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition cursor-pointer text-sm"
                >
                  {editId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
