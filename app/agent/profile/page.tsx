import { requireAgent } from "@/lib/auth";
import { labelOf } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { CopyButton } from "@/components/shared/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function AgentProfilePage() {
  const { user, profile } = await requireAgent();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralLink = `${appUrl}/programs?ref=${profile.referralCode}`;

  return (
    <>
      <PageHeader title={ar.agent.profile} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>بيانات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label={ar.fields.fullName} value={user.name} />
            <InfoRow
              label={ar.fields.email}
              value={<span dir="ltr">{user.email}</span>}
            />
            <InfoRow
              label={ar.fields.phone}
              value={<span dir="ltr">{profile.phone}</span>}
            />
            <InfoRow
              label={ar.fields.companyName}
              value={profile.companyName ?? "—"}
            />
            <InfoRow label={ar.fields.city} value={profile.city ?? "—"} />
            <InfoRow
              label={ar.fields.status}
              value={
                <Badge
                  variant={
                    profile.status === "APPROVED"
                      ? "default"
                      : profile.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {labelOf("agentStatus", profile.status)}
                </Badge>
              }
            />
            <InfoRow
              label={ar.fields.commissionRate}
              value={`${profile.commissionRate}%`}
            />
            <InfoRow
              label={ar.fields.platformFeeRate}
              value={`${profile.platformFeeRate}%`}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              لتعديل بياناتك أو نسبك تواصل مع إدارة المنصة.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ar.agent.referralLink}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{ar.agent.referralHint}</p>
            <InfoRow
              label={ar.fields.referralCode}
              value={
                <span dir="ltr" className="font-mono">
                  {profile.referralCode}
                </span>
              }
            />
            <p className="break-all rounded-md bg-muted p-2 text-xs" dir="ltr">
              {referralLink}
            </p>
            <div className="flex gap-2">
              <CopyButton text={referralLink} />
              <CopyButton
                text={profile.referralCode}
                label="نسخ الكود فقط"
                variant="ghost"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
