import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="px-3 py-2 rounded bg-yellow-400 text-black font-bold"
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="es">Español</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
};

export default LanguageSwitcher;