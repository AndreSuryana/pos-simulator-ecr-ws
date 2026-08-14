import React, { useState, useEffect } from "react";
import { Save, Shield, Key, Sliders, FolderOpen, X } from "lucide-react";
import { config } from "../../wailsjs/go/models";
import { OpenFileBrowser } from "../../wailsjs/go/main/App";

interface SettingViewProps {
  currentConfig?: config.Config;
  onSaveConfig?: (cfg: config.Config) => Promise<void>;
  onClose?: () => void;
}

export function SettingView({
  currentConfig,
  onSaveConfig,
  onClose,
}: SettingViewProps) {
  const [posId, setPosId] = useState<string>("");
  const [mid, setMid] = useState<string>("");
  const [trxIdLen, setTrxIdLen] = useState<number>(14);

  const [apiKey, setApiKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");

  const [tlsMode, setTlsMode] = useState<"none" | "one-way" | "mutual">("none");
  const [caCertPath, setCaCertPath] = useState<string>("");
  const [clientCertPath, setClientCertPath] = useState<string>("");
  const [clientKeyPath, setClientKeyPath] = useState<string>("");
  const [skipTlsVerify, setSkipTlsVerify] = useState<boolean>(false);

  useEffect(() => {
    if (currentConfig) {
      setPosId(currentConfig.general?.posId || "");
      setMid(currentConfig.general?.mid || "");
      setTrxIdLen(currentConfig.general?.trxIdLen || 14);

      setApiKey(currentConfig.auth?.apiKey || "");
      setPrivateKey(currentConfig.auth?.privateKey || "");

      const tls = currentConfig.tls;
      if (tls) {
        setCaCertPath(tls.serverCACertPath || "");
        setClientCertPath(tls.clientCertPath || "");
        setClientKeyPath(tls.clientKeyPath || "");
        setSkipTlsVerify(tls.skipVerify || false);

        if (tls.clientCertPath && tls.clientKeyPath) {
          setTlsMode("mutual");
        } else if (tls.serverCACertPath || tls.enabled) {
          setTlsMode("one-way");
        } else {
          setTlsMode("none");
        }
      }
    }
  }, [currentConfig]);

  const handleBrowseFile = async (
    title: string,
    setter: (path: string) => void,
    filterPattern: string,
  ) => {
    try {
      const selectedFilePath = await OpenFileBrowser(
        title,
        "Certificate & Key Files",
        filterPattern,
      );
      if (selectedFilePath) {
        setter(selectedFilePath);
      }
    } catch (err) {
      console.error("File selection failed:", err);
    }
  };

  const handleTlsModeChange = (selected: "none" | "one-way" | "mutual") => {
    setTlsMode(selected);
    if (selected === "none") {
      setCaCertPath("");
      setClientCertPath("");
      setClientKeyPath("");
    } else if (selected === "one-way") {
      setClientCertPath("");
      setClientKeyPath("");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updatedConfig = new config.Config({
      ...currentConfig,
      general: new config.General({
        posId,
        mid,
        trxIdLen: Number(trxIdLen),
      }),
      auth: new config.Auth({
        apiKey,
        privateKey,
      }),
      tls: new config.TLS({
        enabled: tlsMode !== "none",
        serverCACertPath: caCertPath,
        clientCertPath: clientCertPath,
        clientKeyPath: clientKeyPath,
        skipVerify: skipTlsVerify,
      }),
    });

    if (onSaveConfig) {
      await onSaveConfig(updatedConfig);
    }
  };

  return (
    <div className="h-full w-full flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-900">
        <div>
          <h1 className="text-base font-semibold text-slate-100">
            System Configuration
          </h1>
          <p className="text-xs text-slate-400">
            Manage POS information, API credentials, and TLS certificates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        <form
          id="settings-form"
          onSubmit={handleSave}
          className="max-w-4xl mx-auto flex flex-col gap-5 pb-4"
        >
          {/* 1. General Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>General Settings</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  POS ID
                </label>
                <input
                  type="text"
                  value={posId}
                  onChange={(e) => setPosId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  MID (Merchant ID)
                </label>
                <input
                  type="text"
                  value={mid}
                  onChange={(e) => setMid(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Transaction ID Length
                </label>
                <input
                  type="number"
                  value={trxIdLen}
                  onChange={(e) => setTrxIdLen(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Authentication Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span>Authentication</span>
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Private Key (PEM format)
                </label>
                <textarea
                  rows={4}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-md p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. TLS Security Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>TLS Configuration</span>
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">
                TLS Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "none", label: "None (Plain WS)" },
                  { id: "one-way", label: "One-way TLS" },
                  { id: "mutual", label: "Mutual TLS (mTLS)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTlsModeChange(item.id as any)}
                    className={`py-2 px-3 text-xs rounded-md border font-medium transition cursor-pointer ${tlsMode === item.id ? "bg-indigo-600/20 border-indigo-500 text-indigo-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Server CA Cert Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={tlsMode === "none"}
                    value={caCertPath}
                    onChange={(e) => setCaCertPath(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 disabled:opacity-30 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={tlsMode === "none"}
                    onClick={() =>
                      handleBrowseFile(
                        "Select Server CA Certificate",
                        setCaCertPath,
                        "*.crt;*.pem",
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Client Cert Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={tlsMode !== "mutual"}
                    value={clientCertPath}
                    onChange={(e) => setClientCertPath(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 disabled:opacity-30 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={tlsMode !== "mutual"}
                    onClick={() =>
                      handleBrowseFile(
                        "Select Client Certificate",
                        setClientCertPath,
                        "*.crt;*.pem",
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">
                  Client Key Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={tlsMode !== "mutual"}
                    value={clientKeyPath}
                    onChange={(e) => setClientKeyPath(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 disabled:opacity-30 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={tlsMode !== "mutual"}
                    onClick={() =>
                      handleBrowseFile(
                        "Select Client Private Key",
                        setClientKeyPath,
                        "*.key;*.pem",
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={tlsMode === "none"}
                    checked={skipTlsVerify}
                    onChange={(e) => setSkipTlsVerify(e.target.checked)}
                    className="accent-indigo-500 disabled:opacity-30"
                  />
                  <span>Skip TLS Verification (Insecure / Testing)</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 shrink-0 flex justify-end">
        <button
          type="submit"
          form="settings-form"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-6 py-2 rounded-md transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
