import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addToCartAsync } from "../features/cart/cartSlice.js";
import { useToast } from "../context/ToastContext.jsx";

const ChatWidget = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi 👋 I'm your AI Grocery Assistant. How can I help you shop today?",
    },
  ]);

  const { token, isAuthenticated } = useSelector((state) => state.user);

  // Native Web Speech API Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  if (SpeechRecognition && !recognitionRef.current) {
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    recognitionRef.current = rec;
  }

  const startVoiceSearch = () => {
    if (!recognitionRef.current) return;
    
    setListening(true);
    try {
      recognitionRef.current.start();
      
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setMessage(text);
        }
        setListening(false);
      };

      recognitionRef.current.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    } catch (e) {
      console.error(e);
      setListening(false);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Scroll to bottom whenever messages update or panel opens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Synchronize history with DB when user logs in and opens the chat
  useEffect(() => {
    const syncChatHistory = async () => {
      if (!token) {
        // Logged out: reset to welcome message
        setMessages([
          {
            sender: "bot",
            text: "Hi 👋 I'm your AI Grocery Assistant. How can I help you shop today?",
          },
        ]);
        return;
      }

      if (open) {
        try {
          const res = await fetch("/api/chatbot/history", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.messages && data.messages.length > 0) {
              const formatted = data.messages.map((m) => ({
                sender: m.sender,
                text: m.text,
              }));
              setMessages(formatted);
            }
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      }
    };

    syncChatHistory();
  }, [open, token]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsgText = message;
    setMessage("");

    const userMessage = {
      sender: "user",
      text: userMsgText,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Find the last bot message that has products to provide context
      const lastBotMsgWithProducts = [...messages]
        .reverse()
        .find((m) => m.sender === "bot" && m.products && m.products.length > 0);
      const lastProductIds = lastBotMsgWithProducts 
        ? lastBotMsgWithProducts.products.map((p) => p.id) 
        : [];

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMsgText,
          lastProductIds,
        }),
      });

      if (!res.ok) {
        throw new Error("Chatbot API response error");
      }

      const data = await res.json();

      const botMessage = {
        sender: "bot",
        text: data.reply,
        products: data.products || [],
        type: data.type || null,
        recommendation: data.recommendation || null,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I had some trouble connecting to the assistant. Please try again! 📴",
        },
      ]);
    }
  };

  const handleBuyNow = (prod) => {
    if (!isAuthenticated) {
      showToast("Please log in to purchase items!", "warning");
      navigate("/login");
      return;
    }
    navigate("/checkout", { state: { buyNowItem: prod } });
  };

  return (
    <>
      {/* Floating Action Button with pulsing backdrop */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-600/30 z-50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center focus:outline-none"
        aria-label="Toggle AI Assistant Chat"
      >
        {open ? (
          <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Main Chat Box */}
      {open && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[75vh] sm:h-[620px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-zinc-100 transition-all duration-500 transform translate-y-0 opacity-100 flex flex-col">
          
          {/* Custom Sleek Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full animate-ping"></span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
              </div>
              <div>
                <h2 className="font-bold text-base tracking-wide leading-tight">
                  AI Grocery Assistant
                </h2>
                <p className="text-[11px] text-indigo-100 flex items-center gap-1">
                  Online &bull; Ready to help
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm transition-all ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white ml-auto rounded-br-none"
                      : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Comparison Card View */}
                {msg.type === "comparison" && msg.products?.length >= 2 && (
                  <div className="bg-gradient-to-b from-amber-50/60 to-orange-50/20 border border-amber-200/80 rounded-2xl p-4 mt-3 shadow-inner">
                    <h3 className="font-bold text-sm text-amber-800 mb-3 flex items-center gap-1.5">
                      ⚖️ Product Comparison Recommendation
                    </h3>

                    <div className="space-y-4">
                      {/* Products Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {msg.products.slice(0, 2).map((prod, idx) => (
                          <div key={prod.id} className="bg-white p-3 rounded-xl border border-zinc-200/60 shadow-sm flex flex-col items-center">
                            <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover rounded-lg mb-2" />
                            <span className="font-semibold text-xs text-center text-zinc-700 block line-clamp-1">{prod.name}</span>
                            <span className="text-indigo-600 font-bold text-sm mt-1">{prod.price}</span>
                          </div>
                        ))}
                      </div>

                      {/* Highlight Banner */}
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col items-center text-center">
                        <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold">🏆 Best Value Choice</span>
                        <strong className="text-emerald-900 text-sm mt-0.5">{msg.recommendation}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Search Listing */}
                {msg.type !== "comparison" && msg.products?.map((product) => (
                  <div
                    key={product.id}
                    className="mt-3 bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex p-3 gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-xl border border-zinc-100"
                        />
                      )}

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-800 line-clamp-1">
                            {product.name}
                          </h4>
                          <p className="text-emerald-600 font-extrabold text-base mt-0.5">
                            {product.price}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => dispatch(addToCartAsync(product))}
                            className="flex-1 bg-indigo-600 text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-indigo-700 active:scale-98 transition"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="flex-1 bg-orange-500 text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-orange-600 active:scale-98 transition"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Console */}
          <div className="p-3 border-t border-zinc-100 bg-white">
            
            {/* Visual listening indicator */}
            {listening && (
              <div className="flex items-center gap-2 mb-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 animate-pulse">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                🎤 Listening... Speak now
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask assistant to 'find tomatoes'..."
                className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-100 transition duration-200 placeholder-zinc-400"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

              {/* Native Voice Assistant Trigger */}
              {SpeechRecognition && (
                <button
                  type="button"
                  onClick={listening ? stopVoiceSearch : startVoiceSearch}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${
                    listening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                  }`}
                  title="Speech Recognition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={sendMessage}
                className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-700 active:scale-95 transition"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
