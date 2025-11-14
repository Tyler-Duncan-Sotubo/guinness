// hooks/useCreateMutation.ts
"use client";

import { axiosInstance } from "@/lib/axios";
import { extractErrorMessage } from "@/utils/error-handler";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type VoidFn = () => void;
type SetErrorFn = (msg: string) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CreateMutationParams<TPayload, TResponse> = {
  endpoint: string;
  successMessage?: string;
  refetchKey?: string; // space-separated keys
  onSuccess?: (created: TResponse) => void;
  onError?: (msg: string) => void;
};

export function useCreateMutation<TPayload = unknown, TResponse = unknown>({
  endpoint,
  successMessage = "Created successfully!",
  refetchKey,
  onSuccess,
  onError,
}: CreateMutationParams<TPayload, TResponse>) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const create = async (
    data?: TPayload,
    setError?: SetErrorFn,
    resetForm?: VoidFn,
    onClose?: VoidFn
  ): Promise<TResponse | undefined> => {
    try {
      const res = await axiosInstance.post<TResponse>(endpoint, data, {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });

      toast.success(successMessage, {
        description: "The operation was successful",
      });
      resetForm?.();
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

  return create;
}
