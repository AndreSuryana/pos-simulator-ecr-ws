import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  Connect,
  Disconnect,
  Connected,
  UpdateConfig,
} from "../../wailsjs/go/main/App";
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
  onConfigChange?: (cfg: config.Config) => void,
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

  const isManualDisconnect = useRef<boolean>(false);
  const isReconnecting = useRef<boolean>(false);

  // Check initial connection status & listen to status events
  useEffect(() => {
    Connected()
      .then((isConn) => setConnected(isConn))
      .catch(() => setConnected(false));

    const cancelConnEvent = EventsOn("connection:status", (status: string) => {
      if (status === "connected") {
        setConnected(true);
        if (isReconnecting.current) {
          isReconnecting.current = false;
          toast.success("Reconnected to server", { id: "reconnect-toast" });
        }
      } else if (status === "disconnected") {
        setConnected(false);
        if (!isManualDisconnect.current) {
          const autoReconn = appConfig.connection?.autoReconnect ?? true;
          if (!autoReconn) {
            toast.error("WebSocket disconnected");
          }
        }
        isManualDisconnect.current = false;
      }
    });

    const cancelReconnEvent = EventsOn(
      "connection:reconnecting",
      (data: { attempt: number; maxTries: number }) => {
        isReconnecting.current = true;
        const text =
          data.maxTries > 0
            ? `Disconnected (Reconnect attempt #${data.attempt}/${data.maxTries})...`
            : `Disconnected (Reconnect attempt #${data.attempt})...`;
        toast.loading(text, { id: "reconnect-toast" });
      },
    );

    const cancelReconnFailed = EventsOn("connection:reconnect_failed", () => {
      isReconnecting.current = false;
      toast.error("Reconnection failed. Maximum attempts reached.", {
        id: "reconnect-toast",
      });
    });

    return () => {
      if (cancelConnEvent) cancelConnEvent();
      if (cancelReconnEvent) cancelReconnEvent();
      if (cancelReconnFailed) cancelReconnFailed();
    };
  }, [appConfig.connection?.autoReconnect]);

  const toggleConnect = useCallback(async () => {
    try {
      if (connected) {
        isManualDisconnect.current = true;
        isReconnecting.current = false;
        toast.dismiss("reconnect-toast");
        await Disconnect();
        setConnected(false);
        toast.error("WebSocket disconnected");
      } else {
        toast.dismiss("reconnect-toast");
        isReconnecting.current = false;
        onLog("info", `Connecting to server (${activeHostPort})...`);
        await Connect();
        setConnected(true);
        toast.success("Connected to server");
      }
    } catch (err: any) {
      isManualDisconnect.current = false;
      isReconnecting.current = false;
      toast.dismiss("reconnect-toast");
      const errMsg = err?.message || err;
      onLog("error", `Connection failed: ${errMsg}`);
      toast.error(`Connection failed: ${errMsg}`);
      setConnected(false);
    }
  }, [connected, activeHostPort, onLog]);

  const switchEnvironment = useCallback(
    async (envId: string) => {
      const matchedEnv = environments.find((e) => e.id === envId);
      if (!matchedEnv) return;

      try {
        if (connected || isReconnecting.current) {
          isManualDisconnect.current = true;
          isReconnecting.current = false;
          toast.dismiss("reconnect-toast");
          await Disconnect();
          setConnected(false);
          onLog("warn", "Disconnected prior to environment switch.");
        }

        const updatedConfig = new config.Config({
          ...appConfig,
          activeEnvironmentId: matchedEnv.id,
        });

        await UpdateConfig(updatedConfig);
        if (onConfigChange) {
          onConfigChange(updatedConfig);
        }

        setActiveEnvId(envId);
        setActiveHostPort(parseHostPort(matchedEnv.url));
        toast.success(`Environment changed to ${matchedEnv.name}`);
      } catch (err: any) {
        toast.error("Failed to switch environment");
      }
    },
    [environments, connected, appConfig, onConfigChange, onLog],
  );

  return {
    connected,
    activeHostPort,
    environments,
    activeEnvId,
    toggleConnect,
    connect: toggleConnect,
    disconnect: toggleConnect,
    switchEnvironment,
  };
}
