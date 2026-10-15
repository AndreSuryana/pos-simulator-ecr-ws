import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { RefreshDevices, Pair, Unpair } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { edc, main } from "../../wailsjs/go/models";
import { LogType } from "../components/LogConsole";

export function useDevices(
  connected: boolean,
  onLog: (type: LogType, message: string) => void,
) {
  const [devices, setDevices] = useState<edc.Device[]>([]);

  const refreshDevices = useCallback(async () => {
    if (!connected) return;
    try {
      await RefreshDevices();
    } catch (err: any) {
      onLog("error", `Failed to request device refresh: ${err?.message || err}`);
    }
  }, [connected, onLog]);

  useEffect(() => {
    const cancelDevicesEvent = EventsOn("devices:updated", (updatedList: edc.Device[]) => {
      setDevices(updatedList || []);
    });

    return () => {
      if (cancelDevicesEvent) cancelDevicesEvent();
    };
  }, []);

  const pairDevice = useCallback(
    async (req: main.PairRequest) => {
      try {
        await Pair(req);
        onLog("received", `Successfully paired ${req.edcId}`);
        toast.success(`Successfully paired ${req.edcId}`);
        await refreshDevices();
      } catch (err: any) {
        const errMsg = err?.message || err;
        onLog("error", `Pairing failed: ${errMsg}`);
        toast.error(`Pairing failed: ${errMsg}`);
      }
    },
    [onLog, refreshDevices],
  );

  const unpairDevice = useCallback(
    async (req: main.UnpairRequest) => {
      try {
        await Unpair(req);
        onLog("received", `Successfully unpaired ${req.edcId}`);
        toast.success(`Successfully unpaired ${req.edcId}`);
        await refreshDevices();
      } catch (err: any) {
        const errMsg = err?.message || err;
        onLog("error", `Unpairing failed: ${errMsg}`);
        toast.error(`Unpairing failed: ${errMsg}`);
      }
    },
    [onLog, refreshDevices],
  );

  return {
    devices,
    refreshDevices,
    pairDevice,
    unpairDevice,
  };
}
