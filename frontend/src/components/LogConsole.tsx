import { useEffect, useRef } from "react";
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
  received: { icon: "↙️", colorClass: "text-status-success" },
  info: { icon: "ℹ️", colorClass: "text-content-primary/90" },
  warn: { icon: "⚠️", colorClass: "text-amber-400" },
  error: { icon: "❌", colorClass: "text-status-danger" },
};

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-48 bg-app-base border-t border-app-border text-xs font-mono shrink-0">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-app-surface/90 border-b border-app-border text-content-muted font-sans select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-content-primary">
            Terminal Logs
          </span>
          <span className="bg-app-overlay text-content-muted px-2 py-0.5 rounded-full text-[10px] font-mono">
            {logs.length}
          </span>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 hover:text-content-primary text-content-muted text-xs px-2 py-1 rounded bg-app-overlay/80 hover:bg-content-muted/20 transition cursor-pointer"
          title="Clear Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono select-text"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-content-muted/50 italic select-none">
            No logs recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.info;
            return (
              <div key={log.id} className="leading-relaxed py-0.5">
                <span className="text-content-muted/80">
                  [{log.timestamp}]{" "}
                </span>
                {/* select-none removes the icon from the clipboard result */}
                <span className="select-none mr-2">{style.icon}</span>
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
