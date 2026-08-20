import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const API = "http://localhost:5000/api/auctions";

const AuctionBidding = () => {
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [socket, setSocket] = useState(null);
  const [liveBids, setLiveBids] = useState([]);

  useEffect(() => {
    fetchAuction();

    if (token) {
      const envUrl = import.meta.env.VITE_SOCKET_URL;
      const finalSocketUrl = envUrl && !envUrl.includes("localhost")
        ? envUrl
        : `${window.location.protocol}//${window.location.host}`;

      const s = io(finalSocketUrl, {
        auth: { token },
      });
      setSocket(s);

      s.on("connect", () => {
        s.emit("joinAuction", id);
      });

      s.on("newBid", (data) => {
        setAuction((prev) =>
          prev ? { ...prev, currentPrice: data.currentPrice, totalBids: data.totalBids } : prev
        );
        setLiveBids((prev) => [data, ...prev].slice(0, 20));
      });

      return () => {
        s.emit("leaveAuction", id);
        s.disconnect();
      };
    }
  }, [id, token]);

  useEffect(() => {
    if (!auction) return;
    const timer = setInterval(() => {
      const diff = new Date(auction.endTime) - new Date();
      if (diff <= 0) {
        setTimeLeft("Auction Ended");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  const fetchAuction = async () => {
    try {
      const { data } = await axios.get(`${API}/${id}`);
      setAuction(data.auction);
      setBidAmount(data.auction.currentPrice + data.auction.bidIncrement);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBid = async () => {
    try {
      await axios.post(
        `${API}/${id}/bid`,
        { amount: Number(bidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAuction();
    } catch (err) {
      alert(err.response?.data?.message || "Bid failed");
    }
  };

  if (!auction) return <div style={{ padding: "60px", textAlign: "center" }}>Loading auction...</div>;

  const minBid = auction.currentPrice + auction.bidIncrement;

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "16px", padding: "32px", color: "#fff", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{auction.title}</h1>
        <p style={{ opacity: 0.9 }}>by {auction.seller?.name || "Vendor"}</p>
        <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Current Price</p>
            <p style={{ fontSize: "32px", fontWeight: "bold" }}>₹{auction.currentPrice}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Time Remaining</p>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{timeLeft}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Total Bids</p>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{auction.totalBids || 0}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Bid Section */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "16px" }}>💰 Place Your Bid</h3>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>
            Minimum bid: ₹{minBid}
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={minBid}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "18px" }}
            />
            <button
              onClick={handleBid}
              disabled={!token || auction.status === "ended" || auction.status === "sold"}
              style={{
                background: token && auction.status === "active" ? "#10b981" : "#9ca3af",
                color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px",
                cursor: token ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "16px"
              }}
            >
              Bid Now
            </button>
          </div>

          {/* Quick bid buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[minBid, minBid + 100, minBid + 500, minBid + 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setBidAmount(amt)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#f3f4f6", cursor: "pointer", fontSize: "13px" }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {!token && (
            <p style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>Please login to place a bid</p>
          )}
        </div>

        {/* Live Bid Feed */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "16px" }}>📡 Live Bid Feed</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {auction.bids && [...auction.bids].reverse().slice(0, 15).map((bid, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>
                  {bid.user?.name || "Bidder"}
                </span>
                <span style={{ fontWeight: "bold", color: "#10b981" }}>₹{bid.amount}</span>
              </div>
            ))}
            {liveBids.map((bid, i) => (
              <div key={`live-${i}`} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", background: "#f0fdf4" }}>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>🔴 Live Bid</span>
                <span style={{ fontWeight: "bold", color: "#10b981" }}>₹{bid.amount}</span>
              </div>
            ))}
            {(!auction.bids || auction.bids.length === 0) && liveBids.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center" }}>No bids yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Auction Details */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginTop: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "12px" }}>📋 Auction Details</h3>
        <p style={{ color: "#6b7280", lineHeight: 1.6 }}>{auction.description || "No description provided."}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <div>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Starting Price</p>
            <p style={{ fontWeight: "600" }}>₹{auction.startingPrice}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Bid Increment</p>
            <p style={{ fontWeight: "600" }}>₹{auction.bidIncrement}</p>
          </div>
          <div>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Watchers</p>
            <p style={{ fontWeight: "600" }}>{auction.watchers?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionBidding;
