import React, { useState, useEffect } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";

const VendorDashboard = () => {
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Become a vendor form state
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Add Product form state
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productDesc, setProductDesc] = useState("");
  const [productCat, setProductCat] = useState("Grocery");
  const [productBrand, setProductBrand] = useState("Fresh");
  const [productStock, setProductStock] = useState("100");
  const [addingProduct, setAddingProduct] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    try {
      // 1. Fetch user profile role
      const profileRes = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) throw new Error("Could not load profile.");
      const profileData = await profileRes.json();
      
      setRole(profileData.role || "user");

      if (profileData.role === "vendor") {
        // 2. Fetch vendor metrics and sales
        const statsRes = await fetch("/api/vendor/earnings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // 3. Fetch products owned by vendor
        const productsRes = await fetch("/api/products");
        if (productsRes.ok) {
          const allProducts = await productsRes.json();
          // Profile returns user ID in profileData._id
          const vendorOwnProducts = allProducts.filter(
            (p) => p.user && p.user.toString() === profileData._id.toString()
          );
          setProducts(vendorOwnProducts);
        }

        // 4. Fetch vendor customer orders
        const ordersRes = await fetch("/orders/getorders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          setOrders(allOrders);
        }
      } else {
        // Check if there's a pending request
        const reqsRes = await fetch("/api/vendor/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          const pending = reqsData.some(
            (r) => r.user?._id === profileData._id && r.status === "pending"
          );
          setHasPendingRequest(pending);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeVendor = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmittingRequest(true);

    try {
      const res = await fetch("/api/vendor/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessName, description }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit request.");
      }

      setHasPendingRequest(true);
      setSuccessMsg("Your request to become a vendor has been submitted and is pending admin approval.");
      setBusinessName("");
      setDescription("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!productName || !productPrice || !productImage) {
      setErrorMsg("Please fill in name, price and image fields.");
      return;
    }

    setAddingProduct(true);

    try {
      // Fetch user profile to set user owner ID in body
      const profileRes = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();

      const formData = new FormData();
      formData.append("name", productName);
      formData.append("price", `RS ${productPrice}`);
      formData.append("image", productImage); // This holds the File object
      formData.append("description", productDesc || "Fresh grocery item.");
      formData.append("category", productCat);
      formData.append("brand", productBrand);
      formData.append("stock", parseInt(productStock) || 100);
      formData.append("user", profileData._id);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add product.");
      }

      setProductName("");
      setProductPrice("");
      setProductImage(null);
      // Reset the file input element in form manually
      const fileInput = document.getElementById("product-image-file");
      if (fileInput) fileInput.value = "";

      setProductDesc("");
      setProductStock("100");
      setSuccessMsg("Product added successfully!");
      fetchProfileAndData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/orders/updateorder/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update order status.");
      }

      setSuccessMsg(`Order status updated to "${newStatus}"!`);
      fetchProfileAndData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="mt-4 text-zinc-500 font-semibold text-sm">Syncing seller profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ------------------------------------
  // GUEST ONBOARDING FLOW
  // ------------------------------------
  if (role !== "vendor") {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-6 py-12">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/50 shadow-xl shadow-zinc-200/20">
            <h1 className="text-2xl font-black text-zinc-800 tracking-tight mb-2">Vendor Onboarding</h1>
            <p className="text-zinc-500 text-xs font-semibold mb-6">
              Submit your request to start listing products, managing stocks, and viewing payouts!
            </p>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold mb-6">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-xs font-bold mb-6">
                {errorMsg}
              </div>
            )}

            {hasPendingRequest ? (
              <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                ⏳ Your request is currently pending administrator review. Please check back later.
              </div>
            ) : (
              <form onSubmit={handleBecomeVendor} className="space-y-4">
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Organic Greens Farm"
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Business Description</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of products you intend to sell"
                    required
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {submittingRequest ? "Submitting..." : "Apply as Seller"}
                </button>
              </form>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ------------------------------------
  // VENDOR DASHBOARD FLOW
  // ------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-850 tracking-tight mb-8">Seller Dashboard</h1>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold mb-6 shadow-sm">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-xs font-bold mb-6 shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Sales</p>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-800 mt-1">RS {stats.totalSales?.toFixed(2)}</h2>
            </div>
            <div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Orders</p>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-800 mt-1">{stats.totalOrders}</h2>
            </div>
            <div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Credited Earnings</p>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">RS {stats.totalEarnings?.toFixed(2)}</h2>
            </div>
            <div className="bg-white border border-zinc-200/50 rounded-2xl p-5 shadow-sm">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Pending (Undelivered)</p>
              <h2 className="text-xl sm:text-2xl font-black text-amber-500 mt-1">RS {stats.pendingEarnings?.toFixed(2)}</h2>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Products & Inventory List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Inventory Management</h3>
              
              <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto pr-2">
                {products.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-4 text-center">No products listed yet.</p>
                ) : (
                  products.map((prod) => (
                    <div key={prod.id} className="py-3.5 flex justify-between items-center gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-xl border" />
                        <div>
                          <p className="font-extrabold text-zinc-800">{prod.name}</p>
                          <p className="text-zinc-400 font-semibold">{prod.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 font-semibold">Stock: <strong className="text-zinc-800">{prod.stock || 0}</strong></p>
                        {prod.stock <= prod.lowStockThreshold && (
                          <span className="bg-red-100 text-red-800 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 inline-block">
                            ⚠️ Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vendor Customers Orders list */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Customer Orders</h3>
              
              <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto pr-2">
                {orders.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-4 text-center">No customer orders received.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order._id} className="py-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-black text-zinc-800">Order #{order._id.substring(18)}</p>
                          <p className="text-zinc-400 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full font-bold text-zinc-600">
                          {order.orderStatus}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-zinc-50 rounded-xl p-3 text-[11px] space-y-1 font-semibold text-zinc-500">
                        {order.items.map((it, idx) => (
                          <p key={idx}>&bull; {it.name} (Qty: {it.quantity})</p>
                        ))}
                      </div>

                      {/* Actions */}
                      {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
                        <div className="flex gap-2 text-[10px] font-extrabold uppercase">
                          <button
                            onClick={() => handleUpdateStatus(order._id, "Packed")}
                            disabled={order.orderStatus === "Packed"}
                            className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-950 transition cursor-pointer disabled:opacity-50"
                          >
                            Packed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, "Shipped")}
                            disabled={order.orderStatus === "Shipped"}
                            className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-950 transition cursor-pointer disabled:opacity-50"
                          >
                            Shipped
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, "Out For Delivery")}
                            disabled={order.orderStatus === "Out For Delivery"}
                            className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-950 transition cursor-pointer disabled:opacity-50"
                          >
                            Out For Delivery
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Add Product Section */}
          <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 sm:p-8 shadow-sm h-fit sticky top-20">
            <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">List New Product</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. fresh ginger"
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Price (INR)</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="e.g. 150"
                    required
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Stock Count</label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Product Image File</label>
                <input
                  id="product-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImage(e.target.files[0])}
                  required
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 transition file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-extrabold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows="3"
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Tell customers about the quality..."
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={addingProduct}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {addingProduct ? "Adding..." : "List Product"}
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VendorDashboard;
