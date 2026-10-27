export type AccountActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export function formText(formData: FormData, key: string, max = 200) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase().slice(0, 254);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
