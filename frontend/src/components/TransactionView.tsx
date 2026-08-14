import { useState, useEffect } from "react";
import { RefreshCw, Send, Sliders, FileText } from "lucide-react";
import { Modes } from "../../wailsjs/go/main/App";
import { ecr, edc, main } from "../../wailsjs/go/models";

const TENOR_OPTIONS = [
  { label: "3 Months", value: "3" },
  { label: "6 Months", value: "6" },
  { label: "9 Months", value: "9" },
  { label: "12 Months", value: "12" },
  { label: "18 Months", value: "18" },
  { label: "24 Months", value: "24" },
];

const PLAN_OPTIONS = [
  { label: "None", value: "None" },
  { label: "Plan 1", value: "1" },
  { label: "Plan 2", value: "2" },
  { label: "Plan 3", value: "3" },
];

interface TransactionViewProps {
  devices?: edc.Device[];
  onRefreshDevices?: () => void;
  onSendTransaction?: (req: main.SendTransactionRequest) => Promise<void>;
}

export function TransactionView({
  devices = [],
  onRefreshDevices,
  onSendTransaction,
}: TransactionViewProps) {
  const [modes, setModes] = useState<ecr.Mode[]>([]);
  const [selectedMode, setSelectedMode] = useState<ecr.Mode | null>(null);
  const [selectedType, setSelectedType] = useState<ecr.TransactionType | null>(
    null,
  );
  const [selectedEdc, setSelectedEdc] = useState<string>("");

  const [amount, setAmount] = useState<string>("0");
  const [tipAmount, setTipAmount] = useState<string>("0");
  const [tenor, setTenor] = useState<string>("3");
  const [plan, setPlan] = useState<string>("None");
  const [traceNumber, setTraceNumber] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [autoGenId, setAutoGenId] = useState<boolean>(true);

  useEffect(() => {
    async function loadModes() {
      try {
        const fetchedModes = await Modes();
        if (fetchedModes && fetchedModes.length > 0) {
          setModes(fetchedModes);
          setSelectedMode(fetchedModes[0]);
          if (
            fetchedModes[0].TransactionTypes &&
            fetchedModes[0].TransactionTypes.length > 0
          ) {
            setSelectedType(fetchedModes[0].TransactionTypes[0]);
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

  const isFieldActive = (fieldKey: string): boolean => {
    return selectedType?.Fields?.includes(fieldKey as any) ?? false;
  };

  const buildDataField = (): ecr.DataField => {
    const data = new ecr.DataField();
    if (isFieldActive("amount")) data.amount = amount;
    if (isFieldActive("tipAmount")) data.tipAmount = tipAmount;
    if (isFieldActive("tenor")) data.tenor = tenor;
    if (isFieldActive("plan")) data.plan = plan === "None" ? "" : plan;
    if (isFieldActive("traceNumber")) data.traceNumber = traceNumber;
    if (isFieldActive("invoiceNumber")) data.invoiceNumber = invoiceNumber;
    if (isFieldActive("transactionId") && !autoGenId)
      data.transactionId = transactionId;
    return data;
  };

  const handleSend = async () => {
    if (!selectedEdc) {
      alert("Please select an EDC device first.");
      return;
    }
    if (!selectedType) {
      alert("Please select a valid transaction type.");
      return;
    }

    const payload = new main.SendTransactionRequest({
      edcId: selectedEdc,
      transactionType: selectedType,
      dataField: buildDataField(),
    });

    if (onSendTransaction) {
      await onSendTransaction(payload);
    } else {
      console.log("Sending Transaction Payload:", payload);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 p-5 overflow-hidden font-sans text-slate-100">
      {/* LEFT PANEL: Transaction Form (Expanding Flex Panel) */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-5 overflow-y-auto shrink-0 h-full shadow-sm flex flex-col gap-5">
        {/* Feature Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0 min-h-10">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Feature Selection
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Mode</label>
              <select
                value={selectedMode?.ID || ""}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {modes.map((m) => (
                  <option key={m.ID} value={m.ID}>
                    {m.Label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Type</label>
              <select
                value={selectedType?.ID || ""}
                onChange={(e) => {
                  const match = selectedMode?.TransactionTypes?.find(
                    (t) => t.ID === e.target.value,
                  );
                  if (match) setSelectedType(match);
                }}
                className="bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {selectedMode?.TransactionTypes?.map((t) => (
                  <option key={t.ID} value={t.ID}>
                    {t.Label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* EDC ID Row + Refresh */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs text-slate-400 font-medium">EDC ID</label>
            <div className="flex gap-2">
              <select
                value={selectedEdc}
                onChange={(e) => setSelectedEdc(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {devices.length === 0 ? (
                  <option value="">No EDC Devices Paired</option>
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
                onClick={onRefreshDevices}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium transition cursor-pointer shrink-0"
                title="Refresh Device List"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Data Fields */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0 min-h-10">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Transaction Data
            </h2>
          </div>

          {/* Amount & Tip Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Amount
              </label>
              <input
                type="number"
                disabled={!isFieldActive("amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Tip Amount
              </label>
              <input
                type="number"
                disabled={!isFieldActive("tipAmount")}
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          {/* Installment Tenor & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Tenor
              </label>
              <select
                disabled={!isFieldActive("tenor")}
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {TENOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Plan</label>
              <select
                disabled={!isFieldActive("plan")}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trace Number & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Trace Number
              </label>
              <input
                type="text"
                disabled={!isFieldActive("traceNumber")}
                value={traceNumber}
                onChange={(e) => setTraceNumber(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. 000001"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Invoice Number
              </label>
              <input
                type="text"
                disabled={!isFieldActive("invoiceNumber")}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. INV-10293"
              />
            </div>
          </div>

          {/* Transaction ID + Auto-generate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">
                Transaction ID
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isFieldActive("transactionId")}
                  checked={autoGenId}
                  onChange={(e) => setAutoGenId(e.target.checked)}
                  className="accent-indigo-500 disabled:opacity-30 cursor-pointer"
                />
                <span>Auto-generate</span>
              </label>
            </div>

            <input
              type="text"
              disabled={!isFieldActive("transactionId") || autoGenId}
              value={autoGenId ? "(Auto-generated)" : transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:bg-slate-900/50 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
              placeholder="Enter Transaction ID"
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Payload Inspector & Action Button (Fixed Narrow Panel like Pairing View Left Pane) */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 shrink-0 min-h-10">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Transaction Data Preview
          </h2>
        </div>

        <div className="flex-1 p-5 overflow-y-auto bg-slate-950/50">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
            {JSON.stringify(
              {
                transactionType: selectedType?.ID || "N/A",
                dataField: buildDataField(),
              },
              null,
              2,
            )}
          </pre>
        </div>

        {/* Action Button Docked at Bottom of Right Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedEdc || !selectedType}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-2.5 rounded-md text-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
