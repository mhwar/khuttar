import { MailOpenIcon, MailIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { markMessageRead } from "@/lib/actions/misc";
import { formatDateTime } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/shared/action-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title={ar.admin.messages}
        description="رسائل العملاء من نموذج التواصل في الموقع"
      />

      <Card>
        <CardContent className="grid gap-3">
          {messages.length === 0 ? (
            <EmptyState message="لا توجد رسائل" />
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-wrap items-start justify-between gap-3 rounded-md border p-4",
                  !message.isRead && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{message.name}</span>
                    {!message.isRead && <Badge>جديدة</Badge>}
                    {message.subject && (
                      <span className="text-sm text-muted-foreground">
                        — {message.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{message.phone}</span>
                    {message.email && (
                      <>
                        {" "}
                        • <span dir="ltr">{message.email}</span>
                      </>
                    )}{" "}
                    • {formatDateTime(message.createdAt)}
                  </p>
                </div>
                <ActionButton
                  action={markMessageRead.bind(null, message.id, !message.isRead)}
                  size="sm"
                  variant="ghost"
                >
                  {message.isRead ? (
                    <>
                      <MailIcon className="size-4" />
                      تمييز كغير مقروءة
                    </>
                  ) : (
                    <>
                      <MailOpenIcon className="size-4" />
                      تمييز كمقروءة
                    </>
                  )}
                </ActionButton>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
