import { useEffect, useMemo, useState } from "react";
import { listTransactions, type Transaction, type TxStatus } from "@/services/api";

export type TxFilter = "all" | TxStatus;

export function useTransactions() {
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [filter, setFilter] = useState<TxFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTransactions({ limit: 50 })
      .then(({ transactions }) => setTxs(transactions))
      .catch(() => { setError("Could not load transactions."); setTxs([]); });
  }, []);

  const filtered = useMemo(() => {
    if (!txs) return [];
    return txs.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.reference.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.asset.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [txs, filter, query]);

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return {
    txs,
    filtered,
    filter, setFilter,
    query, setQuery,
    openId,
    toggleOpen,
    error,
  };
}
