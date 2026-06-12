"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { SubmitButton } from "@/components/shared/submit-button";
import { ar } from "@/lib/i18n/ar";

const initialState: ActionState = { ok: false };

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            {ar.brand}
          </Link>
          <CardTitle className="text-lg font-semibold">
            {ar.nav.login}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <Field label={ar.fields.email} htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
              />
            </Field>
            <Field label={ar.fields.password} htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
              />
            </Field>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <SubmitButton className="w-full">{ar.actions.login}</SubmitButton>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/">{ar.actions.back} {ar.nav.home}</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
