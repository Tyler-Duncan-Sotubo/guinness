"use client";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteMutation } from "@/hooks/use-delete-mutation";
import { useState } from "react";
import { FaTrash } from "react-icons/fa6";

type DeleteType = "location" | "event";

type Props = {
  itemId: string;
  type: DeleteType;
  showText?: boolean;
};

const deleteConfigMap: Record<
  DeleteType,
  {
    endpoint: (id: string) => string;
    successMessage: string;
    refetchKey: string;
  }
> = {
  location: {
    endpoint: (id) => `/locations/${id}`,
    successMessage: "Location deleted",
    refetchKey: "locations",
  },
  event: {
    endpoint: (id) => `/events/${id}`,
    successMessage: "Event deleted",
    refetchKey: "events",
  },
};

export const DeleteButton = ({ itemId, type, showText }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const config = deleteConfigMap[type];

  const deleteMutation = useDeleteMutation({
    endpoint: config.endpoint(itemId),
    successMessage: config.successMessage,
    refetchKey: config.refetchKey,
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    setDisabled(true);
    try {
      await deleteMutation();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
      setDisabled(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="link"
          size="icon"
          disabled={disabled || isDeleting}
          className="text-monzo-error"
        >
          <FaTrash /> {showText && <span className="">Delete</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-monzo-error hover:bg-monzo-error/90 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
