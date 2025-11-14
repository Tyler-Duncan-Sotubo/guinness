import { GoAlertFill } from "react-icons/go";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  isLoading: boolean;
}

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
  isLoading = false,
}: ErrorStateProps) {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center py-10 text-center text-red-600 ">
      <GoAlertFill className="w-24 h-24 mb-4" />
      <p className="text-lg font-medium mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={() => onRetry()}
          className="mt-4"
          isLoading={isLoading}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
