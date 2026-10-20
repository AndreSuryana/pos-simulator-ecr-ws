import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  CheckForUpdate,
  DownloadAndInstall,
  CancelUpdate,
  DismissUpdate,
} from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { config, updater } from "../../wailsjs/go/models";
import { UpdateProgress, UpdateStage } from "../components/UpdateDialog";

export function useUpdater(
  appConfig: config.Config,
  connected: boolean,
  onConfigChange?: (updater: (prev: config.Config) => config.Config) => void,
) {
  const [updateInfo, setUpdateInfo] = useState<updater.Info | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [stage, setStage] = useState<UpdateStage>("idle");
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Check for updates on startup
  useEffect(() => {
    const shouldCheckOnStartup = appConfig.update?.checkOnStartup ?? true;
    if (shouldCheckOnStartup) {
      CheckForUpdate()
        .then((uInfo) => {
          if (uInfo && uInfo.available) {
            setUpdateInfo(uInfo);
            const dismissed = appConfig.update?.dismissedVersion || "";
            if (uInfo.latestVersion !== dismissed) {
              setIsDialogOpen(true);
            }
          }
        })
        .catch((err) => {
          console.debug("Startup update check failed:", err);
        });
    }
  }, [appConfig.update?.checkOnStartup, appConfig.update?.dismissedVersion]);

  // Listen to download progress
  useEffect(() => {
    const cancelProgress = EventsOn("update:progress", (p: UpdateProgress) => {
      setProgress(p);
      if (p.stage) {
        setStage(p.stage as UpdateStage);
      }
    });

    return () => {
      if (cancelProgress) cancelProgress();
    };
  }, []);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const manualCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const info = await CheckForUpdate();
      if (info && info.available) {
        setUpdateInfo(info);
        setIsDialogOpen(true);
      } else {
        toast.success("You are running the latest version.");
      }
    } catch (err: any) {
      toast.error(`Failed to check for updates: ${err?.message || err}`);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const startDownload = useCallback(async () => {
    if (connected) {
      toast.error("Please disconnect the WebSocket before updating.");
      return;
    }

    setStage("downloading");
    setErrorMessage(null);
    try {
      await DownloadAndInstall();
    } catch (err: any) {
      const msg = err?.message || String(err);
      setStage("error");
      setErrorMessage(msg);
      toast.error(`Update failed: ${msg}`);
    }
  }, [connected]);

  const cancelUpdate = useCallback(async () => {
    try {
      await CancelUpdate();
      setStage("idle");
      setProgress(null);
      toast("Update cancelled.");
    } catch (err: any) {
      console.error("Cancel update error:", err);
    }
  }, []);

  const dismissUpdate = useCallback(async () => {
    setIsDialogOpen(false);
    if (updateInfo?.latestVersion) {
      try {
        await DismissUpdate(updateInfo.latestVersion);
        if (onConfigChange) {
          onConfigChange(
            (prev) =>
              new config.Config({
                ...prev,
                update: new config.Update({
                  checkOnStartup: prev.update?.checkOnStartup ?? true,
                  dismissedVersion: updateInfo.latestVersion,
                }),
              }),
          );
        }
      } catch (err) {
        console.error("Failed to persist update dismissal:", err);
      }
    }
  }, [updateInfo, onConfigChange]);

  return {
    updateInfo,
    isDialogOpen,
    stage,
    progress,
    errorMessage,
    isChecking,
    openDialog,
    closeDialog,
    manualCheck,
    startDownload,
    cancelUpdate,
    dismissUpdate,
  };
}
