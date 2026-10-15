import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Connect, Disconnect, Connected } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { config } from "../../wailsjs/go/models";
import { LogType } from "../components/LogConsole";

export const PRESET_ENVIRONMENTS: config.Environment[] = [
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

function parseHostPort(urlStr: string): string {
  try {
    return new URL(urlStr).host;
  } catch {
    return urlStr;
  }
}

export function useWebSocket(
  appConfig: config.Config,
  onLog: (type: LogType, message: string) => void,
) {
  const [connected, setConnected] = useState<boolean>(false);
  const [activeHostPort, setActiveHostPort] = useState<string>("N/A");
  const [environments, setEnvironments] = useState<config.Environment[]>(PRESET_ENVIRONMENTS);
  const [activeEnvId, setActiveEnvId] = useState<string>("local");

  // Keep environments and activeEnvId in sync with loaded configuration
  useEffect(() => {
    const allEnvs = [
      ...PRESET_ENVIRONMENTS,
      ...(appConfig.customEnvironments || []),
    ];
    setEnvironments(allEnvs);

    const targetEnvId = appConfig.activeEnvironmentId || "local";
    setActiveEnvId(targetEnvId);

    const activeEnv = allEnvs.find((e) => e.id === targetEnvId) || allEnvs[0];
    if (activeEnv) {
      setActiveHostPort(parseHostPort(activeEnv.url));
    }
  }, [appConfig]);

  // Check initial connection status & listen to status events
  useEffect(() => {
    Connected()
      .then((isConn) => setConnected(isConn))
      .catch(() => setConnected(false));

    const cancelConnEvent = EventsOn("connection:status", (status: string) => {
      if (status === "connected") {
        setConnected(true);
        toast.success("WebSocket connected");
        onLog("info", "WebSocket connected");
      } else if (status === "disconnected") {
        setConnected(false);
        toast("WebSocket disconnected", { icon: "🔌" });
        onLog("warn", "WebSocket disconnected");
      } else if (status === "registered") {
        toast.success("POS terminal registered");
        onLog("info", "POS terminal registered successfully");
      }
    });

    return () => {
      if (cancelConnEvent) cancelConnEvent();
    };
  }, [onLog]);

  const connect = useCallback(async () => {
    try {
      onLog("info", "Initiating WebSocket connection...");
      await Connect();
    } catch (err: any) {
      const errMsg = err?.message || err;
      onLog("error", `Connection failed: ${errMsg}`);
      toast.error(`Connection failed: ${errMsg}`);
    }
  }, [onLog]);

  const disconnect = useCallback(async () => {
    try {
      onLog("info", "Disconnecting WebSocket...");
      await Disconnect();
    } catch (err: any) {
      const errMsg = err?.message || err;
      onLog("error", `Disconnect failed: ${errMsg}`);
      toast.error(`Disconnect failed: ${errMsg}`);
    }
  }, [onLog]);

  const switchEnvironment = useCallback(
    async (envId: string) => {
      try {
        const matchedEnv = environments.find((e) => e.id === envId);
        if (!matchedEnv) return;

        if (connected) {
          await Disconnect();
          setConnected(false);
        }

        setActiveEnvId(envId);
        setActiveHostPort(parseHostPort(matchedEnv.url));
        toast.success(`Environment changed to ${matchedEnv.name}`);
      } catch (err: any) {
        toast.error("Failed to switch environment");
      }
    },
    [environments, connected],
  );

  return {
    connected,
    activeHostPort,
    environments,
    activeEnvId,
    connect,
    disconnect,
    switchEnvironment,
  };
}
