import React, { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

export type LogType = "sent" | "received" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

const LOG_TYPE_STYLES: Record<LogType, { icon: string; colorClass: string }> = {
  sent: { icon: "↗️", colorClass: "text-sky-400" },
  received: { icon: "↙️", colorClass: "text-emerald-400" },
  info: { icon: "ℹ️", colorClass: "text-slate-300" },
  warn: { icon: "⚠️", colorClass: "text-amber-400" },
  error: { icon: "❌", colorClass: "text-rose-400" },
};

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-48 bg-slate-950 border-t border-slate-800 text-xs font-mono shrink-0">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-slate-400 font-sans">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">Terminal Logs</span>
          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {logs.length}
          </span>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 hover:text-slate-100 text-slate-400 text-xs px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
          title="Clear Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            No logs recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.info;
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 leading-relaxed"
              >
                <span className="text-slate-500 shrink-0">
                  [{log.timestamp}]
                </span>
                <span className="shrink-0 select-none">{style.icon}</span>
                <span className={`${style.colorClass} break-all`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
