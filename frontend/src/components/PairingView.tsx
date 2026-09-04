import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link2, Unlink, RefreshCw, Smartphone } from "lucide-react";
import { edc, main } from "../../wailsjs/go/models";

interface PairingViewProps {
  devices?: edc.Device[];
  connected: Boolean;
  onRefreshDevices?: () => Promise<void> | void;
  onPairDevice?: (req: main.PairRequest) => Promise<void>;
  onUnpairDevice?: (req: main.UnpairRequest) => Promise<void>;
}

export function PairingView({
  devices = [],
  connected = false,
  onRefreshDevices,
  onPairDevice,
  onUnpairDevice,
}: PairingViewProps) {
  const [pairEdcId, setPairEdcId] = useState<string>("");
  const [pairCode, setPairCode] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      toast.error("Cannot pair: WebSocket is disconnected");
      return;
    }

    if (!pairEdcId.trim() || !pairCode.trim()) {
      toast.error("Please enter both EDC ID and Pair Code", { icon: "⚠️" });
      return;
    }

    const payload = new main.PairRequest({
      edcId: pairEdcId.trim(),
      pairCode: pairCode.trim(),
    });

    if (onPairDevice) {
      await onPairDevice(payload);
    } else {
      console.log("Pair Request:", payload);
    }

    setPairEdcId("");
    setPairCode("");
  };

  const handleUnpairSubmit = async (targetEdcId: string) => {
    if (!targetEdcId) return;

    if (!connected) {
      toast.error("Cannot unpair: WebSocket is disconnected");
      return;
    }

    const payload = new main.UnpairRequest({
      edcId: targetEdcId,
    });

    if (onUnpairDevice) {
      await onUnpairDevice(payload);
    } else {
      console.log("Unpair Request:", payload);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    if (!connected) {
      toast.error("Cannot refresh: WebSocket is disconnected");
      return;
    }

    setIsRefreshing(true);
    try {
      if (onRefreshDevices) {
        await onRefreshDevices();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-3 p-4 overflow-hidden font-sans text-content-primary">
      {/* LEFT PANEL: Pair Control */}
      <div className="w-full md:w-72 lg:w-80 shrink-0 h-full">
        <div className="bg-app-surface border border-app-border rounded-lg p-4 flex flex-col gap-3 shadow-sm h-full">
          <div className="flex items-center gap-2 border-b border-app-border pb-2 shrink-0 min-h-8">
            <Link2 className="w-3.5 h-3.5 text-brand-primary" />
            <h2 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
              Pair Terminal Device
            </h2>
          </div>

          <form onSubmit={handlePairSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-content-muted font-medium">
                EDC ID
              </label>
              <input
                type="text"
                value={pairEdcId}
                onChange={(e) => setPairEdcId(e.target.value)}
                placeholder="e.g. EDC-001"
                className="bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary font-mono transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-content-muted font-medium">
                Pair Code
              </label>
              <input
                type="text"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
                placeholder="e.g. 123456"
                className="bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!pairEdcId.trim() || !pairCode.trim()}
              className="mt-1 w-full flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-hover disabled:bg-app-overlay disabled:text-content-muted/80 text-app-base font-medium py-1.5 rounded-md text-xs transition cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Pair Device</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Active Terminals Visual Grid */}
      <div className="flex-1 bg-app-surface border border-app-border rounded-lg p-4 flex flex-col gap-3 overflow-hidden shadow-sm h-full">
        <div className="flex items-center justify-between border-b border-app-border pb-2 shrink-0 min-h-8">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-brand-primary" />
            <h2 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
              Paired EDC Devices ({devices.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-app-overlay hover:bg-content-muted/20 disabled:opacity-50 text-content-primary/90 rounded-md text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? "animate-spin text-brand-primary" : ""}`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        {/* Device Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {devices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-content-muted/80 gap-2">
              <Smartphone className="w-8 h-8 stroke-1 opacity-40" />
              <p className="text-xs">No paired EDC devices found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {devices.map((device) => (
                <div
                  key={device.edc_id}
                  className="bg-app-base border border-app-border/80 rounded-lg p-2.5 flex items-center justify-between gap-2 hover:border-app-overlay transition shadow-sm"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[9px] font-semibold text-content-muted/80 uppercase tracking-wider mb-0.5">
                      Terminal ID
                    </span>
                    <span
                      className="font-mono text-xs font-bold text-content-primary truncate"
                      title={device.edc_id}
                    >
                      {device.edc_id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnpairSubmit(device.edc_id)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/20 rounded-md text-[10px] font-medium transition-colors cursor-pointer focus:ring-2 focus:ring-status-danger/50 outline-none"
                    title="Unpair this terminal"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unpair</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
