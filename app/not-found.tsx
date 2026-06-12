import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ar } from "@/lib/i18n/ar";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <CompassIcon className="size-14 text-primary" />
      <h1 className="text-3xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="max-w-md text-muted-foreground">
        يبدو أنك وصلت لوجهة غير مدرجة في خرائطنا — لا بأس، رحلة العودة دائماً
        متاحة.
      </p>
      <Button asChild>
        <Link href="/">{ar.nav.home}</Link>
      </Button>
    </main>
  );
}
