import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, PencilIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  deleteArea,
  deleteAttraction,
  saveArea,
  saveAttraction,
} from "@/lib/actions/catalog";
import {
  AREA_KINDS,
  ATTRACTION_CATEGORIES,
  LABELS,
  labelOf,
} from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { formatSAR } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";
import { Field } from "@/components/shared/field";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Area, Attraction } from "@prisma/client";

function AreaFormFields({
  destinationId,
  areas,
  value,
}: {
  destinationId: string;
  areas: Area[];
  value?: Area;
}) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <input type="hidden" name="destinationId" value={destinationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.name} name="name">
          <Input name="name" defaultValue={value?.name} required />
        </Field>
        <Field label={ar.fields.kind} name="kind">
          <NativeSelect name="kind" defaultValue={value?.kind ?? "CITY"}>
            {enumOptions(AREA_KINDS, LABELS.areaKind)}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.parentArea} name="parentId">
          <NativeSelect name="parentId" defaultValue={value?.parentId ?? ""}>
            <option value="">{ar.misc.none}</option>
            {areas
              .filter((a) => a.id !== value?.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({labelOf("areaKind", a.kind)})
                </option>
              ))}
          </NativeSelect>
        </Field>
        <Field label={ar.fields.sortOrder} name="sortOrder">
          <Input name="sortOrder" type="number" defaultValue={value?.sortOrder ?? 0} />
        </Field>
      </div>
      <Field label={ar.fields.description} name="description">
        <Textarea name="description" defaultValue={value?.description ?? ""} rows={2} />
      </Field>
    </>
  );
}

function AttractionFormFields({
  areas,
  value,
}: {
  areas: Area[];
  value?: Attraction;
}) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.name} name="name">
          <Input name="name" defaultValue={value?.name} required />
        </Field>
        <Field label={ar.fields.area} name="areaId">
          <NativeSelect name="areaId" defaultValue={value?.areaId ?? areas[0]?.id} required>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={ar.fields.category} name="category">
          <NativeSelect name="category" defaultValue={value?.category ?? "LANDMARK"}>
            {enumOptions(ATTRACTION_CATEGORIES, LABELS.attractionCategory)}
          </NativeSelect>
        </Field>
        <Field label={ar.fields.durationMin} name="durationMin">
          <Input
            name="durationMin"
            type="number"
            defaultValue={value?.durationMin ?? ""}
          />
        </Field>
        <Field label={ar.fields.costEstimate} name="costEstimate">
          <Input
            name="costEstimate"
            type="number"
            defaultValue={value?.costEstimate ?? ""}
          />
        </Field>
      </div>
      <Field label={ar.fields.description} name="description">
        <Textarea name="description" defaultValue={value?.description ?? ""} rows={2} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={value?.active ?? true}
          className="size-4 accent-primary"
        />
        {ar.fields.active}
      </label>
    </>
  );
}

function AreaNode({
  area,
  allAreas,
  destinationId,
  depth,
}: {
  area: Area & { children?: Area[] };
  allAreas: Area[];
  destinationId: string;
  depth: number;
}) {
  const children = allAreas
    .filter((a) => a.parentId === area.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ marginInlineStart: depth ? 20 : 0 }}>
      <div className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{area.name}</span>
          <Badge variant="outline">{labelOf("areaKind", area.kind)}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <FormDialog
            title={`تعديل: ${area.name}`}
            action={saveArea}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={ar.actions.edit}>
                <PencilIcon className="size-4" />
              </Button>
            }
          >
            <AreaFormFields
              destinationId={destinationId}
              areas={allAreas}
              value={area}
            />
          </FormDialog>
          <ConfirmDeleteButton action={deleteArea.bind(null, area.id)} />
        </div>
      </div>
      {children.length > 0 && (
        <div className="mt-2 grid gap-2 border-s-2 border-dashed ps-3">
          {children.map((child) => (
            <AreaNode
              key={child.id}
              area={child}
              allAreas={allAreas}
              destinationId={destinationId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const destination = await db.destination.findUnique({
    where: { id },
    include: {
      areas: { orderBy: { sortOrder: "asc" } },
      programs: { select: { id: true, title: true } },
    },
  });
  if (!destination) notFound();

  const attractions = await db.attraction.findMany({
    where: { area: { destinationId: id } },
    include: { area: true },
    orderBy: { name: "asc" },
  });

  const rootAreas = destination.areas.filter((a) => !a.parentId);

  return (
    <>
      <PageHeader
        title={destination.name}
        description={`${destination.country} • ${labelOf("destinationType", destination.type)}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/destinations">
              <ArrowRightIcon className="size-4" />
              {ar.actions.back}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>التقسيمات والمناطق</CardTitle>
            <FormDialog
              title="إضافة منطقة/تقسيم"
              action={saveArea}
              trigger={
                <Button size="sm" variant="outline">
                  <PlusIcon className="size-4" />
                  {ar.actions.create}
                </Button>
              }
            >
              <AreaFormFields
                destinationId={destination.id}
                areas={destination.areas}
              />
            </FormDialog>
          </CardHeader>
          <CardContent className="grid gap-2">
            {rootAreas.length === 0 ? (
              <EmptyState message="أضف المناطق والمدن لتسهيل بناء الجداول" />
            ) : (
              rootAreas.map((area) => (
                <AreaNode
                  key={area.id}
                  area={area}
                  allAreas={destination.areas}
                  destinationId={destination.id}
                  depth={0}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>المعالم والأنشطة</CardTitle>
            {destination.areas.length > 0 && (
              <FormDialog
                title="إضافة معلم/نشاط"
                action={saveAttraction}
                wide
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="size-4" />
                    {ar.actions.create}
                  </Button>
                }
              >
                <AttractionFormFields areas={destination.areas} />
              </FormDialog>
            )}
          </CardHeader>
          <CardContent>
            {attractions.length === 0 ? (
              <EmptyState message="أضف المعالم لاستخدامها في فقرات الجداول" />
            ) : (
              <Table>
                <TableHeaderRow />
                <tbody className="[&_tr:last-child]:border-0">
                  {attractions.map((attraction) => (
                    <tr key={attraction.id} className="border-b transition-colors">
                      <td className="p-2 align-middle font-medium">
                        {attraction.name}
                      </td>
                      <td className="p-2 align-middle">{attraction.area.name}</td>
                      <td className="p-2 align-middle">
                        <Badge variant="outline">
                          {labelOf("attractionCategory", attraction.category)}
                        </Badge>
                      </td>
                      <td className="p-2 align-middle text-muted-foreground">
                        {attraction.costEstimate
                          ? formatSAR(attraction.costEstimate)
                          : "—"}
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <FormDialog
                            title={`تعديل: ${attraction.name}`}
                            action={saveAttraction}
                            wide
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={ar.actions.edit}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                            }
                          >
                            <AttractionFormFields
                              areas={destination.areas}
                              value={attraction}
                            />
                          </FormDialog>
                          <ConfirmDeleteButton
                            action={deleteAttraction.bind(null, attraction.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{ar.fields.name}</TableHead>
        <TableHead>{ar.fields.area}</TableHead>
        <TableHead>{ar.fields.category}</TableHead>
        <TableHead>{ar.fields.costEstimate}</TableHead>
        <TableHead className="w-24"></TableHead>
      </TableRow>
    </TableHeader>
  );
}
