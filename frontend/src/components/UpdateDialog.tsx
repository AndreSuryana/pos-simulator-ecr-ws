import React from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Download,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { updater } from "../../wailsjs/go/models";

export type UpdateStage =
  | "idle"
  | "downloading"
  | "verifying"
  | "extracting"
  | "installing"
  | "restarting"
  | "error";

export interface UpdateProgress {
  stage: string;
  bytesDone: number;
  totalBytes: number;
  percent: number;
}

interface UpdateDialogProps {
  info: updater.Info;
  stage: UpdateStage;
  progress: UpdateProgress | null;
  errorMessage: string | null;
  connected: boolean;
  onDownload: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function UpdateDialog({
  info,
  stage,
  progress,
  errorMessage,
  connected,
  onDownload,
  onCancel,
  onClose,
}: UpdateDialogProps) {
  const isUpdating =
    stage === "downloading" ||
    stage === "verifying" ||
    stage === "extracting" ||
    stage === "installing" ||
    stage === "restarting";

  const isLocked =
    stage === "verifying" ||
    stage === "extracting" ||
    stage === "installing" ||
    stage === "restarting";

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-content-primary font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-app-border shrink-0 bg-app-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-content-primary">
                Software Update Available
              </h1>
              <p className="text-xs text-content-muted">
                A new version of POS Simulator is available to install.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLocked}
            onClick={isUpdating ? onCancel : onClose}
            className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-app-overlay transition disabled:opacity-30 cursor-pointer"
            title={isUpdating ? "Cancel update" : "Close and dismiss for now"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-app-base">
          {/* Version and Metadata Banner */}
          <div className="bg-app-surface border border-app-border rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 bg-app-overlay text-content-muted rounded-md font-medium">
                v{info.currentVersion}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
              <span className="font-mono text-xs px-2.5 py-1 bg-brand-primary/15 text-brand-primary border border-brand-primary/30 rounded-md font-semibold">
                v{info.latestVersion}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-content-muted">
              <span>{formatDate(info.publishedAt)}</span>
              <span>•</span>
              <span>{formatSize(info.size)}</span>
            </div>
          </div>

          {/* Connected Warning Notice */}
          {connected && stage === "idle" && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                WebSocket is currently connected. Please disconnect before
                updating.
              </span>
            </div>
          )}

          {/* Active Update / Progress Stage */}
          {isUpdating && (
            <div className="bg-app-surface border border-app-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium capitalize text-content-primary flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  {stage === "downloading"
                    ? `Downloading update (${(progress?.percent || 0).toFixed(0)}%)...`
                    : stage === "verifying"
                      ? "Verifying checksum (SHA-256)..."
                      : stage === "extracting"
                        ? "Extracting application..."
                        : stage === "installing"
                          ? "Installing update..."
                          : "Restarting application..."}
                </span>
                {stage === "downloading" && progress && (
                  <span className="text-content-muted font-mono">
                    {formatSize(progress.bytesDone)} /{" "}
                    {formatSize(progress.totalBytes)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-app-overlay rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress?.percent || (isLocked ? 100 : 0)))}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {stage === "error" && errorMessage && (
            <div className="bg-status-danger/10 border border-status-danger/30 text-status-danger rounded-lg p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Update Failed</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed break-all">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Changelog Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
              Release Notes & Changelog
            </span>

            <div className="bg-app-surface border border-app-border rounded-lg p-4 max-h-56 overflow-y-auto text-xs leading-relaxed text-content-primary select-text prose prose-invert prose-xs max-w-none">
              {info.changelog ? (
                <Markdown>{info.changelog}</Markdown>
              ) : (
                <span className="text-content-muted italic">
                  No release notes provided for this version.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-app-border bg-app-surface shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-content-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
            <span>Verified (SHA-256)</span>
          </div>

          <div className="flex items-center gap-2">
            {stage === "downloading" ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 bg-app-overlay hover:bg-content-muted/20 text-content-primary text-xs font-medium rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
            ) : isLocked ? (
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                <span>Applying update...</span>
              </div>
            ) : stage === "error" ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-app-overlay hover:bg-content-muted/20 text-content-primary text-xs font-medium rounded-md transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-app-base text-xs font-medium px-4 py-1.5 rounded-md transition cursor-pointer"
                >
                  <span>Retry</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onDownload}
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-app-base text-xs font-medium px-4 py-1.5 rounded-md transition cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download & Install</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
