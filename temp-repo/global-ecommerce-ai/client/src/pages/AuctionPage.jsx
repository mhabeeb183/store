import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api/auctions";

const AuctionPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;
  const role = userInfo?.user?.role || userInfo?.role;
  const isVendorOrAdmin = role === "vendor" || role === "admin";

  const [auctions, setAuctions]     = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);

  // Form state
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [bidIncrement, setBidIncrement] = useState(10);
  const [startTime, setStartTime]       = useState("");
  const [endTime, setEndTime]           = useState("");

  // Image upload state
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchAuctions(); }, []);

  const fetchAuctions = async () => {
    try {
      const { data } = await axios.get(`${API}/active`);
      setAuctions(data.auctions || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Handle image pick ─────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setStartingPrice("");
    setBidIncrement(10); setStartTime(""); setEndTime("");
    setImageFile(null); setImagePreview(null);
    setShowCreate(false);
  };

  // ── Create auction ────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please upload a product image.");
      return;
    }
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("title",         title);
      formData.append("description",   description);
      formData.append("startingPrice", startingPrice);
      formData.append("bidIncrement",  bidIncrement);
      formData.append("startTime",     startTime);
      formData.append("endTime",       endTime);
      formData.append("image",         imageFile);   // ← the image file

      await axios.post(API, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      resetForm();
      fetchAuctions();
      alert("Auction created successfully! 🎉");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating auction");
    } finally {
      setCreating(false);
    }
  };

  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return "Ended";
    const hours   = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":   return "#10b981";
      case "upcoming": return "#3b82f6";
      case "ended":    return "#6b7280";
      case "sold":     return "#f59e0b";
      default:         return "#6b7280";
    }
  };

  // Resolve the image to show on an auction card
  const getAuctionImage = (auction) =>
    auction.images?.[0] || auction.product?.images?.[0] || null;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>🔨 Live Auctions</h1>
        {isVendorOrAdmin && (
          <button
            onClick={() => { setShowCreate(!showCreate); }}
            style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
          >
            {showCreate ? "Cancel" : "+ Create Auction"}
          </button>
        )}
      </div>

      {/* ── CREATE FORM ──────────────────────────────────────────── */}
      {isVendorOrAdmin && showCreate && (
        <form
          onSubmit={handleCreate}
          style={{ background: "#fff", padding: "28px", borderRadius: "16px", marginBottom: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        >
          <h3 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "20px" }}>Create New Auction</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {/* Title */}
            <input
              placeholder="Auction Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
            />

            {/* Starting Price */}
            <input
              type="number"
              placeholder="Starting Price (₹)"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              required
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
            />

            {/* Bid Increment */}
            <input
              type="number"
              placeholder="Bid Increment (₹)"
              value={bidIncrement}
              onChange={(e) => setBidIncrement(Number(e.target.value))}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
            />

            {/* Empty cell placeholder for grid alignment */}
            <div />

            {/* Start Time */}
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", fontSize: "14px" }}
              />
            </div>

            {/* End Time */}
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", fontSize: "14px", resize: "vertical", marginBottom: "20px", boxSizing: "border-box" }}
          />

          {/* ── IMAGE UPLOAD ─────────────────────────────────── */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px", display: "block" }}>
              📷 Product Image <span style={{ color: "#dc2626" }}>*</span>
            </label>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: "2px dashed #8b5cf6",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                background: imagePreview ? "#faf5ff" : "#f9fafb",
                transition: "all 0.2s",
                position: "relative",
                minHeight: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imagePreview ? (
                /* Show preview */
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxHeight: "160px", maxWidth: "100%", borderRadius: "10px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                    style={{
                      position: "absolute", top: "-10px", right: "-10px",
                      background: "#dc2626", color: "#fff", border: "none",
                      borderRadius: "50%", width: "28px", height: "28px",
                      cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    ✕
                  </button>
                  <p style={{ fontSize: "12px", color: "#8b5cf6", marginTop: "8px" }}>
                    Click to change image
                  </p>
                </div>
              ) : (
                /* Empty state */
                <div>
                  <div style={{ fontSize: "42px", marginBottom: "8px" }}>🖼️</div>
                  <p style={{ fontWeight: "600", color: "#374151", fontSize: "14px" }}>
                    Click to upload or drag & drop
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>
                    PNG, JPG, WEBP — Max 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating}
            style={{
              background: creating ? "#9ca3af" : "#8b5cf6",
              color: "#fff", border: "none",
              padding: "12px 28px", borderRadius: "10px",
              cursor: creating ? "not-allowed" : "pointer",
              fontWeight: "700", fontSize: "15px"
            }}
          >
            {creating ? "Creating..." : "🔨 Create Auction"}
          </button>
        </form>
      )}

      {/* ── AUCTION GRID ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
        {auctions.map((auction) => {
          const img = getAuctionImage(auction);
          return (
            <div key={auction._id} style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "transform 0.2s" }}>
              {/* Image */}
              <div style={{ height: "200px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {img ? (
                  <img src={img} alt={auction.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "52px" }}>🔨</span>
                )}
                <span style={{
                  position: "absolute", top: "12px", right: "12px",
                  background: getStatusColor(auction.status), color: "#fff",
                  padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase"
                }}>
                  {auction.status}
                </span>
              </div>

              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>{auction.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "14px" }}>
                  by {auction.seller?.name || "Unknown"}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>Current Bid</p>
                    <p style={{ fontSize: "22px", fontWeight: "bold", color: "#10b981" }}>₹{auction.currentPrice}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>Time Left</p>
                    <p style={{ fontSize: "16px", fontWeight: "600", color: "#ef4444" }}>{getTimeRemaining(auction.endTime)}</p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {auction.totalBids || 0} bids
                  </span>
                  <Link
                    to={`/auction/${auction._id}`}
                    style={{ background: "#3b82f6", color: "#fff", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}
                  >
                    Place Bid →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {auctions.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <p style={{ fontSize: "48px" }}>🔨</p>
          <p style={{ fontSize: "18px" }}>No active auctions right now</p>
        </div>
      )}
    </div>
  );
};

export default AuctionPage;
