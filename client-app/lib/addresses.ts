import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type Address = {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export type AddressInput = Omit<Address, "id">;

export type AddressErrors = Partial<
  Record<"recipient" | "line1" | "city" | "postalCode" | "country" | "phone", string>
>;

export const emptyAddress = (): AddressInput => ({
  label: "Home",
  recipient: "",
  line1: "",
  line2: null,
  city: "",
  state: null,
  postalCode: "",
  country: "US",
  phone: null,
  isDefault: false,
});

export const toAddressInput = (address: Address): AddressInput => ({
  label: address.label,
  recipient: address.recipient,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
  phone: address.phone,
  isDefault: address.isDefault,
});

const mapAddress = (row: any): Address => ({
  id: row.id,
  label: row.label ?? "Home",
  recipient: row.recipient ?? "",
  line1: row.line1 ?? "",
  line2: row.line2 ?? null,
  city: row.city ?? "",
  state: row.state ?? null,
  postalCode: row.postal_code ?? "",
  country: row.country ?? "US",
  phone: row.phone ?? null,
  isDefault: Boolean(row.is_default),
});

const toPayload = (input: AddressInput) => ({
  label: input.label.trim() || "Home",
  recipient: input.recipient.trim(),
  line1: input.line1.trim(),
  line2: input.line2?.trim() || null,
  city: input.city.trim(),
  state: input.state?.trim() || null,
  postal_code: input.postalCode.trim(),
  country: input.country.trim() || "US",
  phone: input.phone?.trim() || null,
  is_default: input.isDefault,
});

export function validateAddress(input: AddressInput): AddressErrors {
  const errors: AddressErrors = {};
  if (!input.recipient.trim()) errors.recipient = "Enter a recipient name.";
  if (!input.line1.trim()) errors.line1 = "Enter a street address.";
  if (!input.city.trim()) errors.city = "Enter a city.";
  if (!input.postalCode.trim()) errors.postalCode = "Enter a postal code.";
  if (!input.country.trim()) errors.country = "Enter a country.";
  if (input.phone && input.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number.";
  }
  return errors;
}

export const addressLines = (address: Address): string[] =>
  [
    address.line1,
    address.line2,
    `${address.city}${address.state ? `, ${address.state}` : ""} ${address.postalCode}`.trim(),
    address.country,
  ].filter((line): line is string => Boolean(line && line.trim()));

export const addressSummary = (address: Address): string =>
  addressLines(address).join(", ");

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error("Addresses need Supabase to be configured.");
  }
};

export async function fetchAddresses(userId: string): Promise<Address[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapAddress);
}

export async function fetchAddress(id: string): Promise<Address | null> {
  requireSupabase();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapAddress(data) : null;
}

async function clearDefaults(userId: string) {
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);

  if (error) throw error;
}

export async function createAddress(
  userId: string,
  input: AddressInput
): Promise<Address> {
  requireSupabase();
  if (input.isDefault) await clearDefaults(userId);

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...toPayload(input), user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return mapAddress(data);
}

export async function updateAddress(
  userId: string,
  id: string,
  input: AddressInput
): Promise<Address> {
  requireSupabase();
  if (input.isDefault) await clearDefaults(userId);

  const { data, error } = await supabase
    .from("addresses")
    .update(toPayload(input))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapAddress(data);
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function setDefaultAddress(
  userId: string,
  id: string
): Promise<void> {
  requireSupabase();
  await clearDefaults(userId);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
