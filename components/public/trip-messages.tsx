"use client";

import * as React from "react";
import { useActionState } from "react";
import { SendIcon } from "lucide-react";
import { postCustomerMessage } from "@/lib/actions/messages";
import type { ActionState } from "@/lib/forms";
import { ar } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { ok: false };

type Message = {
  id: string;
  authorRole: string;
  authorName: string;
  body: string;
  createdAt: string;
};

// Customer-facing thread on the public trip page. The booking code is the
// access token, so no login is required — posting re-renders the server page.
export function TripMessages({
  code,
  messages,
}: {
  code: string;
  messages: Message[];
}) {
  const [state, formAction] = useActionState(postCustomerMessage, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="grid gap-4">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {ar.booking.noMessages}
        </p>
      ) : (
        <div className="grid gap-3">
          {messages.map((m) => {
            const isCustomer = m.authorRole === "CUSTOMER";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1",
                  isCustomer ? "items-start" : "items-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    isCustomer
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {m.body}
                </div>
                <span className="px-1 text-[11px] text-muted-foreground">
                  {m.authorName}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <form ref={formRef} action={formAction} className="grid gap-2">
        <input type="hidden" name="code" value={code} />
        <Textarea
          name="body"
          rows={2}
          required
          placeholder={ar.booking.writeMessage}
        />
        {state.error && !state.ok && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" size="sm" className="justify-self-end">
          <SendIcon className="size-4" />
          {ar.actions.send}
        </Button>
      </form>
    </div>
  );
}
