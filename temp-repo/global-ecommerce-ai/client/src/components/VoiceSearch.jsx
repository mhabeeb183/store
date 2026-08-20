import { useState, useEffect, useRef, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

/**
 * Voice Search Component
 * Global voice search for the main navbar/search bar
 */
const VoiceSearch = ({ onSearch }) => {
  const [isListeningActive, setIsListeningActive] = useState(false);
  const [error, setError] = useState(null);
  const onSearchRef = useRef(onSearch);
  const transcriptRef = useRef("");
  const silenceTimer = useRef(null);

  // Keep ref current so the effect closure never goes stale
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // Track the latest transcript in a ref so the silence timer can read it
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const submitSearch = useCallback(() => {
    const text = transcriptRef.current.trim();
    if (text) {
      onSearchRef.current(text);
    }
    setIsListeningActive(false);
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  // Reset silence timer every time new words arrive
  useEffect(() => {
    if (!listening || !isListeningActive) return;
    if (!transcript) return;

    // Clear previous timer
    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    // Auto-submit 1.5 s after the user stops speaking
    silenceTimer.current = setTimeout(() => {
      SpeechRecognition.stopListening();
      submitSearch();
    }, 1500);

    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [transcript, listening, isListeningActive, submitSearch]);

  // Fallback: fire when the browser ends listening on its own (e.g. timeout)
  useEffect(() => {
    if (!listening && isListeningActive) {
      submitSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div title="Voice search not supported by this browser">
        <button
          disabled
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            cursor: "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            background: "#9ca3af",
            color: "#fff",
          }}
        >
          🎤
        </button>
      </div>
    );
  }

  const toggleListening = async () => {
    setError(null);

    if (listening) {
      // User clicked stop manually
      SpeechRecognition.stopListening();
      submitSearch();
      return;
    }

    if (!isMicrophoneAvailable) {
      setError("Microphone access denied. Please allow microphone.");
      return;
    }

    try {
      resetTranscript();
      transcriptRef.current = "";
      setIsListeningActive(true);
      await SpeechRecognition.startListening({
        continuous: true,       // Keep capturing until user stops or silence
        language: navigator.language || "en-IN",
      });
    } catch (err) {
      console.error("Voice search error:", err);
      setError("Could not start voice recognition. Try again.");
      setIsListeningActive(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Mic Button */}
      <button
        onClick={toggleListening}
        title={listening ? "Stop listening" : "Voice Search"}
        aria-label={listening ? "Stop voice search" : "Start voice search"}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          background: listening
            ? "linear-gradient(135deg, #ef4444, #f43f5e)"
            : error
            ? "linear-gradient(135deg, #f59e0b, #ef4444)"
            : "linear-gradient(135deg, #3b82f6, #6366f1)",
          color: "#fff",
          boxShadow: listening
            ? "0 0 0 4px rgba(239,68,68,0.3)"
            : "0 2px 8px rgba(59,130,246,0.3)",
          transition: "all 0.3s ease",
          animation: listening ? "pulse-ring 1.5s infinite" : "none",
        }}
      >
        {listening ? "⏹" : "🎤"}
      </button>

      {/* Listening tooltip */}
      {(listening || error) && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            right: "0",
            background: "#fff",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            minWidth: "220px",
            zIndex: 50,
          }}
        >
          {error ? (
            <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>
              ⚠️ {error}
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    animation: "blink 1s infinite",
                  }}
                />
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  Listening… speak now
                </span>
              </div>
              {transcript ? (
                <p style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", margin: 0 }}>
                  "{transcript}"
                </p>
              ) : (
                <p style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic", margin: 0 }}>
                  Waiting for speech…
                </p>
              )}
              <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "6px", marginBottom: 0 }}>
                Auto-submits after 1.5 s of silence
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
