import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";

const API = "http://localhost:5000/api/livestreams";
const envUrl = import.meta.env.VITE_SOCKET_URL;
const SOCKET_URL = envUrl && !envUrl.includes("localhost")
  ? envUrl
  : `${window.location.protocol}//${window.location.host}`;
const DEFAULT_ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const LiveStreamPage = () => {
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;
  const userId = userInfo?.user?._id || userInfo?._id;
  const role = userInfo?.user?.role || userInfo?.role;

  const [streams, setStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const isHost =
    currentStream &&
    (currentStream.host?._id === userId || currentStream.host === userId);

  const [allProducts, setAllProducts] = useState([]);
  const [showAddProductPanel, setShowAddProductPanel] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/products");
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      }
    };
    if (isHost) {
      fetchAllProducts();
    }
  }, [isHost]);
  const [viewerCount, setViewerCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "" });
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const chatEndRef = useRef(null);
  // Host keeps one RTCPeerConnection per viewer socket ID
  const peerConnectionsRef = useRef({});
  // Viewer keeps one RTCPeerConnection to the host
  const peerConnectionRef = useRef(null);
  // Ref to avoid stale closures in socket listeners
  const localStreamLiveRef = useRef(false);
  const currentStreamRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

  // Load production ICE/TURN servers from backend dynamically
  useEffect(() => {
    const fetchIceConfig = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/livestreams/ice-servers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data && data.success && data.iceServers) {
          iceServersRef.current = { iceServers: data.iceServers };
          console.log("Loaded dynamic ICE servers from backend:", data.iceServers);
        }
      } catch (err) {
        console.warn("Could not load dynamic TURN configuration, falling back to defaults.", err);
      }
    };

    if (token) {
      fetchIceConfig();
    }
  }, [token]);

  // Keep currentStreamRef in sync
  useEffect(() => {
    currentStreamRef.current = currentStream;
  }, [currentStream]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── LIVE AUCTION STATE ──────────────────────────────────────────────────────
  const [liveAuction, setLiveAuction] = useState(null);
  const [bidInput, setBidInput] = useState("");
  const [auctionProductId, setAuctionProductId] = useState(null);
  const [startingPriceInput, setStartingPriceInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({ street: "", city: "", zip: "" });
  const [celebrationBanner, setCelebrationBanner] = useState(null);

  // Sync initial liveAuction state from stream object
  useEffect(() => {
    if (currentStream?.liveAuction) {
      setLiveAuction(currentStream.liveAuction);
    } else {
      setLiveAuction(null);
    }
  }, [currentStream]);

  // Real-time client countdown timer
  useEffect(() => {
    if (!liveAuction || liveAuction.status !== "active" || !liveAuction.timerEnd) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const msLeft = new Date(liveAuction.timerEnd).getTime() - Date.now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setTimeLeft(secLeft);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    return () => clearInterval(interval);
  }, [liveAuction?.timerEnd, liveAuction?.status]);

  // ─── SOCKET SETUP ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    // Live chat messages
    s.on("streamChat", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Viewer count updates
    s.on("viewerUpdate", (data) => {
      setViewerCount((prev) =>
        data.action === "joined" ? prev + 1 : Math.max(0, prev - 1)
      );
    });

    // Stream ended by host
    s.on("streamEnded", () => {
      alert("The stream has ended!");
      setCurrentStream(null);
      setIsStreaming(false);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // Live Auction socket listeners
    s.on("liveAuctionStarted", (auction) => {
      setLiveAuction(auction);
      setCelebrationBanner(null);
      setShowCheckout(false);
    });

    s.on("liveAuctionBid", (auction) => {
      setLiveAuction(auction);
    });

    s.on("liveAuctionEnded", (auction) => {
      setLiveAuction(auction);
      if (auction.highestBidder === userId) {
        setShowCheckout(true);
      }
    });

    s.on("liveAuctionPaid", (data) => {
      setCelebrationBanner(`🎉 Success! ${data.productName} was sold to ${data.winnerName} for ₹${data.price}!`);
      setLiveAuction((prev) => prev ? { ...prev, status: "sold" } : null);
      setShowCheckout(false);
    });

    s.on("liveAuctionReset", () => {
      setLiveAuction(null);
      setCelebrationBanner(null);
    });

    s.on("streamStarted", (data) => {
      setCurrentStream((prev) => {
        if (prev && prev._id === data.streamId) {
          return { ...prev, status: "live" };
        }
        return prev;
      });
    });

    s.on("streamProductsUpdated", (products) => {
      setCurrentStream((prev) => prev ? { ...prev, products } : null);
    });

    // ── HOST ONLY: a viewer just joined and is ready ──────────────────────────
    s.on("viewer-ready", async ({ viewerId }) => {
      if (!localStreamLiveRef.current || !localStreamRef.current) return;

      try {
        const pc = new RTCPeerConnection(iceServersRef.current);
        peerConnectionsRef.current[viewerId] = pc;

        // Add all local tracks to this peer connection
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });

        // Send ICE candidates to this viewer
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            s.emit("peer-signal", {
              to: viewerId,
              signal: { type: "ice-candidate", candidate },
            });
          }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit("peer-signal", {
          to: viewerId,
          signal: { type: "offer", sdp: offer },
        });
      } catch (err) {
        console.error("Error creating offer for viewer:", err);
      }
    });

    // ── BOTH: handle incoming peer signals ────────────────────────────────────
    s.on("peer-signal", async ({ from, signal }) => {
      try {
        if (signal.type === "offer") {
          // VIEWER receives offer from host
          const pc = new RTCPeerConnection(iceServersRef.current);
          peerConnectionRef.current = pc;

          pc.ontrack = ({ streams }) => {
            if (videoRef.current && streams[0]) {
              if (videoRef.current.srcObject !== streams[0]) {
                videoRef.current.srcObject = streams[0];
                setIsStreaming(true);
                videoRef.current.play().catch((err) => {
                  console.warn("Autoplay play() was prevented:", err);
                });
              }
            }
          };

          // Send ICE candidates back to host
          pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              s.emit("peer-signal", {
                to: from,
                signal: { type: "ice-candidate", candidate },
              });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          s.emit("peer-signal", {
            to: from,
            signal: { type: "answer", sdp: answer },
          });
        } else if (signal.type === "answer") {
          // HOST receives answer from a viewer
          const pc = peerConnectionsRef.current[from];
          if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === "ice-candidate") {
          // Both: add ICE candidate
          const hostPc = peerConnectionRef.current;
          const viewerPc = peerConnectionsRef.current[from];
          const pc = hostPc || viewerPc;
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error("Peer signal handling error:", err);
      }
    });

    return () => {
      s.disconnect();
      // Cleanup all peer connections on unmount
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [token]);

  // ─── JOIN SOCKET ROOM (separate effect — fixed race condition) ────────────────
  useEffect(() => {
    if (!socket || !currentStream?.roomId) return;

    const { roomId } = currentStream;
    const hostId = currentStream.host?._id || currentStream.host;
    const isHost = hostId === userId;

    socket.emit("joinStream", roomId);

    // Viewers notify the host they are ready to receive video
    if (!isHost && currentStream.status === "live") {
      // Small delay to ensure host's socket listener is registered
      const timer = setTimeout(() => {
        socket.emit("viewer-ready", { roomId });
      }, 800);
      return () => {
        clearTimeout(timer);
        socket.emit("leaveStream", roomId);
      };
    }

    return () => {
      socket.emit("leaveStream", roomId);
    };
  }, [socket, currentStream?.roomId, currentStream?.status]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── DATA FETCHING ───────────────────────────────────────────────────────────
  const fetchStreams = async () => {
    try {
      const { data } = await axios.get(`${API}/active`);
      setStreams(data.streams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStream = async (streamId) => {
    try {
      const { data } = await axios.get(`${API}/${streamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCurrentStream(data.stream);
      setChatMessages(data.stream.chat || []);
      setViewerCount(data.stream.currentViewerCount || 0);
      if (data.stream.liveAuction) {
        setLiveAuction(data.stream.liveAuction);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) {
      fetchStreams();
    } else {
      fetchStream(id);
    }
  }, [id]);

  // ─── STREAM CONTROLS ─────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreate(false);
      fetchStreams();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating stream");
    }
  };

  const handleStartStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = mediaStream;
      localStreamLiveRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsMuted(true); // Host is always muted to avoid loopback feedback
        setIsStreaming(true);
        videoRef.current.play().catch((err) => {
          console.warn("Host play() was prevented:", err);
        });
      }

      await axios.put(`${API}/${currentStream._id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchStream(currentStream._id);
    } catch (err) {
      console.error("Start stream error:", err);
      alert("Could not start stream. Please allow camera and microphone access.");
    }
  };

  const handleEndStream = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      localStreamLiveRef.current = false;
      setIsStreaming(false);

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      await axios.put(`${API}/${currentStream._id}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCurrentStream(null);
      fetchStreams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinStream = async (streamId) => {
    try {
      await axios.post(
        `${API}/${streamId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStream(streamId);
    } catch (err) {
      alert(err.response?.data?.message || "Cannot join stream");
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !currentStream) return;
    try {
      await axios.post(
        `${API}/${currentStream._id}/chat`,
        { message: chatInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatInput("");
    } catch (err) {
      console.error(err);
    }
  };

  // ─── LIVE AUCTION HANDLERS ────────────────────────────────────────────────────
  const handleStartAuction = async (productId, startingPrice) => {
    try {
      const { data } = await axios.post(`${API}/${currentStream._id}/auction/start`, {
        productId,
        startingPrice: Number(startingPrice),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiveAuction(data.liveAuction);
      setAuctionProductId(null);
      setStartingPriceInput("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start auction");
    }
  };

  const handlePlaceBid = async (amount) => {
    if (!amount || isNaN(amount)) {
      alert("Please enter a valid bid amount");
      return;
    }
    try {
      const { data } = await axios.post(`${API}/${currentStream._id}/auction/bid`, {
        bidAmount: Number(amount),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiveAuction(data.liveAuction);
      setBidInput("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place bid");
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/${currentStream._id}/auction/checkout`, {
        shippingAddress,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Simulated transaction complete! Created Order: " + data.order._id);
      setShowCheckout(false);
    } catch (err) {
      alert(err.response?.data?.message || "Payment processing failed");
    }
  };

  const handleAddProductToStream = async (productId) => {
    try {
      const { data } = await axios.post(`${API}/${currentStream._id}/products`, {
        productId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentStream((prev) => ({ ...prev, products: data.products }));
      alert("Product added to live stream successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add product");
    }
  };

  // ─── STREAM LISTING VIEW ──────────────────────────────────────────────────────
  if (!id && !currentStream) {
    return (
      <div style={{ padding: isMobile ? "16px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>📺 Live Commerce</h1>
          {(role === "vendor" || role === "admin") && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              style={{ background: "#ef4444", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
            >
              {showCreate ? "Cancel" : "🔴 Go Live"}
            </button>
          )}
        </div>

        {showCreate && (role === "vendor" || role === "admin") && (
          <form onSubmit={handleCreate} style={{ background: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <input placeholder="Stream Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #d1d5db", minHeight: "60px" }} />
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", marginBottom: "12px" }} />
            <button type="submit" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer" }}>Create Stream</button>
          </form>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {streams.map((stream) => (
            <div key={stream._id} style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <div style={{ height: "180px", background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: "48px" }}>📺</span>
                {stream.status === "live" && (
                  <span style={{ position: "absolute", top: "12px", left: "12px", background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                    🔴 LIVE
                  </span>
                )}
                <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>
                  👁 {stream.currentViewerCount || 0}
                </span>
              </div>
              <div style={{ padding: "16px" }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "4px" }}>{stream.title}</h3>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "12px" }}>by {stream.host?.name || "Host"}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>{stream.products?.length || 0} products</span>
                  {stream.status === "live" ? (
                    <button
                      onClick={() => handleJoinStream(stream._id)}
                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                    >
                      Watch Live
                    </button>
                  ) : (
                    <Link
                      to={`/livestream/${stream._id}`}
                      style={{ background: "#3b82f6", color: "#fff", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}
                    >
                      Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {streams.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
            <p style={{ fontSize: "48px" }}>📺</p>
            <p>No live streams right now</p>
          </div>
        )}
      </div>
    );
  }

  // ─── MOBILE STREAM VIEWER / HOST VIEW ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", overflow: "hidden", padding: "8px", gap: "8px", background: "#f3f4f6" }}>
        {/* Video Area */}
        <div style={{ background: "#111", borderRadius: "12px", overflow: "hidden", height: "28vh", minHeight: "170px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isHost ? true : isMuted}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {isStreaming && !isHost && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                position: "absolute",
                bottom: "8px",
                left: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                zIndex: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
            >
              <span>{isMuted ? "🔇" : "🔊"}</span> {isMuted ? "Tap to Unmute" : "Audio Active"}
            </button>
          )}
          {!isStreaming && (
            <div style={{ position: "absolute", color: "#fff", textAlign: "center" }}>
              <p style={{ fontSize: "24px", margin: 0 }}>📺</p>
              <p style={{ fontSize: "12px", margin: "4px 0 0" }}>
                {currentStream?.status === "live"
                  ? "Connecting to stream..."
                  : "Waiting for host to start stream..."}
              </p>
            </div>
          )}
          <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px" }}>
            {currentStream?.status === "live" && (
              <span style={{ background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "700" }}>
                🔴 LIVE
              </span>
            )}
            <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontSize: "10px" }}>
              👁 {viewerCount}
            </span>
          </div>
        </div>

        {/* Title, Host, & End Stream */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>{currentStream?.title}</h2>
            <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>by {currentStream?.host?.name}</p>
          </div>
          {isHost && currentStream?.status === "live" && (
            <button
              onClick={handleEndStream}
              style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}
            >
              End Stream
            </button>
          )}
          {isHost && currentStream?.status !== "live" && (
            <button
              onClick={handleStartStream}
              style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}
            >
              Start Stream
            </button>
          )}
        </div>

        {/* Active Auction Banner */}
        {liveAuction && liveAuction.status === "active" && (
          <div style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            fontSize: "12px"
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "8px", background: "rgba(255,255,255,0.25)", padding: "1px 5px", borderRadius: "8px", fontWeight: "bold", textTransform: "uppercase" }}>Auction Active</span>
              <p style={{ margin: "2px 0 0", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>{liveAuction.product?.name}</p>
              <p style={{ margin: 0 }}>Current Price: <strong style={{ color: "#34d399" }}>₹{liveAuction.currentPrice}</strong></p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>⏱️ {timeLeft}s</p>
              </div>
              {token && !isHost ? (
                <button
                  onClick={() => handlePlaceBid(liveAuction.currentPrice + 10)}
                  style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                >
                  Bid +₹10
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* Winner Checkout Card */}
        {liveAuction && liveAuction.status === "ended" && (
          <div style={{
            background: "#1f2937",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px"
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: "bold" }}>🔨 Auction Ended</p>
              <p style={{ margin: 0, color: "#9ca3af" }}>
                {liveAuction.highestBidderName ? `Won by ${liveAuction.highestBidderName} for ₹${liveAuction.currentPrice}` : "No bids received"}
              </p>
            </div>
            {liveAuction.highestBidder === userId && (
              <button
                onClick={() => setShowCheckout(true)}
                style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
              >
                Pay Now
              </button>
            )}
          </div>
        )}

        {/* Featured Products Horizontal Scroll */}
        {(currentStream?.products?.length > 0 || isHost) && (
          <div style={{ background: "#fff", padding: "8px", borderRadius: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: "bold", fontSize: "11px", color: "#374151" }}>🛍️ Featured Products</span>
              {isHost && (
                <button
                  onClick={() => setShowAddProductPanel(!showAddProductPanel)}
                  style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "bold" }}
                >
                  {showAddProductPanel ? "Close" : "➕ Add Product"}
                </button>
              )}
            </div>

            {/* Catalog Add Drawer */}
            {isHost && showAddProductPanel && (
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "4px 0", borderBottom: "1px dashed #e5e7eb", marginBottom: "4px" }}>
                {allProducts
                  .filter(p => p && !currentStream?.products?.some(sp => sp && (sp._id === p._id || sp === p._id || (sp.toString && sp.toString() === p._id.toString()))))
                  .map((product) => {
                    if (!product) return null;
                    return (
                      <div key={product._id} style={{ minWidth: "90px", padding: "4px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <p style={{ fontSize: "8px", fontWeight: "bold", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "70px", textAlign: "center" }}>{product.name}</p>
                        <button
                          onClick={() => handleAddProductToStream(product._id)}
                          style={{ background: "#10b981", color: "#fff", border: "none", padding: "1px 4px", borderRadius: "3px", fontSize: "8px", fontWeight: "bold" }}
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Products List */}
            {currentStream?.products?.length > 0 ? (
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
                {currentStream.products.map((product) => {
                  if (!product) return null;
                  return (
                    <div key={product._id} style={{ minWidth: "120px", display: "flex", gap: "6px", background: "#f9fafb", padding: "4px 6px", borderRadius: "6px", border: "1px solid #e5e7eb", alignItems: "center" }}>
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.name} style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "4px" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "9px", fontWeight: "600", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</p>
                        <p style={{ fontSize: "9px", color: "#10b981", fontWeight: "bold", margin: 0 }}>₹{product.price}</p>
                      </div>
                      {isHost && (
                        <button
                          onClick={() => {
                            setAuctionProductId(product._id);
                            setStartingPriceInput(product.price);
                            handleStartAuction(product._id, product.price);
                          }}
                          disabled={liveAuction && liveAuction.status === "active"}
                          style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "2px 4px", borderRadius: "4px", fontSize: "8px", fontWeight: "bold" }}
                        >
                          Auction
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "9px", color: "#9ca3af", margin: "2px 0 0" }}>No products featured yet</p>
            )}
          </div>
        )}

        {/* Live Chat Panel (Takes remaining height) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
            {chatMessages.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "16px", fontSize: "11px" }}>No messages yet</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "4px" }}>
                <span style={{ fontWeight: "600", fontSize: "11px", color: "#8b5cf6" }}>
                  {msg.userName || "User"}:
                </span>
                <span style={{ fontSize: "11px", color: "#374151", marginLeft: "4px" }}>
                  {msg.message}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {token ? (
            <div style={{ padding: "6px", borderTop: "1px solid #f3f4f6", display: "flex", gap: "6px", background: "#fff" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "6px 10px", borderRadius: "16px", border: "1px solid #d1d5db", outline: "none", fontSize: "12px" }}
              />
              <button
                onClick={sendChat}
                style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "16px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}
              >
                Send
              </button>
            </div>
          ) : (
            <div style={{ padding: "6px", borderTop: "1px solid #f3f4f6", textAlign: "center", fontSize: "10px" }}>
              <Link to="/login" style={{ color: "#8b5cf6", fontWeight: "bold", textDecoration: "none" }}>Log in to chat</Link>
            </div>
          )}
        </div>

        {/* Winner Checkout Modal Overlay */}
        {showCheckout && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}>
            <div style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "340px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "6px", color: "#1f2937" }}>
                🎉 You Won the Auction!
              </h3>
              <p style={{ fontSize: "12px", color: "#4b5563", marginBottom: "16px" }}>
                You won <strong>{liveAuction?.product?.name}</strong> for <strong>₹{liveAuction?.currentPrice}</strong>. Enter address to complete order.
              </p>
              <form onSubmit={handleCheckout}>
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "2px", color: "#374151" }}>
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Street Address"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    style={{ width: "100%", padding: "6px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "2px", color: "#374151" }}>
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      style={{ width: "100%", padding: "6px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "2px", color: "#374151" }}>
                      ZIP
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ZIP"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                      style={{ width: "100%", padding: "6px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", outline: "none" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    style={{ background: "#e5e7eb", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    Pay ₹{liveAuction?.currentPrice}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── STREAM VIEWER / HOST VIEW ────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? "12px" : "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: isMobile ? "16px" : "24px" }}>

        {/* Video Area */}
        <div>
          <div style={{ background: "#111", borderRadius: "16px", overflow: "hidden", aspectRatio: "16/9", maxHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isHost ? true : isMuted}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {isStreaming && !isHost && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}
              >
                <span>{isMuted ? "🔇" : "🔊"}</span> {isMuted ? "Tap to Unmute" : "Audio Active"}
              </button>
            )}
            {!isStreaming && (
              <div style={{ position: "absolute", color: "#fff", textAlign: "center" }}>
                <p style={{ fontSize: "48px" }}>📺</p>
                <p style={{ fontSize: "16px" }}>
                  {currentStream?.status === "live"
                    ? "Connecting to stream..."
                    : "Waiting for host to start stream..."}
                </p>
              </div>
            )}
            <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", gap: "8px" }}>
              {currentStream?.status === "live" && (
                <span style={{ background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                  🔴 LIVE
                </span>
              )}
              <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                👁 {viewerCount}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold" }}>{currentStream?.title}</h2>
            <p style={{ color: "#6b7280" }}>by {currentStream?.host?.name}</p>

            {isHost && (
              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                {currentStream?.status !== "live" && (
                  <button
                    onClick={handleStartStream}
                    style={{ background: "#ef4444", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                  >
                    🔴 Start Stream
                  </button>
                )}
                {currentStream?.status === "live" && (
                  <button
                    onClick={handleEndStream}
                    style={{ background: "#6b7280", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                  >
                    ⬛ End Stream
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Celebration Banner */}
          {celebrationBanner && (
            <div style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)"
            }}>
              {celebrationBanner}
            </div>
          )}

          {/* Active Live Auction Card */}
          {liveAuction && liveAuction.status === "active" && (
            <div style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#fff",
              padding: "20px",
              borderRadius: "16px",
              marginBottom: "20px",
              boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
              gap: "20px",
              position: "relative",
            }}>
              {liveAuction.product?.images?.[0] && (
                <img
                  src={liveAuction.product.images[0]}
                  alt={liveAuction.product.name}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "2px solid #fff" }}
                />
              )}
              <div style={{ flex: 1, textAlign: isMobile ? "center" : "left" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                  🔥 Live Auction
                </span>
                <h4 style={{ fontSize: "16px", fontWeight: "bold", marginTop: "6px", marginBottom: "4px" }}>{liveAuction.product?.name}</h4>
                <p style={{ fontSize: "14px", opacity: 0.95 }}>
                  Current Bid: <strong style={{ fontSize: "18px", color: "#34d399" }}>₹{liveAuction.currentPrice}</strong>
                  {liveAuction.highestBidderName && ` (by ${liveAuction.highestBidderName})`}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "140px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>Ends In</span>
                  <p style={{ fontSize: "24px", fontWeight: "bold", color: timeLeft <= 15 ? "#f87171" : "#fff", margin: 0 }}>
                    ⏱️ {timeLeft}s
                  </p>
                </div>
                {token && !isHost ? (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="number"
                      placeholder={`Min: ₹${liveAuction.currentPrice + 10}`}
                      value={bidInput}
                      onChange={(e) => setBidInput(e.target.value)}
                      style={{
                        width: "90px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "none",
                        color: "#000",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                    <button
                      onClick={() => handlePlaceBid(bidInput || (liveAuction.currentPrice + 10))}
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "13px"
                      }}
                    >
                      Bid
                    </button>
                  </div>
                ) : !token ? (
                  <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>Log in to bid</p>
                ) : (
                  <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>You are hosting</p>
                )}
              </div>
            </div>
          )}

          {/* Auction Ended Card (Winner View / General Info) */}
          {liveAuction && liveAuction.status === "ended" && (
            <div style={{
              background: "#1f2937",
              color: "#fff",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}>
              <div>
                <h4 style={{ fontWeight: "bold", fontSize: "15px", margin: 0 }}>🔨 Auction Ended: {liveAuction.product?.name}</h4>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>
                  {liveAuction.highestBidderName
                    ? `Winning Bid: ₹${liveAuction.currentPrice} by ${liveAuction.highestBidderName}`
                    : "No bids were received."
                  }
                </p>
              </div>
              {liveAuction.highestBidder === userId && (
                <button
                  onClick={() => setShowCheckout(true)}
                  style={{ background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                >
                  💳 Pay Now
                </button>
              )}
            </div>
          )}

          {/* Featured Products */}
          {(currentStream?.products?.length > 0 || isHost) && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontWeight: "bold", margin: 0 }}>🛍️ Featured Products</h3>
                {isHost && (
                  <button
                    onClick={() => setShowAddProductPanel(!showAddProductPanel)}
                    style={{
                      background: "#8b5cf6",
                      color: "#fff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold"
                    }}
                  >
                    {showAddProductPanel ? "Close Catalog" : "➕ Add Product to Live"}
                  </button>
                )}
              </div>

              {/* Host Catalog Panel */}
              {isHost && showAddProductPanel && (
                <div style={{
                  background: "#f9fafb",
                  border: "1px dashed #d1d5db",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                }}>
                  <h4 style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "10px", color: "#374151" }}>Select from Catalog:</h4>
                  {allProducts.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#6b7280" }}>No products in your store catalog</p>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
                      {allProducts
                        .filter(p => p && !currentStream?.products?.some(sp => sp && (sp._id === p._id || sp === p._id || (sp.toString && sp.toString() === p._id.toString()))))
                        .map((product) => {
                          if (!product) return null;
                          return (
                            <div
                              key={product._id}
                              style={{
                                minWidth: "140px",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                padding: "10px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between"
                              }}
                            >
                              <div>
                                {product.images?.[0] && (
                                  <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "60px", objectFit: "cover", borderRadius: "6px" }} />
                                )}
                                <p style={{ fontWeight: "600", fontSize: "11px", marginTop: "6px", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</p>
                                <p style={{ color: "#10b981", fontWeight: "bold", fontSize: "11px", margin: 0 }}>₹{product.price}</p>
                              </div>
                              <button
                                onClick={() => handleAddProductToStream(product._id)}
                                style={{
                                  width: "100%",
                                  marginTop: "8px",
                                  padding: "4px",
                                  background: "#10b981",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "bold"
                                }}
                              >
                                ➕ Add
                              </button>
                            </div>
                          );
                        })}
                      {allProducts.filter(p => p && !currentStream?.products?.some(sp => sp && (sp._id === p._id || sp === p._id || (sp.toString && sp.toString() === p._id.toString())))).length === 0 && (
                        <p style={{ fontSize: "13px", color: "#6b7280" }}>All catalog products added</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Featured products scroll list */}
              {currentStream?.products?.length > 0 ? (
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                  {currentStream.products.map((product) => {
                    if (!product) return null;
                    return (
                      <div
                        key={product._id}
                        style={{ minWidth: "160px", background: "#fff", borderRadius: "12px", padding: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}
                      >
                        <Link to={`/product/${product._id}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "8px" }}>
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                          )}
                          <p style={{ fontWeight: "600", fontSize: "13px", marginTop: "8px", marginBottom: "4px" }}>{product.name}</p>
                          <p style={{ color: "#10b981", fontWeight: "bold", margin: 0 }}>₹{product.price}</p>
                        </Link>

                        {/* Start Auction controls for host */}
                        {isHost && (
                          <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                            {auctionProductId === product._id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <input
                                  type="number"
                                  placeholder="Start Price"
                                  value={startingPriceInput}
                                  onChange={(e) => setStartingPriceInput(e.target.value)}
                                  style={{ width: "100%", padding: "5px", fontSize: "12px", border: "1px solid #d1d5db", borderRadius: "4px", outline: "none" }}
                                />
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button
                                    onClick={() => handleStartAuction(product._id, startingPriceInput || product.price)}
                                    style={{ flex: 1, padding: "5px", fontSize: "11px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                                  >
                                    Go
                                  </button>
                                  <button
                                    onClick={() => setAuctionProductId(null)}
                                    style={{ padding: "5px 8px", fontSize: "11px", background: "#e5e7eb", border: "none", borderRadius: "4px", cursor: "pointer" }}
                                  >
                                    X
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAuctionProductId(product._id);
                                  setStartingPriceInput(product.price);
                                }}
                                disabled={liveAuction && liveAuction.status === "active"}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  background: (liveAuction && liveAuction.status === "active") ? "#e5e7eb" : "#8b5cf6",
                                  color: (liveAuction && liveAuction.status === "active") ? "#9ca3af" : "#fff",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: (liveAuction && liveAuction.status === "active") ? "not-allowed" : "pointer",
                                  fontWeight: "bold"
                                }}
                              >
                                Auction
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", background: "#f9fafb", borderRadius: "12px", border: "1px dashed #d1d5db" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>No products featured in this live stream yet. Add products to start auctions!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Chat Panel */}
        <div style={{ background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", height: isMobile ? "450px" : "600px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f3f4f6" }}>
            <h3 style={{ fontWeight: "bold" }}>💬 Live Chat</h3>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {chatMessages.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
                No messages yet. Say hi! 👋
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", color: "#8b5cf6" }}>
                  {msg.userName || "User"}
                </span>
                <p style={{ fontSize: "14px", color: "#374151", margin: "2px 0 0" }}>
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {token ? (
            <div style={{ padding: "12px", borderTop: "1px solid #f3f4f6", display: "flex", gap: "8px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }}
              />
              <button
                onClick={sendChat}
                style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}
              >
                Send
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px", borderTop: "1px solid #f3f4f6", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
              <Link to="/login" style={{ color: "#8b5cf6", fontWeight: "600" }}>Login</Link> to join the chat
            </div>
          )}
        </div>
      </div>

      {/* Winner Checkout Modal Overlay */}
      {showCheckout && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
              🎉 You Won the Auction!
            </h3>
            <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "20px" }}>
              You won <strong>{liveAuction?.product?.name}</strong> for <strong>₹{liveAuction?.currentPrice}</strong>. Enter your delivery address to complete your order.
            </p>
            <form onSubmit={handleCheckout}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                  Shipping Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ZIP"
                    value={shippingAddress.zip}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ background: "#f3f4f6", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>Payment Mode</span>
                <strong style={{ fontSize: "13px", color: "#374151" }}>💳 Simulated Card Payment (Instant Success)</strong>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  style={{ padding: "8px 14px", background: "#e5e7eb", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                >
                  Pay ₹{liveAuction?.currentPrice}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPage;
