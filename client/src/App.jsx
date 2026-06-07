import { useState, useRef, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import ScraperPanel from "./components/ScraperPanel";
import SettingsPanel from "./components/SettingsPanel";
import CronPanel from "./components/CronPanel";

const TABS = ["Dashboard", "Scraper", "Settings", "Cron Job"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState("right");
  const [cronEnabled, setCronEnabled] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const prevIndex = useRef(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const check = () => fetch("/api/cron").then((r) => r.json())
      .then((d) => setCronEnabled((prev) => prev !== d.enabled ? d.enabled : prev))
      .catch(() => {});
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  const handleTab = (tab) => {
    if (tab === activeTab) return;
    const newIndex = TABS.indexOf(tab);
    setDirection(newIndex > prevIndex.current ? "right" : "left");
    setSliding(true);
    prevIndex.current = newIndex;

    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setSliding(false), 20);
    }, 150);
  };

  const slideClass = sliding
    ? `page-slide page-slide-out-${direction}`
    : `page-slide page-slide-in-${direction}`;

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">LinkedIn Scrapper Tool</div>
        <div className="navbar-tabs">
          {TABS.map((tab) => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTab(tab)}>{tab}{tab === "Cron Job" && cronEnabled && " \u23F0"}</button>
          ))}
        </div>
        <div className="navbar-icons">
          <span className="navbar-icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme"
            style={{ fontSize: "1.1rem", padding: "4px 8px", border: "none" }}>
            {theme === "dark" ? "\u{263C}" : "\u{263E}"}
          </span>
        </div>
      </nav>

      <div className={slideClass}>
        {activeTab === "Dashboard" && <Dashboard onNavigate={handleTab} />}
        {activeTab === "Scraper" && <ScraperPanel />}
        {activeTab === "Settings" && <SettingsPanel />}
        {activeTab === "Cron Job" && <CronPanel />}
      </div>

      <footer className="footer">
        <span>LinkedIn Emailer Tool</span>
        <span>&copy; 2026 LinkedIn Emailer Tool. All rights reserved.</span>
      </footer>
    </div>
  );
}
