import { ChevronUp, ChevronDown } from "lucide-react";

export const ChevronUpDown = () => (
  <div className="flex flex-col items-center">
    <ChevronUp size={24} className="-mb-2" />
    <ChevronDown size={24} />
  </div>
);
