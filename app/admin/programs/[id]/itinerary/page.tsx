import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { loadBuilderData } from "@/lib/itinerary-data";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { ItineraryBuilder } from "@/components/itinerary/builder";
import { ItineraryView } from "@/components/public/itinerary-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await loadBuilderData(id);
  if (!data) notFound();

  return (
    <>
      <PageHeader
        title={`جدول الرحلة: ${data.program.title}`}
        description="ابنِ البرنامج يوماً بيوم — أنشطة، تنقلات، فنادق، وجبات"
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/programs/${id}`}>
              <ArrowRightIcon className="size-4" />
              {ar.actions.back}
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">البناء</TabsTrigger>
          <TabsTrigger value="preview">معاينة العميل</TabsTrigger>
        </TabsList>
        <TabsContent value="builder" className="mt-4">
          <ItineraryBuilder
            programId={data.program.id}
            days={data.days}
            areas={data.areas}
            attractions={data.attractions}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{data.program.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ItineraryView days={data.days} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
