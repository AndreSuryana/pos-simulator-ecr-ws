import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { SendTransaction } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import { main } from "../../wailsjs/go/models";
import { LogType } from "../components/LogConsole";

export function useTransactions(
  connected: boolean,
  onLog: (type: LogType, message: string) => void,
) {
  useEffect(() => {
    const cancelTxEvent = EventsOn("transaction:response", (resp: any) => {
      const code = resp?.data_transaction?.responseCode?.trim() || "unknown";
      const rawMsg = resp?.data_transaction?.responseMessage?.trim();

      if (code === "00") {
        toast.success("Transaction Approved");
      } else {
        let formattedMsg = "Transaction Failed";
        if (rawMsg) {
          const cleaned = rawMsg.replace(/_/g, " ").trim();
          formattedMsg = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
        }
        toast.error(`${formattedMsg} (${code})`);
      }
    });

    return () => {
      if (cancelTxEvent) cancelTxEvent();
    };
  }, []);

  const sendTransaction = useCallback(
    async (req: main.SendTransactionRequest) => {
      try {
        const txName = req.transactionType?.Label || req.transactionType?.ID || "Transaction";
        await SendTransaction(req);
        onLog("sent", `Sent ${txName} to ${req.edcId}`);
        toast.success(`Transaction ${txName} sent`);
      } catch (err: any) {
        const errMsg = err?.message || err;
        onLog("error", `Transaction failed: ${errMsg}`);
        toast.error(`Transaction failed: ${errMsg}`);
      }
    },
    [onLog],
  );

  return {
    sendTransaction,
  };
}
