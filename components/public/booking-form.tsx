"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import {
  submitPublicBooking,
  type PublicBookingState,
} from "@/lib/actions/bookings";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { FormErrorsContext } from "@/components/shared/form-context";
import { SubmitButton } from "@/components/shared/submit-button";
import { CopyButton } from "@/components/shared/copy-button";

const initialState: PublicBookingState = { ok: false };

export function BookingForm({
  programId,
  refCode,
  title = ar.booking.requestTitle,
}: {
  programId: string;
  refCode?: string;
  title?: string;
}) {
  const [state, formAction] = useActionState(submitPublicBooking, initialState);

  if (state.ok && state.code) {
    const tripPath = `/b/${state.code}`;
    return (
      <Card className="border-emerald-300 bg-emerald-50/50">
        <CardContent className="grid gap-3 py-6 text-center">
          <CheckCircle2Icon className="mx-auto size-10 text-emerald-600" />
          <p className="font-bold">{ar.booking.successTitle}</p>
          <p className="text-sm text-muted-foreground">
            {ar.booking.successBody}{" "}
            <span className="font-mono font-bold text-foreground" dir="ltr">
              {state.code}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{ar.booking.trackHint}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link href={tripPath}>{ar.trip.yourTrip}</Link>
            </Button>
            <CopyButton text={tripPath} label="نسخ رابط المتابعة" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {ar.booking.requestSubtitle}
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <FormErrorsContext.Provider value={state.fieldErrors}>
            <input type="hidden" name="programId" value={programId} />
            {refCode && <input type="hidden" name="ref" value={refCode} />}
            <Field label={ar.fields.fullName} name="customerName">
              <Input name="customerName" required />
            </Field>
            <Field label={ar.fields.phone} name="customerPhone">
              <Input
                name="customerPhone"
                dir="ltr"
                placeholder="05xxxxxxxx"
                required
              />
            </Field>
            <Field label={`${ar.fields.email} (${ar.misc.optional})`} name="customerEmail">
              <Input name="customerEmail" type="email" dir="ltr" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ar.fields.adults} name="adults">
                <Input name="adults" type="number" min={1} defaultValue={2} />
              </Field>
              <Field label={ar.fields.children} name="children">
                <Input name="children" type="number" min={0} defaultValue={0} />
              </Field>
            </div>
            <Field label={`${ar.fields.preferredDate} (${ar.misc.optional})`} name="preferredDate">
              <Input name="preferredDate" type="date" dir="ltr" />
            </Field>
            <Field label={`${ar.fields.notes} (${ar.misc.optional})`} name="customerNotes">
              <Textarea name="customerNotes" rows={2} />
            </Field>
          </FormErrorsContext.Provider>
          {state.error && !state.ok && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton className="w-full">{ar.actions.bookNow}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
