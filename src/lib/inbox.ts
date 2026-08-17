export type ApplicationStatus = "New" | "Reviewed" | "Shortlisted" | "Rejected";

export type CareerApplication = {
  id: string;
  jobId?: string;
  role: string;
  status: ApplicationStatus;
  name: string;
  email: string;
  phone: string;
  city: string;
  nid?: string;
  tradeLicense?: string;
  experience?: string;
  areas?: string;
  message?: string;
  files?: string[];
  submittedAt: string;
};

export type MessageStatus = "New" | "Read" | "Resolved";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  submittedAt: string;
};

const APPLICATIONS_KEY = "career-applications";
const MESSAGES_KEY = "contact-messages";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export const readApplications = () => read<CareerApplication>(APPLICATIONS_KEY);
export const writeApplications = (items: CareerApplication[]) =>
  write(APPLICATIONS_KEY, items);

export const readMessages = () => read<ContactMessage>(MESSAGES_KEY);
export const writeMessages = (items: ContactMessage[]) => write(MESSAGES_KEY, items);

export function addMessage(input: Omit<ContactMessage, "id" | "status" | "submittedAt">) {
  const item: ContactMessage = {
    ...input,
    id: `MSG-${Date.now().toString(36).toUpperCase()}`,
    status: "New",
    submittedAt: new Date().toISOString(),
  };
  writeMessages([...readMessages(), item]);
  return item;
}
