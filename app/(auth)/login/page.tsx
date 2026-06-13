import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ar } from "@/lib/i18n/ar";

// Native form POST to a Route Handler (not a Server Action): the handler sets
// the session cookie on its redirect response, which persists reliably behind
// the hosting proxy. No client JS required to log in.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-3xl font-extrabold text-primary">
            {ar.brand}
          </Link>
          <CardTitle className="text-lg font-semibold">{ar.nav.login}</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/api/auth/login" className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">{ar.fields.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">{ar.fields.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">
                {ar.misc.invalidCredentials}
              </p>
            )}
            <Button type="submit" className="w-full">
              {ar.actions.login}
            </Button>
            <Button variant="link" asChild className="text-muted-foreground">
              <Link href="/">
                {ar.actions.back} {ar.nav.home}
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
