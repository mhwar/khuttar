"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProgram } from "@/lib/actions/programs";
import type { ActionState } from "@/lib/forms";
import {
  LABELS,
  PROGRAM_STATUSES,
  PROGRAM_VISIBILITIES,
  STUDY_KINDS,
  TOUR_TYPES,
} from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { FormErrorsContext } from "@/components/shared/form-context";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { SubmitButton } from "@/components/shared/submit-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Program } from "@prisma/client";

const initialState: ActionState = { ok: false };

export function ProgramForm({
  value,
  destinations,
  isAdmin,
  backTo,
}: {
  value?: Program;
  destinations: { id: string; name: string }[];
  isAdmin: boolean;
  backTo: string;
}) {
  const router = useRouter();
  const [category, setCategory] = React.useState(value?.category ?? "TOUR");
  const [state, formAction] = useActionState(saveProgram, initialState);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(ar.misc.savedSuccessfully);
      router.push(backTo);
    }
  }, [state, router, backTo]);

  return (
    <form action={formAction}>
      <FormErrorsContext.Provider value={state.fieldErrors}>
        {value && <input type="hidden" name="id" value={value.id} />}
        <input type="hidden" name="category" value={category} />

        <div className="grid gap-6">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList>
              <TabsTrigger value="TOUR" disabled={!!value && value.category !== "TOUR"}>
                {LABELS.programCategory.TOUR}
              </TabsTrigger>
              <TabsTrigger value="STUDY" disabled={!!value && value.category !== "STUDY"}>
                {LABELS.programCategory.STUDY}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.title} name="title">
                  <Input name="title" defaultValue={value?.title} required />
                </Field>
                <Field label={ar.fields.destination} name="destinationId">
                  <NativeSelect
                    name="destinationId"
                    defaultValue={value?.destinationId ?? ""}
                  >
                    <option value="">{ar.misc.none}</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field label={ar.fields.summary} name="summary">
                <Input name="summary" defaultValue={value?.summary ?? ""} />
              </Field>
              <Field label={ar.fields.description} name="description">
                <Textarea
                  name="description"
                  defaultValue={value?.description ?? ""}
                  rows={5}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={ar.fields.basePrice} name="basePrice">
                  <Input
                    name="basePrice"
                    type="number"
                    defaultValue={value?.basePrice ?? ""}
                  />
                </Field>
                <Field
                  label={ar.fields.coverImage}
                  name="coverImage"
                  hint="مثال: /images/istanbul.svg"
                >
                  <Input
                    name="coverImage"
                    defaultValue={value?.coverImage ?? ""}
                    dir="ltr"
                  />
                </Field>
                <Field label={ar.fields.slug} name="slug" hint="اختياري">
                  <Input name="slug" defaultValue={value?.slug ?? ""} dir="ltr" />
                </Field>
              </div>
            </CardContent>
          </Card>

          {category === "TOUR" ? (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل البرنامج السياحي</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.type} name="tourType">
                    <NativeSelect
                      name="tourType"
                      defaultValue={value?.tourType ?? "DOMESTIC"}
                    >
                      {enumOptions(TOUR_TYPES, LABELS.tourType)}
                    </NativeSelect>
                  </Field>
                  <Field label={ar.fields.durationDays} name="durationDays">
                    <Input
                      name="durationDays"
                      type="number"
                      defaultValue={value?.durationDays ?? ""}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.inclusions} name="inclusions">
                    <Textarea
                      name="inclusions"
                      defaultValue={value?.inclusions ?? ""}
                      rows={4}
                    />
                  </Field>
                  <Field label={ar.fields.exclusions} name="exclusions">
                    <Textarea
                      name="exclusions"
                      defaultValue={value?.exclusions ?? ""}
                      rows={4}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل البرنامج الدراسي</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={ar.fields.type} name="studyKind">
                    <NativeSelect
                      name="studyKind"
                      defaultValue={value?.studyKind ?? "LANGUAGE"}
                    >
                      {enumOptions(STUDY_KINDS, LABELS.studyKind)}
                    </NativeSelect>
                  </Field>
                  <Field label={ar.fields.institute} name="institute">
                    <Input name="institute" defaultValue={value?.institute ?? ""} />
                  </Field>
                  <Field label={ar.fields.city} name="studyCity">
                    <Input name="studyCity" defaultValue={value?.studyCity ?? ""} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={ar.fields.durationWeeks} name="durationWeeks">
                    <Input
                      name="durationWeeks"
                      type="number"
                      defaultValue={value?.durationWeeks ?? ""}
                    />
                  </Field>
                  <Field label={ar.fields.tuitionMin} name="tuitionMin">
                    <Input
                      name="tuitionMin"
                      type="number"
                      defaultValue={value?.tuitionMin ?? ""}
                    />
                  </Field>
                  <Field label={ar.fields.tuitionMax} name="tuitionMax">
                    <Input
                      name="tuitionMax"
                      type="number"
                      defaultValue={value?.tuitionMax ?? ""}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.requirements} name="requirements">
                    <Textarea
                      name="requirements"
                      defaultValue={value?.requirements ?? ""}
                      rows={4}
                    />
                  </Field>
                  <Field label={ar.fields.servicesIncluded} name="servicesIncluded">
                    <Textarea
                      name="servicesIncluded"
                      defaultValue={value?.servicesIncluded ?? ""}
                      rows={4}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>النشر والظهور</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.status} name="status">
                  <NativeSelect
                    name="status"
                    defaultValue={value?.status ?? "DRAFT"}
                  >
                    {enumOptions(PROGRAM_STATUSES, LABELS.programStatus)}
                  </NativeSelect>
                </Field>
                <Field label={ar.fields.visibility} name="visibility">
                  <NativeSelect
                    name="visibility"
                    defaultValue={value?.visibility ?? "PUBLIC"}
                  >
                    {enumOptions(PROGRAM_VISIBILITIES, LABELS.programVisibility)}
                  </NativeSelect>
                </Field>
              </div>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={value?.featured ?? false}
                    className="size-4 accent-primary"
                  />
                  {ar.fields.featured} (يظهر في الصفحة الرئيسية)
                </label>
              )}
            </CardContent>
          </Card>

          {state.error && !state.ok && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <SubmitButton>{ar.actions.save}</SubmitButton>
          </div>
        </div>
      </FormErrorsContext.Provider>
    </form>
  );
}
