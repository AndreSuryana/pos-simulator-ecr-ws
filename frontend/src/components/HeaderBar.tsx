import React, { useState, useEffect } from "react";
import { Settings, Sun, Moon } from "lucide-react";
import { config } from "../../wailsjs/go/models";

export type ActiveTab = "pairing" | "transaction";

interface HeaderBarProps {
  environments: config.Environment[];
  activeEnvId: string;
  onEnvironmentChange: (envId: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  connected: boolean;
  activeHostPort: string;
  onToggleConnect: () => void;
  onOpenSettings: () => void;
}

export function HeaderBar({
  environments,
  activeEnvId,
  onEnvironmentChange,
  activeTab,
  onTabChange,
  connected,
  activeHostPort,
  onToggleConnect,
  onOpenSettings,
}: HeaderBarProps) {
  // Initialize theme: Check localStorage first, then fallback to OS preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("app-theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    // If no saved preference, check system default
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply the .dark class and save to localStorage whenever state changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("app-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("app-theme", "light");
    }
  }, [isDarkMode]);

  // Optional: Listen for OS theme changes in real-time if the user hasn't forced a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("app-theme")) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <header className="flex flex-col bg-app-surface border-b border-app-border shrink-0 text-content-primary font-sans">
      {/* --- Row 1: Brand & Environment Picker --- */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-app-border/50">
        <span className="font-bold text-base tracking-wide text-brand-primary">
          POS Simulator
        </span>

        <div className="flex items-center gap-2">
          <select
            value={activeEnvId}
            onChange={(e) => onEnvironmentChange(e.target.value)}
            className="bg-app-overlay border border-app-overlay text-xs text-content-primary rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer min-w-[200px]"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 text-content-muted hover:text-content-primary hover:bg-app-overlay rounded-md transition-colors cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-content-muted hover:text-content-primary hover:bg-app-overlay rounded-md transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Row 2: Tabs & Connection Status --- */}
      <div className="flex justify-between px-4 h-12">
        {/* Left: Navigation Tabs */}
        <div className="flex items-end gap-1 h-full pt-2">
          <button
            onClick={() => onTabChange("pairing")}
            className={`px-4 h-full flex items-center text-xs font-medium rounded-t-md transition-colors cursor-pointer ${
              activeTab === "pairing"
                ? "bg-app-base text-brand-primary border-t-2 border-brand-primary"
                : "text-content-muted hover:text-content-primary hover:bg-app-overlay/50 border-t-2 border-transparent"
            }`}
          >
            Pairing
          </button>
          <button
            onClick={() => onTabChange("transaction")}
            className={`px-4 h-full flex items-center text-xs font-medium rounded-t-md transition-colors cursor-pointer ${
              activeTab === "transaction"
                ? "bg-app-base text-brand-primary border-t-2 border-brand-primary"
                : "text-content-muted hover:text-content-primary hover:bg-app-overlay/50 border-t-2 border-transparent"
            }`}
          >
            Transaction
          </button>
        </div>

        {/* Right: Connection Controls */}
        <div className="flex items-center gap-4 h-full">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono bg-app-base/40 px-3.5 py-1 rounded-full border border-app-border/80">
            <span
              className={`w-2 h-2 rounded-full ${
                connected
                  ? "bg-status-success animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                  : "bg-status-danger"
              }`}
            />
            <span
              className={
                connected ? "text-status-success" : "text-content-muted/80"
              }
            >
              {activeHostPort || "N/A"}
            </span>
          </div>

          <button
            onClick={onToggleConnect}
            className={`px-4 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              connected
                ? "bg-status-danger hover:bg-status-danger-hover text-app-base"
                : "bg-brand-primary hover:bg-brand-hover text-app-base"
            }`}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
    </header>
  );
}
