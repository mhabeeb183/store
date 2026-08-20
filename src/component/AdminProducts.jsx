import React, { useEffect, useState } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";

const AdminProducts = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [editId, setEditId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !price || !image) {
      setError("All fields are required.");
      return;
    }

    const token = localStorage.getItem("token");
    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PUT" : "POST";

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price.startsWith("RS ") ? price : `RS ${price}`);
      formData.append("image", image); // File object or original string URL

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save product.");
      }

      setSuccess(editId ? "Product updated successfully!" : "Product added successfully!");
      setName("");
      setPrice("");
      setImage(null);
      const fileInput = document.getElementById("admin-image-file");
      if (fileInput) fileInput.value = "";
      setEditId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleEditClick = (prod) => {
    setEditId(prod.id);
    setName(prod.name);
    setPrice(prod.price);
    setImage(prod.image);
    setError("");
    setSuccess("");
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      setSuccess("Product deleted successfully!");
      if (editId === id) {
        handleCancelEdit();
      }
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setName("");
    setPrice("");
    setImage("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Form Section */}
          <div className="w-full md:w-1/3 shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-6">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6">
                {editId ? "Edit Product" : "Add New Product"}
              </h2>

              {error && (
                <div className="bg-red-50 text-red-700 border border-red-100 text-sm py-2.5 px-4 rounded-xl mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 border border-green-100 text-sm py-2.5 px-4 rounded-xl mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fresh Red Strawberries"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-1.5">Price</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. RS 150"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                  />
                </div>

                 <div>
                   <label className="block text-slate-700 text-sm font-semibold mb-1.5">
                     Product Image {editId ? "(Leave empty to keep original)" : ""}
                   </label>
                   <input
                     id="admin-image-file"
                     type="file"
                     accept="image/*"
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         setImage(e.target.files[0]);
                       }
                     }}
                     required={!editId}
                     className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-150 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                   />
                 </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-md shadow-blue-500/10 flex items-center justify-center cursor-pointer"
                  >
                    {editId ? "Update Product" : "Add Product"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Products Inventory
              </h2>
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 py-1 px-3 rounded-full">
                {products.length} {products.length === 1 ? "Product" : "Products"}
              </span>
            </div>

            {loading && products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-500 text-sm">Loading products inventory...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-slate-500 font-semibold mb-2">No Products in Inventory</p>
                <p className="text-slate-400 text-sm">Use the form on the left to add your first product.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-slate-100 w-full relative overflow-hidden">
                        <img
                          src={prod.image || "https://via.placeholder.com/300x225"}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x225?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-800 leading-snug mb-1 text-base line-clamp-2">
                          {prod.name}
                        </h3>
                        <p className="font-extrabold text-blue-600 text-lg">
                          {prod.price}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 font-mono">
                          ID: {prod.id}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2.5">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="flex-grow bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-xl border border-slate-200 transition-colors text-xs flex items-center justify-center cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(prod.id)}
                        className="flex-grow bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-3 rounded-xl border border-red-100 transition-colors text-xs flex items-center justify-center cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminProducts;
