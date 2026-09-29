"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type NavigationContextValue = {
  pending: boolean;
  navigate: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(href: string) {
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <NavigationContext.Provider value={{ pending, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useDashboardNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useDashboardNavigation must be used within NavigationProvider");
  }
  return context;
}
