// app/server/provider/app-provider.tsx (or wherever this lives)
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

  // ✅ New: verified predict email
  predictEmail: string | null;
  predictLoaded: boolean;
  setPredictEmail: (email: string | null) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>({
    ageGatePassed: false,
    acceptedTerms: false,
  });
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [predictEmail, setPredictEmailState] = useState<string | null>(null);
  const [predictLoaded, setPredictLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Existing consent loading
    const ageGatePassed =
      window.localStorage.getItem("ageGatePassed") === "true";
    const acceptedTerms =
      window.localStorage.getItem("acceptedTerms") === "true";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent({ ageGatePassed, acceptedTerms });
    setConsentLoaded(true);

    // ✅ New: load verified predict email from localStorage
    const storedPredictEmail =
      window.localStorage.getItem("predictEmail") || null;
    setPredictEmailState(storedPredictEmail);
    setPredictLoaded(true);
  }, []);

  const setPredictEmail = (email: string | null) => {
    setPredictEmailState(email);
    if (typeof window !== "undefined") {
      if (email) {
        window.localStorage.setItem("predictEmail", email);
      } else {
        window.localStorage.removeItem("predictEmail");
      }
    }
  };

  const value: AppContextValue = {
    consent,
    consentLoaded,
    setConsent,
    predictEmail,
    predictLoaded,
    setPredictEmail,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
