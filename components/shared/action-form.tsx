"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { FormErrorsContext } from "@/components/shared/form-context";
import type { ActionState } from "@/lib/forms";
import { ar } from "@/lib/i18n/ar";

const initialState: ActionState = { ok: false };

// Plain (non-dialog) form wired to a server action returning ActionState:
// publishes field errors via context and toasts on success.
export function ActionForm({
  action,
  successMessage = ar.misc.savedSuccessfully,
  className,
  children,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const announced = React.useRef<ActionState>(initialState);

  React.useEffect(() => {
    if (state !== announced.current && state.ok) {
      announced.current = state;
      toast.success(successMessage);
    }
  }, [state, successMessage]);

  return (
    <form action={formAction} className={className}>
      <FormErrorsContext.Provider value={state.fieldErrors}>
        {children}
      </FormErrorsContext.Provider>
      {state.error && !state.ok && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
