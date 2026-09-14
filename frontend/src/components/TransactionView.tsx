import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Send, Sliders, FileText } from "lucide-react";
import { Modes } from "../../wailsjs/go/main/App";
import { ecr, edc, main } from "../../wailsjs/go/models";

interface TransactionViewProps {
  devices?: edc.Device[];
  connected: Boolean;
  onRefreshDevices?: () => void;
  onSendTransaction?: (req: main.SendTransactionRequest) => Promise<void>;
}

export function TransactionView({
  devices = [],
  connected = false,
  onRefreshDevices,
  onSendTransaction,
}: TransactionViewProps) {
  const [modes, setModes] = useState<ecr.Mode[]>([]);
  const [selectedMode, setSelectedMode] = useState<ecr.Mode | null>(null);
  const [selectedType, setSelectedType] = useState<ecr.TransactionType | null>(
    null,
  );
  const [selectedEdc, setSelectedEdc] = useState<string>("");

  const [values, setValues] = useState<Record<string, string>>({});
  const [autoGenId, setAutoGenId] = useState<boolean>(false);

  // Reset field values to defaults whenever the active type changes.
  useEffect(() => {
    const defaults: Record<string, string> = {};
    (selectedType?.Fields ?? []).forEach((f) => {
      defaults[f.Key] = f.Default ?? "";
    });
    setValues(defaults);
  }, [selectedType]);

  useEffect(() => {
    async function loadModes() {
      try {
        const fetchedModes = await Modes();
        if (fetchedModes && fetchedModes.length > 0) {
          setModes(fetchedModes);

          const savedModeId = localStorage.getItem("selected-ecr-mode");
          let targetMode = fetchedModes[0];

          if (savedModeId) {
            const matchedMode = fetchedModes.find((m) => m.ID === savedModeId);
            if (matchedMode) {
              targetMode = matchedMode;
            }
          }

          setSelectedMode(targetMode);

          if (
            targetMode.TransactionTypes &&
            targetMode.TransactionTypes.length > 0
          ) {
            setSelectedType(targetMode.TransactionTypes[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load ECR modes from Go:", err);
      }
    }
    loadModes();
  }, []);

  useEffect(() => {
    if (devices.length > 0 && !selectedEdc) {
      setSelectedEdc(devices[0].edc_id);
    }
  }, [devices, selectedEdc]);

  const handleModeChange = (modeId: string) => {
    localStorage.setItem("selected-ecr-mode", modeId);

    const matchedMode = modes.find((m) => m.ID === modeId) || null;
    setSelectedMode(matchedMode);

    if (
      matchedMode &&
      matchedMode.TransactionTypes &&
      matchedMode.TransactionTypes.length > 0
    ) {
      setSelectedType(matchedMode.TransactionTypes[0]);
    } else {
      setSelectedType(null);
    }
  };

  const buildDataField = (): Record<string, string> => {
    const data: Record<string, string> = {};
    (selectedType?.Fields ?? []).forEach((f) => {
      data[f.Key] = values[f.Key] ?? "";
    });
    return data;
  };

  const setValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleRefresh = () => {
    if (!connected) {
      toast.error("Cannot refresh: WebSocket is disconnected");
      return;
    }
    if (onRefreshDevices) onRefreshDevices();
  };

  const handleSend = async () => {
    if (!connected) {
      toast.error("Cannot send transaction: WebSocket is disconnected");
      return;
    }
    if (!selectedEdc) {
      toast.error("Please select an EDC device first", { icon: "⚠️" });
      return;
    }
    if (!selectedType) {
      toast.error("Please select a valid transaction type", { icon: "⚠️" });
      return;
    }

    const payload = new main.SendTransactionRequest({
      edcId: selectedEdc,
      transactionType: selectedType,
      dataField: buildDataField(),
      autoGenerateTrxId: autoGenId,
    });

    if (onSendTransaction) {
      await onSendTransaction(payload);
    } else {
      console.log("Sending Transaction Payload:", payload);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-3 p-4 overflow-hidden font-sans text-content-primary">
      {/* LEFT PANEL: Feature Selection */}
      <div className="w-full md:w-72 lg:w-80 shrink-0 h-full">
        <div className="bg-app-surface border border-app-border rounded-lg p-4 flex flex-col gap-3 shadow-sm h-full overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-app-border pb-2 shrink-0 min-h-8">
            <Sliders className="w-3.5 h-3.5 text-brand-primary" />
            <h2 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
              Feature Selection
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-content-muted font-medium">
                Mode
              </label>
              <select
                value={selectedMode?.ID || ""}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
              >
                {modes.map((m) => (
                  <option key={m.ID} value={m.ID}>
                    {m.Label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-content-muted font-medium">
                Type
              </label>
              <select
                value={selectedType?.ID || ""}
                onChange={(e) => {
                  const match = selectedMode?.TransactionTypes?.find(
                    (t) => t.ID === e.target.value,
                  );
                  if (match) setSelectedType(match);
                }}
                className="bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
              >
                {selectedMode?.TransactionTypes?.map((t) => (
                  <option key={t.ID} value={t.ID}>
                    {t.Label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-content-muted font-medium">
                EDC ID
              </label>
              <div className="flex gap-1.5">
                <select
                  value={selectedEdc}
                  onChange={(e) => setSelectedEdc(e.target.value)}
                  className="flex-1 bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
                >
                  {devices.length === 0 ? (
                    <option value="">No EDC Devices</option>
                  ) : (
                    devices.map((d) => (
                      <option key={d.edc_id} value={d.edc_id}>
                        {d.edc_id}
                      </option>
                    ))
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-app-overlay hover:bg-content-muted/20 text-content-primary/90 rounded-md transition cursor-pointer shrink-0"
                  title="Refresh Device List"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Transaction Data */}
      <div className="flex-1 bg-app-surface border border-app-border rounded-lg flex flex-col overflow-hidden shadow-sm h-full">
        <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-app-border pb-2 shrink-0 min-h-8">
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            <h2 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
              Transaction Data
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(selectedType?.Fields ?? []).map((field) => (
                <div key={field.Key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-content-muted font-medium">
                      {field.Label}
                    </label>
                    {field.Key === "transactionId" && (
                      <label className="flex items-center gap-1.5 text-xs text-content-primary/90 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoGenId}
                          onChange={(e) => setAutoGenId(e.target.checked)}
                          className="accent-brand-primary cursor-pointer"
                        />
                        <span>Auto-generate</span>
                      </label>
                    )}
                  </div>

                  {field.Type === "select" ? (
                    <select
                      value={values[field.Key] ?? ""}
                      onChange={(e) => setValue(field.Key, e.target.value)}
                      className="bg-app-base border border-app-border text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand-primary cursor-pointer transition-colors"
                    >
                      {field.Options?.map((opt) => (
                        <option key={opt.Value} value={opt.Value}>
                          {opt.Label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.Type === "number" ? "number" : "text"}
                      disabled={field.Key === "transactionId" && autoGenId}
                      value={
                        field.Key === "transactionId" && autoGenId
                          ? "(Auto-generated)"
                          : (values[field.Key] ?? "")
                      }
                      onChange={(e) => setValue(field.Key, e.target.value)}
                      placeholder={field.Placeholder}
                      className="bg-app-base border border-app-border disabled:opacity-30 disabled:bg-app-surface/50 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-brand-primary transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button Docked at Bottom of Right Panel */}
        <div className="p-4 border-t border-app-border bg-app-surface shrink-0">
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedEdc || !selectedType}
            className="w-full flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-hover disabled:bg-app-overlay disabled:text-content-muted/80 text-app-base font-medium py-1.5 rounded-md text-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
