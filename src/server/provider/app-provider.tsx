"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ConsentState = {
  ageGatePassed: boolean;
  acceptedTerms: boolean;
};

type AppContextValue = {
  consent: ConsentState;
  consentLoaded: boolean;
  setConsent: (value: ConsentState) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>({
    ageGatePassed: false,
    acceptedTerms: false,
  });

  const [consentLoaded, setConsentLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ageGatePassed =
      window.localStorage.getItem("ageGatePassed") === "true";
    const acceptedTerms =
      window.localStorage.getItem("acceptedTerms") === "true";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent({ ageGatePassed, acceptedTerms });
    setConsentLoaded(true);
  }, []);

  const value: AppContextValue = {
    consent,
    consentLoaded,
    setConsent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
