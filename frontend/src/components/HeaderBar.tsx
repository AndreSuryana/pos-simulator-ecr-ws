import React from "react";
import { Settings } from "lucide-react";
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
  return (
    <header className="flex flex-col bg-slate-900 border-b border-slate-800 shrink-0 text-slate-100 font-sans">
      {/* --- Row 1: Brand & Environment Picker --- */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800/50">
        <span className="font-bold text-base tracking-wide text-indigo-400">
          POS Simulator
        </span>

        <div className="flex items-center gap-2">
          <select
            value={activeEnvId}
            onChange={(e) => onEnvironmentChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
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
                ? "bg-slate-950 text-indigo-400 border-t-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-t-2 border-transparent"
            }`}
          >
            Pairing
          </button>
          <button
            onClick={() => onTabChange("transaction")}
            className={`px-4 h-full flex items-center text-xs font-medium rounded-t-md transition-colors cursor-pointer ${
              activeTab === "transaction"
                ? "bg-slate-950 text-indigo-400 border-t-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-t-2 border-transparent"
            }`}
          >
            Transaction
          </button>
        </div>

        {/* Right: Connection Controls */}
        <div className="flex items-center gap-4 h-full">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-950/40 px-3.5 py-1 rounded-full border border-slate-800/80">
            <span
              className={`w-2 h-2 rounded-full ${
                connected
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                  : "bg-rose-500"
              }`}
            />
            <span className={connected ? "text-emerald-400" : "text-slate-500"}>
              {activeHostPort || "N/A"}
            </span>
          </div>

          <button
            onClick={onToggleConnect}
            className={`px-4 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
              connected
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
    </header>
  );
}
