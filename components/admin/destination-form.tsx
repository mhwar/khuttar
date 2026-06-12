import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { DESTINATION_TYPES, LABELS } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import type { Destination } from "@prisma/client";

export function DestinationFormFields({ value }: { value?: Destination }) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.name} name="name">
          <Input name="name" defaultValue={value?.name} required />
        </Field>
        <Field label={ar.fields.country} name="country">
          <Input name="country" defaultValue={value?.country} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.type} name="type">
          <NativeSelect name="type" defaultValue={value?.type ?? "DOMESTIC"}>
            {enumOptions(DESTINATION_TYPES, LABELS.destinationType)}
          </NativeSelect>
        </Field>
        <Field
          label={ar.fields.slug}
          name="slug"
          hint="اختياري — أحرف إنجليزية وأرقام وشرطات"
        >
          <Input name="slug" defaultValue={value?.slug} dir="ltr" />
        </Field>
      </div>
      <Field label={ar.fields.description} name="description">
        <Textarea name="description" defaultValue={value?.description ?? ""} rows={3} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.image} name="image" hint="مثال: /images/saudi.svg">
          <Input name="image" defaultValue={value?.image ?? ""} dir="ltr" />
        </Field>
        <Field label={ar.fields.sortOrder} name="sortOrder">
          <Input
            name="sortOrder"
            type="number"
            defaultValue={value?.sortOrder ?? 0}
          />
        </Field>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={value?.featured ?? false}
            className="size-4 accent-primary"
          />
          {ar.fields.featured}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={value?.active ?? true}
            className="size-4 accent-primary"
          />
          {ar.fields.active}
        </label>
      </div>
    </>
  );
}
