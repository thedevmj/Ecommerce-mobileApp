import { useMemo } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getTheme } from "@/constants/theme";

export function useAppTheme() {
  const scheme = useColorScheme() ?? "light";
  return useMemo(() => getTheme(scheme), [scheme]);
}
