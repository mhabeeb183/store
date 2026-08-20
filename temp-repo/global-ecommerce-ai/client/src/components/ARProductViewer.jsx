import React, { useState, useEffect, useRef } from "react";
import "@google/model-viewer";
import axios from "axios";

// Public HTTPS fallback mappings for pre-seeded models.
// Android's native Google Scene Viewer does not allow loading models over unencrypted cleartext HTTP connections (such as localhost or local network IPs).
const PUBLIC_HTTPS_FALLBACKS = {
  "/assets/damagedhelmet.glb": "https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  "/assets/robotexpressive.glb": "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
  "/assets/materialsvariantsshoe.glb": "https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb",
  "/assets/toycar.glb": "https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/ToyCar/glTF-Binary/ToyCar.glb",
  "/assets/sheenchair.glb": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
  "/assets/zky8st19pdikibwes5an.glb": "https://res.cloudinary.com/dugvuaam3/raw/upload/v1785520994/products/models/zky8st19pdikibwes5an?ext=.glb",
  "/assets/anuh4fgbysdwex9yhcjh.glb": "https://res.cloudinary.com/dugvuaam3/raw/upload/v1785862430/products/models/anuh4fgbysdwex9yhcjh?ext=.glb"
};

/**
 * AR/VR Product Viewer Component
 * Uses @google/model-viewer for true 3D and AR experiences.
 * If arModelUrl is not provided, it falls back to displaying the product image.
 * Supports desktop QR Code scanning to view on mobile.
 */
const ARProductViewer = ({ product }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [localIp, setLocalIp] = useState("localhost");
  const modelViewerRef = useRef(null);

  // Web-based AR Camera States
  const [isArActive, setIsArActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [permissionState, setPermissionState] = useState("prompt"); // 'prompt', 'granted', 'denied', 'unavailable', 'error'
  const videoRef = useRef(null);
  const arModelViewerRef = useRef(null);

  const isMobileDevice = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const modelUrl = product?.arModelUrl
    ? (product.arModelUrl.toLowerCase().endsWith(".glb") ||
       product.arModelUrl.toLowerCase().endsWith(".gltf") ||
       product.arModelUrl.includes(".glb?") ||
       product.arModelUrl.includes(".gltf?")
        ? product.arModelUrl
        : (product.arModelUrl.includes("?") 
           ? `${product.arModelUrl}&ext=.glb` 
           : `${product.arModelUrl}?ext=.glb`))
    : "";

  useEffect(() => {
    setIsMounted(true);
    // Fetch PC's network IP from server for QR code connection
    axios.get("http://localhost:5000/api/scenes/ip")
      .then(({ data }) => {
        if (data.ip) {
          try {
            // Decode the base64 masked IP address
            const decodedIp = atob(data.ip);
            setLocalIp(decodedIp);
          } catch (e) {
            setLocalIp(data.ip);
          }
        }
      })
      .catch((err) => {
        console.error("Could not fetch server local IP:", err);
      });
  }, []);


  useEffect(() => {
    const el = modelViewerRef.current;
    if (!el) return;

    try {
      el.setAttribute("ar", "");
      el.setAttribute("ar-modes", "scene-viewer webxr quick-look");
      el.setAttribute("camera-controls", "");
      el.setAttribute("auto-rotate", "");
      el.setAttribute("shadow-intensity", "1");
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("interaction-prompt", "none");
      el.setAttribute("touch-action", "none");
    } catch (e) {
      console.error("Error setting model-viewer attributes:", e);
    }
  }, [modelUrl]);

  const posterUrl = product?.images?.[0] || "/assets/poster-astronaut.webp";
  
  // Get current page URL and replace localhost or 127.0.0.1 with the real PC IP for mobile scanning
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const displayUrl = currentUrl
    .replace("localhost", localIp)
    .replace("127.0.0.1", localIp);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(displayUrl)}&color=000000&bgcolor=ffffff`;

  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError("");
    setPermissionState("prompt");

    console.log("[AR Camera] Camera permission requested...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[AR Camera] navigator.mediaDevices unavailable");
      setPermissionState("unavailable");
      setCameraError("Your browser or device does not support WebAR camera access, or you are not in a secure (HTTPS) context.");
      setIsCameraLoading(false);
      return;
    }

    try {
      console.log("[AR Camera] Calling getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log("[AR Camera] Camera stream successfully created.");
      setCameraStream(stream);
      setPermissionState("granted");

      // Set stream on the video element once it is mounted
      setTimeout(() => {
        if (videoRef.current) {
          console.log("[AR Camera] Video element received the stream.");
          videoRef.current.srcObject = stream;
          videoRef.current.play()
            .then(() => {
              console.log("[AR Camera] Video started playing.");
            })
            .catch(e => {
              console.error("[AR Camera] Video failed to start playing:", e);
            });
        }
      }, 100);
    } catch (err) {
      console.error("[AR Camera] Browser error occurred:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionState("denied");
        setCameraError("Camera permission denied. Please allow camera access in your browser settings to experience AR.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermissionState("error");
        setCameraError("No rear/environment camera found on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setPermissionState("error");
        setCameraError("Camera is already in use by another app or browser tab.");
      } else if (err.name === "OverconstrainedError") {
        setPermissionState("error");
        setCameraError("No camera matches the requested high-quality environment constraints.");
      } else if (err.name === "SecurityError") {
        setPermissionState("error");
        setCameraError("Security block: Camera access is not allowed on this origin.");
      } else {
        setPermissionState("error");
        setCameraError(`Camera error: ${err.message || err.name}`);
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    console.log("[AR Camera] Cleaning up camera stream...");
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[AR Camera] Stopped track: ${track.label}`);
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isArActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isArActive]);

  const launchNativeAR = () => {
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid && product?.arModelUrl) {
      // Build absolute model URL with extension query param for correct model-viewer parsing
      let finalModelUrl = product.arModelUrl.toLowerCase().endsWith(".glb") ||
                            product.arModelUrl.toLowerCase().endsWith(".gltf") ||
                            product.arModelUrl.includes(".glb?") ||
                            product.arModelUrl.includes(".gltf?")
                              ? product.arModelUrl
                              : (product.arModelUrl.includes("?") 
                                 ? `${product.arModelUrl}&ext=.glb` 
                                 : `${product.arModelUrl}?ext=.glb`);

      // Map local pre-seeded model URLs to public secure HTTPS fallback URLs if running in local development mode.
      const normalizedPath = finalModelUrl.toLowerCase().split("?")[0];
      if (PUBLIC_HTTPS_FALLBACKS[normalizedPath]) {
        finalModelUrl = PUBLIC_HTTPS_FALLBACKS[normalizedPath];
      } else if (!finalModelUrl.startsWith("http://") && !finalModelUrl.startsWith("https://")) {
        try {
          finalModelUrl = new URL(finalModelUrl, window.location.href).href;
        } catch (e) {
          console.error("Error resolving absolute model URL:", e);
        }
      }

      // Build native Google Scene Viewer intent URL
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(finalModelUrl)}&mode=ar_only&title=${encodeURIComponent(product.name || "Product")}` + 
                        `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`;
      
      console.log("[AR Camera] Launching Google Scene Viewer intent:", intentUrl);
      window.location.href = intentUrl;
    } else if (isIOS && product?.arModelUrl) {
      if (modelViewerRef.current) {
        console.log("[AR Camera] Activating iOS Quick Look...");
        modelViewerRef.current.activateAR();
      }
    } else {
      if (modelViewerRef.current) {
        console.log("[AR Camera] Activating fallback AR...");
        modelViewerRef.current.activateAR();
      }
    }
  };

  const handleARActivation = () => {
    if (isMobileDevice) {
      const hasCameraSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      if (hasCameraSupport) {
        console.log("[AR Camera] WebAR camera support detected. Launching custom overlay...");
        setIsArActive(true);
      } else {
        console.log("[AR Camera] getUserMedia unavailable (likely insecure HTTP context). Falling back to native viewer...");
        launchNativeAR();
      }
    } else {
      setShowQrModal(true);
    }
  };

  if (!isMounted) return null;

  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", position: "relative" }}>
      {/* Mode Indicator */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <div style={{ flex: 1, padding: "12px", textAlign: "center", color: "#374151", fontWeight: "600", fontSize: "14px" }}>
          {modelUrl ? "📱 True 3D & AR Mode Enabled" : "🖼️ 2D Image View (No 3D Model Available)"}
        </div>
      </div>

      {/* 3D/AR Viewer or Fallback */}
      <div
        style={{
          width: "100%",
          height: "500px",
          background: modelUrl ? "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" : "#f9fafb",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {modelUrl ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <model-viewer
              ref={modelViewerRef}
              src={modelUrl}
              ios-src={product?.arModelUrl ? product.arModelUrl.replace(".glb", ".usdz") : ""}
              alt={product?.name || "A 3D model of the product"}
              shadow-intensity="1"
              environment-image="neutral"
              camera-controls=""
              auto-rotate=""
              interaction-prompt="none"
              touch-action="none"
              ar=""
              ar-modes="scene-viewer webxr quick-look"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <div 
                slot="poster" 
                className="custom-poster absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] z-10 pointer-events-none transition-opacity duration-500" 
                draggable="false"
              >
                <img 
                  src={posterUrl} 
                  alt="Product Loading..." 
                  className="max-w-[70%] max-h-[70%] object-contain mb-5" 
                  draggable="false" 
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-black/10 border-l-blue-600 rounded-full animate-spin"></div>
                  <div className="text-xs text-slate-800 font-semibold tracking-wider">Loading 3D Model...</div>
                </div>
              </div>
            </model-viewer>

            {/* Unified AR Button */}
            <button
              onClick={handleARActivation}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "24px",
                border: "none",
                position: "absolute",
                bottom: "20px",
                right: "20px",
                padding: "12px 22px",
                fontWeight: "bold",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#1d4ed8";
                e.target.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#2563eb";
                e.target.style.transform = "scale(1)";
              }}
            >
              <span>🕶️</span> View in your space
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <img 
              src={posterUrl} 
              alt={product?.name} 
              style={{ maxHeight: "350px", objectFit: "contain", margin: "0 auto", borderRadius: "8px" }} 
            />
            <p style={{ marginTop: "20px", color: "#6b7280", fontSize: "14px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
              A 3D model (.glb) is not currently available for this product. Vendors can upload an AR model in the dashboard to enable immersive AR/VR viewing.
            </p>
          </div>
        )}

        {/* Mode Label */}
        {modelUrl && (
          <div style={{
            position: "absolute", top: "16px", left: "16px",
            background: "rgba(0,0,0,0.6)", color: "#fff",
            padding: "6px 14px", borderRadius: "20px", fontSize: "12px",
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
            zIndex: 5
          }}>
            🎮 Drag to rotate, scroll to zoom. Use AR button to place.
          </div>
        )}
      </div>

      {/* Desktop QR Code AR Modal */}
      {showQrModal && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px",
          borderRadius: "16px",
          animation: "fadeIn 0.25s ease-out forwards"
        }}>
          <div style={{
            background: "#121214",
            border: "1px solid #27272a",
            borderRadius: "24px",
            padding: "32px 24px",
            maxWidth: "340px",
            width: "100%",
            textAlign: "center",
            color: "white",
            position: "relative",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#1f1f23",
                border: "1px solid #2d2d30",
                color: "#a1a1aa",
                cursor: "pointer",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px"
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "8px", letterSpacing: "0.5px" }}>
              📱 Scan to View in AR
            </h3>
            <p style={{ fontSize: "11px", color: "#a1a1aa", lineHeight: "1.5", marginBottom: "20px" }}>
              Scan the QR code with your mobile camera to instantly place this product in your room!
            </p>

            {/* QR Code Container */}
            <div style={{
              background: "white",
              padding: "12px",
              borderRadius: "16px",
              display: "inline-block",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              marginBottom: "16px"
            }}>
              <img src={qrCodeUrl} alt="AR QR Code" style={{ display: "block" }} />
            </div>

            <p style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
              ⚡ Powered by WebXR
            </p>
          </div>
        </div>
      )}

      {/* Web-based AR Fullscreen Overlay */}
      {isArActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Loading state spinner */}
          {isCameraLoading && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              zIndex: 10,
              background: "#121214"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "4px solid rgba(255,255,255,0.1)",
                borderLeftColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "16px"
              }}></div>
              <p style={{ fontSize: "14px", fontWeight: "600" }}>Initializing AR Camera...</p>
            </div>
          )}

          {/* Error / Denied / Unavailable States */}
          {permissionState === "denied" && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              zIndex: 10,
              background: "#121214",
              padding: "24px",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</span>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Camera Access Denied</h4>
              <p style={{ fontSize: "14px", color: "#a1a1aa", maxWidth: "320px", marginBottom: "24px", lineHeight: "1.5" }}>
                {cameraError}
              </p>
              <button
                onClick={() => setIsArActive(false)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 24px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Go Back
              </button>
            </div>
          )}

          {permissionState === "unavailable" && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              zIndex: 10,
              background: "#121214",
              padding: "24px",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</span>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>AR Camera Unavailable</h4>
              <p style={{ fontSize: "14px", color: "#a1a1aa", maxWidth: "320px", marginBottom: "24px", lineHeight: "1.5" }}>
                {cameraError}
              </p>
              <button
                onClick={() => setIsArActive(false)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 24px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Go Back
              </button>
            </div>
          )}

          {permissionState === "error" && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              zIndex: 10,
              background: "#121214",
              padding: "24px",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "48px", marginBottom: "16px" }}>❌</span>
              <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Camera Connection Failed</h4>
              <p style={{ fontSize: "14px", color: "#ef4444", maxWidth: "320px", marginBottom: "24px", lineHeight: "1.5" }}>
                {cameraError}
              </p>
              <button
                onClick={() => setIsArActive(false)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 24px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* Active WebAR Rendering Layer */}
          {permissionState === "granted" && (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {/* Layer 1: Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => {
                  console.log("[AR Camera] Video metadata loaded.");
                }}
                onPlay={() => {
                  console.log("[AR Camera] Video started playing.");
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 1,
                  pointerEvents: "none"
                }}
              />

              {/* Layer 2: Model Viewer (Transparent) */}
              <model-viewer
                ref={arModelViewerRef}
                src={modelUrl}
                alt={product?.name || "3D model"}
                camera-controls
                interaction-prompt="none"
                touch-action="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 2,
                  background: "transparent",
                  "--poster-color": "transparent"
                }}
              />

              {/* Layer 3: Controls Overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                zIndex: 3,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "20px"
              }}>
                {/* Header Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", pointerEvents: "auto" }}>
                  <button
                    onClick={() => setIsArActive(false)}
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      color: "white",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      cursor: "pointer"
                    }}
                  >
                    ✕
                  </button>
                  <div style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backdropFilter: "blur(4px)"
                  }}>
                    AR Try-On Mode
                  </div>
                </div>

                {/* Center scan instructions overlay */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center"
                }}>
                  <p style={{
                    background: "rgba(0,0,0,0.65)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    maxWidth: "280px",
                    lineHeight: "1.4",
                    marginBottom: "16px",
                    backdropFilter: "blur(4px)"
                  }}>
                    Point camera at floor or flat space and drag to position product
                  </p>
                  <div className="phone-scan-icon" style={{
                    width: "40px",
                    height: "60px",
                    border: "3px solid white",
                    borderRadius: "8px",
                    animation: "horizontalScan 2.5s ease-in-out infinite"
                  }}></div>
                </div>

                {/* Footer Controls */}
                <div style={{
                  background: "rgba(0,0,0,0.7)",
                  padding: "16px",
                  borderRadius: "16px",
                  color: "white",
                  textAlign: "center",
                  width: "100%",
                  pointerEvents: "auto",
                  backdropFilter: "blur(6px)"
                }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>
                    {product?.name}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#a1a1aa" }}>
                    Category: {product?.category} | Brand: {product?.brand}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animations style injection */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes horizontalScan {
          0% { transform: translateX(-35px) rotate(-12deg); }
          50% { transform: translateX(35px) rotate(12deg); }
          100% { transform: translateX(-35px) rotate(-12deg); }
        }
      `}</style>

      {/* Dynamic inline styles are avoided to comply with Content Security Policy */}
    </div>
  );
};

export default ARProductViewer;
