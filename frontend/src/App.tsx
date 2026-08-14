import React, { useState, useEffect, useCallback } from "react";
import { HeaderBar, ActiveTab } from "./components/HeaderBar";
import { LogConsole, LogEntry, LogType } from "./components/LogConsole";
import { TransactionView } from "./components/TransactionView";
import { PairingView } from "./components/PairingView";
import { SettingView } from "./components/SettingView";

import {
  Connect,
  Disconnect,
  Connected,
  Config,
  UpdateConfig,
  Devices,
  RefreshDevices,
  Pair,
  Unpair,
  SendTransaction,
} from "../wailsjs/go/main/App";

import { EventsOn } from "../wailsjs/runtime/runtime";
import { config, edc, main } from "../wailsjs/go/models";

const PRESET_ENVIRONMENTS: config.Environment[] = [
  new config.Environment({
    id: "local",
    name: "Local Development",
    url: "wss://192.168.202.110:55567/ws_api_pos/v1/api/",
  }),
  new config.Environment({
    id: "public-dev",
    name: "Public Development",
    url: "wss://182.253.33.106:55571/ws_api_pos/v1/api/",
  }),
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("transaction");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [activeHostPort, setActiveHostPort] = useState<string>("N/A");

  const [environments, setEnvironments] =
    useState<config.Environment[]>(PRESET_ENVIRONMENTS);
  const [appConfig, setAppConfig] = useState<config.Config>(
    new config.Config(),
  );
  const [devices, setDevices] = useState<edc.Device[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((type: LogType, message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      type,
      message,
    };
    setLogs((prev) => [...prev, newEntry]);
  }, []);

  const parseHostPort = (urlStr: string) => {
    try {
      return new URL(urlStr).host;
    } catch {
      return urlStr;
    }
  };

  const refreshDevices = useCallback(async () => {
    try {
      await RefreshDevices();
    } catch (err: any) {
      addLog(
        "error",
        `Failed to request device refresh: ${err?.message || err}`,
      );
    }
  }, [addLog]);

  useEffect(() => {
    async function initApp() {
      try {
        const loadedConfig = await Config();
        if (loadedConfig) {
          setAppConfig(loadedConfig);

          const allEnvs = [
            ...PRESET_ENVIRONMENTS,
            ...(loadedConfig.customEnvironments || []),
          ];
          setEnvironments(allEnvs);

          const activeEnv =
            allEnvs.find((e) => e.id === loadedConfig.activeEnvironmentId) ||
            allEnvs[0];
          if (activeEnv) {
            setActiveHostPort(parseHostPort(activeEnv.url));
          }
        }

        const isConn = await Connected();
        setConnected(isConn);
        await refreshDevices();
        addLog("info", "POS Simulator initialized.");
      } catch (err: any) {
        addLog("error", `Initialization error: ${err?.message || err}`);
      }
    }

    initApp();

    const unsubscribeDevices = EventsOn(
      "devices:updated",
      (updatedDevices: edc.Device[]) => {
        setDevices(updatedDevices || []);
      },
    );

    const unsubscribeLog = EventsOn(
      "log",
      (data: { type: LogType; message: string }) => {
        addLog(data.type || "info", data.message);
      },
    );

    const unsubscribeStatus = EventsOn("status:change", (status: boolean) => {
      setConnected(status);
      addLog(
        status ? "info" : "warn",
        status ? "WebSocket Connected" : "WebSocket Disconnected",
      );
    });

    return () => {
      if (unsubscribeDevices) unsubscribeDevices();
      if (unsubscribeLog) unsubscribeLog();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [addLog, refreshDevices]);

  const handleToggleConnect = async () => {
    try {
      if (connected) {
        await Disconnect();
        setConnected(false);
        addLog("warn", "Disconnected from server.");
      } else {
        addLog("info", `Connecting to server (${activeHostPort})...`);
        await Connect();
        setConnected(true);
        addLog("info", "Connected successfully.");
      }
    } catch (err: any) {
      addLog("error", `Connection toggle failed: ${err?.message || err}`);
      setConnected(false);
    }
  };

  const handleEnvironmentChange = async (envId: string) => {
    const matchedEnv = environments.find((e) => e.id === envId);
    if (!matchedEnv) return;

    try {
      if (connected) {
        await Disconnect();
        setConnected(false);
        addLog("warn", "Disconnected prior to environment switch.");
      }

      const updatedConfig = new config.Config({
        ...appConfig,
        activeEnvironmentId: matchedEnv.id,
      });

      await UpdateConfig(updatedConfig);

      setAppConfig(updatedConfig);
      setActiveHostPort(parseHostPort(matchedEnv.url));

      addLog("info", `Switched environment to ${matchedEnv.name}`);
    } catch (err: any) {
      addLog("error", `Failed to switch environment: ${err?.message || err}`);
    }
  };

  // Pair Device Handler
  const handlePairDevice = async (req: main.PairRequest) => {
    try {
      addLog("sent", `Pairing terminal ${req.edcId}...`);
      await Pair(req);
      addLog("received", `Successfully paired ${req.edcId}`);
      await refreshDevices();
    } catch (err: any) {
      addLog("error", `Pairing failed: ${err?.message || err}`);
    }
  };

  // Unpair Device Handler
  const handleUnpairDevice = async (req: main.UnpairRequest) => {
    try {
      addLog("sent", `Unpairing terminal ${req.edcId}...`);
      await Unpair(req);
      addLog("received", `Successfully unpaired ${req.edcId}`);
      await refreshDevices();
    } catch (err: any) {
      addLog("error", `Unpairing failed: ${err?.message || err}`);
    }
  };

  // Send Transaction Handler
  const handleSendTransaction = async (req: main.SendTransactionRequest) => {
    try {
      addLog("sent", `Dispatching transaction to ${req.edcId}`);
      await SendTransaction(req);
      addLog("received", `Transaction request sent to backend successfully.`);
    } catch (err: any) {
      addLog("error", `Transaction dispatch failed: ${err?.message || err}`);
    }
  };

  const handleSaveConfig = async (newCfg: config.Config) => {
    try {
      await UpdateConfig(newCfg);
      setAppConfig(newCfg);
      addLog("info", "Configuration saved to backend successfully.");
      setIsSettingsOpen(false); // Close modal on save
    } catch (err: any) {
      addLog("error", `Failed to save configuration: ${err?.message || err}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-app-base text-content-primary overflow-hidden font-sans relative">
      <HeaderBar
        environments={environments}
        activeEnvId={appConfig.activeEnvironmentId || "local"}
        onEnvironmentChange={handleEnvironmentChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={connected}
        activeHostPort={activeHostPort}
        onToggleConnect={handleToggleConnect}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden bg-app-base">
        {activeTab === "pairing" && (
          <PairingView
            devices={devices}
            onRefreshDevices={refreshDevices}
            onPairDevice={handlePairDevice as any}
            onUnpairDevice={handleUnpairDevice as any}
          />
        )}
        {activeTab === "transaction" && (
          <TransactionView
            devices={devices}
            onRefreshDevices={refreshDevices}
            onSendTransaction={handleSendTransaction as any}
          />
        )}
      </main>

      <LogConsole logs={logs} onClear={() => setLogs([])} />

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
            <SettingView
              currentConfig={appConfig}
              onSaveConfig={handleSaveConfig}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
