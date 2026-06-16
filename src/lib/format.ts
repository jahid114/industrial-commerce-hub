export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function newOrderId(): string {
  const n = 1043 + Math.floor(Math.random() * 900);
  return `MH-2026-${n}`;
}

export function newRfqId(): string {
  const n = 189 + Math.floor(Math.random() * 800);
  return `RFQ-2026-${String(n).padStart(4, "0")}`;
}
