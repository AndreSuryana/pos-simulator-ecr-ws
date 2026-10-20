import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Search, X } from "lucide-react";

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

const STORAGE_KEY = "pos-simulator-log-panel-height";
const DEFAULT_HEIGHT = 192; // 12rem / matches previous h-48
const MIN_HEIGHT = 80;

const LOG_TYPE_STYLES: Record<LogType, { icon: string; colorClass: string }> = {
  sent: { icon: "↗️", colorClass: "text-sky-400" },
  received: { icon: "↙️", colorClass: "text-status-success" },
  info: { icon: "ℹ️", colorClass: "text-content-primary/90" },
  warn: { icon: "⚠️", colorClass: "text-amber-400" },
  error: { icon: "❌", colorClass: "text-status-danger" },
};

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  const getMaxHeight = useCallback(() => {
    // Guarantees at least 300px visible workspace for main view
    const headroomLimit = Math.max(MIN_HEIGHT, window.innerHeight - 300);
    const percentageLimit = Math.floor(window.innerHeight * 0.6);
    return Math.min(headroomLimit, percentageLimit);
  }, []);

  const clampHeight = useCallback(
    (h: number) => {
      const maxH = getMaxHeight();
      return Math.max(MIN_HEIGHT, Math.min(maxH, h));
    },
    [getMaxHeight],
  );

  const [height, setHeight] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.max(MIN_HEIGHT, parsed);
      }
    }
    return DEFAULT_HEIGHT;
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const heightRef = useRef<number>(height);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    return log.message.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  // Adjust height if window shrinks
  useEffect(() => {
    const handleResize = () => {
      setHeight((prev) => clampHeight(prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampHeight]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartHeight.current = height;
    setIsDragging(true);
  };

  const handleDoubleClick = () => {
    const resetHeight = DEFAULT_HEIGHT;
    setHeight(resetHeight);
    localStorage.setItem(STORAGE_KEY, resetHeight.toString());
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY;
      const newHeight = clampHeight(dragStartHeight.current + deltaY);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, heightRef.current.toString());
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, clampHeight]);

  return (
    <div
      style={{ height: `${height}px` }}
      className={`relative flex flex-col bg-app-base border-t border-app-border text-xs font-mono shrink-0 ${
        isDragging ? "select-none" : ""
      }`}
    >
      {/* Top Resize Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`group absolute -top-1 left-0 right-0 h-2.5 cursor-row-resize z-20 flex items-center justify-center transition-colors ${
          isDragging ? "bg-brand-primary/20" : "hover:bg-brand-primary/10"
        }`}
        title="Drag to resize, double-click to reset"
      >
        <div
          className={`h-0.5 w-10 rounded-full transition-colors ${
            isDragging
              ? "bg-brand-primary"
              : "bg-app-border group-hover:bg-brand-primary"
          }`}
        />
      </div>

      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-app-surface/90 border-b border-app-border text-content-muted font-sans select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-content-primary">
            Terminal Logs
          </span>
          <span className="bg-app-overlay text-content-muted px-2 py-0.5 rounded-full text-[10px] font-mono">
            {filteredLogs.length}{searchTerm ? ` / ${logs.length}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-app-base border border-app-border rounded px-2 py-1 text-xs focus-within:border-brand-primary transition-colors">
            <Search className="w-3.5 h-3.5 text-content-muted shrink-0" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-content-primary placeholder:text-content-muted w-28 focus:w-44 transition-all font-mono text-[11px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-content-muted hover:text-content-primary cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
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
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-content-muted/50 italic select-none">
            {logs.length === 0 ? "No logs recorded yet." : "No logs matching search query."}
          </div>
        ) : (
          filteredLogs.map((log) => {
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
