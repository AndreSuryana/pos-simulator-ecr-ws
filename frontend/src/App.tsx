import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { HeaderBar, ActiveTab } from "./components/HeaderBar";
import { LogConsole } from "./components/LogConsole";
import { TransactionView } from "./components/TransactionView";
import { PairingView } from "./components/PairingView";
import { SettingView } from "./components/SettingView";
import { UpdateDialog } from "./components/UpdateDialog";

import { Config, UpdateConfig, AppVersion } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { config } from "../wailsjs/go/models";

import { useLogs } from "./hooks/useLogs";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDevices } from "./hooks/useDevices";
import { useTransactions } from "./hooks/useTransactions";
import { useUpdater } from "./hooks/useUpdater";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("transaction");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [appConfig, setAppConfig] = useState<config.Config>(new config.Config());
  const [appVersion, setAppVersion] = useState<string>("");

  // 1. Logs hook
  const { logs, addLog, clearLogs } = useLogs();

  // 2. WebSocket hook
  const {
    connected,
    activeHostPort,
    environments,
    activeEnvId,
    toggleConnect,
    switchEnvironment,
  } = useWebSocket(appConfig, addLog, setAppConfig);

  // 3. Devices hook
  const { devices, refreshDevices, pairDevice, unpairDevice } = useDevices(
    connected,
    addLog,
  );

  // 4. Transactions hook
  const { sendTransaction } = useTransactions(connected, addLog);

  // 5. Updater hook
  const updater = useUpdater(appConfig, connected, setAppConfig);

  // Load configuration on mount
  useEffect(() => {
    AppVersion()
      .then((ver) => setAppVersion(ver))
      .catch((err) => console.error("Failed to load app version:", err));

    Config()
      .then((loaded) => {
        if (loaded) setAppConfig(loaded);
      })
      .catch((err) => {
        addLog("error", `Failed to load config: ${err?.message || err}`);
      });
  }, [addLog]);

  // Listen for server error events
  useEffect(() => {
    const cancelErrorEvent = EventsOn("server:error", (errMsg: string) => {
      toast.error(errMsg);
      addLog("error", errMsg);
    });

    return () => {
      if (cancelErrorEvent) cancelErrorEvent();
    };
  }, [addLog]);

  const handleSaveConfig = async (newCfg: config.Config) => {
    try {
      await UpdateConfig(newCfg);
      setAppConfig(newCfg);
      setIsSettingsOpen(false);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err?.message || err}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-app-base text-content-primary overflow-hidden font-sans relative">
      <HeaderBar
        environments={environments}
        activeEnvId={appConfig.activeEnvironmentId || activeEnvId}
        onEnvironmentChange={switchEnvironment}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={connected}
        activeHostPort={activeHostPort}
        onToggleConnect={toggleConnect}
        onOpenSettings={() => setIsSettingsOpen(true)}
        updateInfo={updater.updateInfo}
        onOpenUpdate={updater.openDialog}
        appVersion={appVersion}
      />

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden bg-app-base">
        {activeTab === "pairing" && (
          <PairingView
            devices={devices}
            connected={connected}
            onRefreshDevices={refreshDevices}
            onPairDevice={pairDevice as any}
            onUnpairDevice={unpairDevice as any}
          />
        )}
        {activeTab === "transaction" && (
          <TransactionView
            devices={devices}
            connected={connected}
            onRefreshDevices={refreshDevices}
            onSendTransaction={sendTransaction as any}
          />
        )}
      </main>

      <LogConsole logs={logs} onClear={clearLogs} />

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
            <SettingView
              currentConfig={appConfig}
              onSaveConfig={handleSaveConfig}
              onClose={() => setIsSettingsOpen(false)}
              onManualCheckUpdate={updater.manualCheck}
              isCheckingUpdate={updater.isChecking}
              appVersion={appVersion}
            />
          </div>
        </div>
      )}

      {/* Update Dialog Overlay */}
      {updater.isDialogOpen && updater.updateInfo && (
        <UpdateDialog
          info={updater.updateInfo}
          stage={updater.stage}
          progress={updater.progress}
          errorMessage={updater.errorMessage}
          connected={connected}
          onDownload={updater.startDownload}
          onCancel={updater.cancelUpdate}
          onClose={updater.dismissUpdate}
        />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            fontSize: "13px",
          },
          success: {
            iconTheme: {
              primary: "var(--status-success)",
              secondary: "var(--bg-surface)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--status-danger)",
              secondary: "var(--bg-surface)",
            },
          },
        }}
      />
    </div>
  );
}
