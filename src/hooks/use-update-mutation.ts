// hooks/useUpdateMutation.ts
"use client";

import { axiosInstance } from "@/lib/axios";
import { extractErrorMessage } from "@/utils/error-handler";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type VoidFn = () => void;
type SetErrorFn = (msg: string) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UpdateMutationParams<TPayload, TResponse> = {
  endpoint: string;
  successMessage?: string;
  refetchKey?: string; // space-separated keys
  onSuccess?: (updated: TResponse) => void;
  onError?: (msg: string) => void;
  method?: "PATCH" | "PUT";
};

export function useUpdateMutation<TPayload = unknown, TResponse = unknown>({
  endpoint,
  successMessage = "Updated successfully!",
  refetchKey,
  onSuccess,
  onError,
  method = "PATCH",
}: UpdateMutationParams<TPayload, TResponse>) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const update = async (
    data?: TPayload,
    setError?: SetErrorFn,
    onClose?: VoidFn
  ): Promise<TResponse | undefined> => {
    try {
      const res = await axiosInstance.request<TResponse>({
        method,
        url: endpoint,
        data,
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

  return update;
}
