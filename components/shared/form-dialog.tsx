"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { FormErrorsContext } from "@/components/shared/form-context";
import type { ActionState } from "@/lib/forms";
import { ar } from "@/lib/i18n/ar";

const initialState: ActionState = { ok: false };

// Generic create/edit dialog: renders a trigger, a form posting to a server
// action, shows field errors, closes + toasts on success.
export function FormDialog({
  trigger,
  title,
  action,
  submitLabel = ar.actions.save,
  successMessage = ar.misc.savedSuccessfully,
  children,
  wide,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  successMessage?: string;
  children: React.ReactNode | ((state: ActionState) => React.ReactNode);
  wide?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(action, initialState);
  const closedOnSuccess = React.useRef(false);

  React.useEffect(() => {
    if (state.ok && open && !closedOnSuccess.current) {
      closedOnSuccess.current = true;
      setOpen(false);
      toast.success(successMessage);
    }
  }, [state, open, successMessage]);

  React.useEffect(() => {
    if (open) closedOnSuccess.current = false;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={wide ? "sm:max-w-2xl max-h-[90vh] overflow-y-auto" : "max-h-[90vh] overflow-y-auto"}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <FormErrorsContext.Provider value={state.fieldErrors}>
            {typeof children === "function" ? children(state) : children}
          </FormErrorsContext.Provider>
          {state.error && !state.ok && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex justify-end">
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
