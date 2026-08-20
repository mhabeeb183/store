import { useState, useRef } from "react";

const VoiceSearch = ({ onSearch }) => {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  if (SpeechRecognition && !recognitionRef.current) {
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    recognitionRef.current = rec;
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Voice search not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setError(null);
    setListening(true);

    try {
      recognitionRef.current.start();
      
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          onSearch(text);
        }
        setListening(false);
      };

      recognitionRef.current.onerror = (err) => {
        console.error("Voice search error:", err);
        setError("Microphone permission denied or error.");
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

  return (
    <div className="relative flex items-center">
      <button
        onClick={toggleListening}
        type="button"
        className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer border ${
          listening
            ? "bg-red-500 hover:bg-red-600 text-white animate-pulse border-transparent shadow-red-500/20"
            : error
            ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent"
            : "bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200"
        }`}
        title={listening ? "Stop listening" : "Voice Search"}
      >
        {listening ? (
          <span className="text-xs">⏹</span>
        ) : (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Listening status popup */}
      {(listening || error) && (
        <div className="absolute top-12 right-0 bg-white border border-zinc-100 shadow-xl rounded-2xl p-4 w-56 z-50 animate-fade-in text-xs">
          {error ? (
            <p className="text-red-500 font-semibold m-0 flex items-center gap-1">
              ⚠️ {error}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                <span>Listening... speak now</span>
              </div>
              <p className="text-zinc-400 italic">Try: "Fresh Tomatoes" or "Organic Carrots"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
