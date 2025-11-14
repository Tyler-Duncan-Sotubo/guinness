export function saveAgeGate() {
  localStorage.setItem("ageGatePassed", "true");
}

export function saveTerms(accepted: boolean) {
  localStorage.setItem("acceptedTerms", accepted ? "true" : "false");
}

export function getConsent() {
  return {
    ageGatePassed: localStorage.getItem("ageGatePassed") === "true",
    acceptedTerms: localStorage.getItem("acceptedTerms") === "true",
  };
}
