import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", label: "English" },
    { code: "ta", label: "தமிழ்" },
    { code: "hi", label: "हिन्दी" },
    { code: "es", label: "Español" },
  ];

  const currentLanguage = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-zinc-200/60 cursor-pointer text-xs font-semibold"
      >
        <span>🌐</span>
        <span className="hidden sm:inline">{currentLanguage.label}</span>
        <span className="sm:hidden uppercase text-[10px]">{currentLanguage.code}</span>
        <svg className={`w-3 h-3 transform transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-zinc-100 shadow-xl rounded-2xl py-2 w-32 z-50 text-xs">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-zinc-50 font-semibold ${
                i18n.language === lang.code ? "text-emerald-600 bg-emerald-50/50" : "text-zinc-700"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
