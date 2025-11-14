"use client";

import { axiosInstance } from "@/lib/axios";
import { extractErrorMessage } from "@/utils/error-handler";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type VoidFn = () => void;
type SetErrorFn = (msg: string) => void;

type DeleteMutationParams<TResponse> = {
  endpoint: string;
  successMessage?: string;
  refetchKey?: string; // space-separated keys
  onSuccess?: (deleted: TResponse) => void;
  onError?: (msg: string) => void;
  method?: "DELETE";
};

export function useDeleteMutation<TResponse = unknown>({
  endpoint,
  successMessage = "Deleted successfully!",
  refetchKey,
  onSuccess,
  onError,
  method = "DELETE",
}: DeleteMutationParams<TResponse>) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const remove = async (
    setError?: SetErrorFn,
    onClose?: VoidFn
  ): Promise<TResponse | undefined> => {
    try {
      const res = await axiosInstance.request<TResponse>({
        method,
        url: endpoint,
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });

      if (successMessage) {
        toast.success(successMessage, { description: "Successful" });
      }

      onClose?.();

      if (refetchKey) {
        refetchKey.split(" ").forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      onSuccess?.(res.data);
      return res.data;
    } catch (error) {
      const msg = extractErrorMessage(error);
      setError?.(msg);
      toast.error("Error", { description: msg });
      onError?.(msg);
      return undefined;
    }
  };

  return remove;
}
