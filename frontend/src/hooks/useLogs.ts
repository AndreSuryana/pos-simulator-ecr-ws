import { useState, useCallback, useEffect } from "react";
import { LogEntry, LogType } from "../components/LogConsole";
import { EventsOn } from "../../wailsjs/runtime/runtime";

export function useLogs() {
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

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    const cancelLogEvent = EventsOn("log", (entry: any) => {
      let mappedType: LogType = "info";
      const lvl = (entry.level || "").toLowerCase();
      if (lvl === "error") mappedType = "error";
      else if (lvl === "warn" || lvl === "warning") mappedType = "warn";
      else if (lvl === "sent") mappedType = "sent";
      else if (lvl === "received") mappedType = "received";

      addLog(mappedType, entry.message || JSON.stringify(entry));
    });

    return () => {
      if (cancelLogEvent) cancelLogEvent();
    };
  }, [addLog]);

  return { logs, addLog, clearLogs };
}
