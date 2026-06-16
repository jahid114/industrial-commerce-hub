import type { Agent } from "./types";

export const agents: Agent[] = [
  { id: "ag-001", name: "Md. Rafiqul Islam", area: "Chittagong - EPZ Zone", phone: "+8801711-234567", email: "rafiq@megahaus.com", joined: "2024-03-15", ordersSubmitted: 47, commissionEarned: 285000, status: "Active" },
  { id: "ag-002", name: "Sumaiya Khatun", area: "Dhaka - Tongi Industrial Area", phone: "+8801812-345678", email: "sumaiya@megahaus.com", joined: "2024-06-02", ordersSubmitted: 33, commissionEarned: 198500, status: "Active" },
  { id: "ag-003", name: "Abdul Karim", area: "Narayanganj - BSCIC", phone: "+8801913-456789", email: "karim@megahaus.com", joined: "2024-08-21", ordersSubmitted: 21, commissionEarned: 124000, status: "Active" },
  { id: "ag-004", name: "Nasir Ahmed", area: "Gazipur - Konabari", phone: "+8801714-567890", email: "nasir@megahaus.com", joined: "2025-01-09", ordersSubmitted: 15, commissionEarned: 87500, status: "Active" },
  { id: "ag-005", name: "Fatima Begum", area: "Sylhet Industrial Zone", phone: "+8801815-678901", email: "fatima@megahaus.com", joined: "2025-04-12", ordersSubmitted: 8, commissionEarned: 42000, status: "Active" },
  { id: "ag-006", name: "Jahangir Alam", area: "Khulna - Mongla", phone: "+8801916-789012", email: "jahangir@megahaus.com", joined: "2026-02-28", ordersSubmitted: 2, commissionEarned: 9500, status: "Pending" },
];

export const getAgent = (id: string) => agents.find((a) => a.id === id);
