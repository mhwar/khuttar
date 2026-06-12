"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  BedIcon,
  BusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CoffeeIcon,
  MapPinIcon,
  PencilIcon,
  PlaneIcon,
  PlusIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteDay,
  deleteItem,
  moveDay,
  moveItem,
  saveDay,
  saveItem,
} from "@/lib/actions/itinerary";
import type { ActionState } from "@/lib/forms";
import { ITEM_TYPES, LABELS, labelOf, type ItemType } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { FormErrorsContext } from "@/components/shared/form-context";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { SubmitButton } from "@/components/shared/submit-button";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";

export type BuilderArea = { id: string; name: string; destinationName: string };
export type BuilderAttraction = {
  id: string;
  name: string;
  areaId: string;
  durationMin: number | null;
};
export type BuilderItem = {
  id: string;
  dayId: string;
  type: string;
  title: string;
  notes: string | null;
  startTime: string | null;
  durationMin: number | null;
  areaId: string | null;
  attractionId: string | null;
  areaName: string | null;
};
export type BuilderDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  items: BuilderItem[];
};

const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  ACTIVITY: SparklesIcon,
  TRANSPORT: BusIcon,
  HOTEL: BedIcon,
  MEAL: UtensilsIcon,
  FLIGHT: PlaneIcon,
  FREE_TIME: CoffeeIcon,
  OTHER: MapPinIcon,
};

const initialState: ActionState = { ok: false };

function ActionFormDialog({
  title,
  trigger,
  action,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  trigger?: React.ReactNode;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const closed = React.useRef(false);

  React.useEffect(() => {
    if (state.ok && open && !closed.current) {
      closed.current = true;
      onOpenChange(false);
      toast.success(ar.misc.savedSuccessfully);
    }
  }, [state, open, onOpenChange]);

  React.useEffect(() => {
    if (open) closed.current = false;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <FormErrorsContext.Provider value={state.fieldErrors}>
            {children}
          </FormErrorsContext.Provider>
          {state.error && !state.ok && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex justify-end">
            <SubmitButton>{ar.actions.save}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemFormFields({
  dayId,
  areas,
  attractions,
  value,
}: {
  dayId: string;
  areas: BuilderArea[];
  attractions: BuilderAttraction[];
  value?: BuilderItem;
}) {
  const [areaId, setAreaId] = React.useState(value?.areaId ?? "");
  const [title, setTitle] = React.useState(value?.title ?? "");
  const [duration, setDuration] = React.useState(
    value?.durationMin?.toString() ?? "",
  );
  const areaAttractions = attractions.filter((a) => a.areaId === areaId);

  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <input type="hidden" name="dayId" value={dayId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.type} name="type">
          <NativeSelect name="type" defaultValue={value?.type ?? "ACTIVITY"}>
            {enumOptions(ITEM_TYPES, LABELS.itemType)}
          </NativeSelect>
        </Field>
        <Field label={ar.fields.startTime} name="startTime">
          <Input
            name="startTime"
            type="time"
            defaultValue={value?.startTime ?? ""}
            dir="ltr"
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.area} name="areaId">
          <NativeSelect
            name="areaId"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
          >
            <option value="">{ar.misc.none}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.destinationName}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          label={ar.fields.attraction}
          name="attractionId"
          hint="اختيار المعلم يعبّئ العنوان والمدة تلقائياً"
        >
          <NativeSelect
            name="attractionId"
            defaultValue={value?.attractionId ?? ""}
            disabled={!areaId || areaAttractions.length === 0}
            onChange={(e) => {
              const attraction = areaAttractions.find(
                (a) => a.id === e.target.value,
              );
              if (attraction) {
                if (!title) setTitle(attraction.name);
                if (!duration && attraction.durationMin) {
                  setDuration(String(attraction.durationMin));
                }
              }
            }}
          >
            <option value="">{ar.misc.none}</option>
            {areaAttractions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label={ar.fields.title} name="title">
          <Input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>
        <Field label={ar.fields.durationMin} name="durationMin">
          <Input
            name="durationMin"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
      </div>
      <Field label={ar.fields.notes} name="notes">
        <Textarea name="notes" defaultValue={value?.notes ?? ""} rows={2} />
      </Field>
    </>
  );
}

function ItemRow({
  item,
  isFirst,
  isLast,
  areas,
  attractions,
}: {
  item: BuilderItem;
  isFirst: boolean;
  isLast: boolean;
  areas: BuilderArea[];
  attractions: BuilderAttraction[];
}) {
  const [, startTransition] = React.useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const Icon = TYPE_ICONS[item.type as ItemType] ?? MapPinIcon;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{item.title}</span>
          <Badge variant="outline" className="shrink-0">
            {labelOf("itemType", item.type)}
          </Badge>
          {item.areaName && (
            <Badge variant="secondary" className="shrink-0">
              {item.areaName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {item.startTime && (
            <span className="flex items-center gap-1" dir="ltr">
              <ClockIcon className="size-3" />
              {item.startTime}
            </span>
          )}
          {item.durationMin && <span>{item.durationMin} دقيقة</span>}
          {item.notes && <span className="truncate">{item.notes}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={isFirst}
          aria-label={ar.actions.moveUp}
          onClick={() => startTransition(() => void moveItem(item.id, "up"))}
        >
          <ChevronUpIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={isLast}
          aria-label={ar.actions.moveDown}
          onClick={() => startTransition(() => void moveItem(item.id, "down"))}
        >
          <ChevronDownIcon className="size-3.5" />
        </Button>
        <ActionFormDialog
          title={`تعديل: ${item.title}`}
          action={saveItem}
          open={editOpen}
          onOpenChange={setEditOpen}
          trigger={
            <Button variant="ghost" size="icon-xs" aria-label={ar.actions.edit}>
              <PencilIcon className="size-3.5" />
            </Button>
          }
        >
          <ItemFormFields
            dayId={item.dayId}
            areas={areas}
            attractions={attractions}
            value={item}
          />
        </ActionFormDialog>
        <ConfirmDeleteButton action={deleteItem.bind(null, item.id)} />
      </div>
    </div>
  );
}

export function ItineraryBuilder({
  programId,
  days,
  areas,
  attractions,
}: {
  programId: string;
  days: BuilderDay[];
  areas: BuilderArea[];
  attractions: BuilderAttraction[];
}) {
  const [, startTransition] = React.useTransition();
  const [addDayOpen, setAddDayOpen] = React.useState(false);
  const [editDayId, setEditDayId] = React.useState<string | null>(null);
  const [addItemDayId, setAddItemDayId] = React.useState<string | null>(null);

  const editDay = days.find((d) => d.id === editDayId);

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <ActionFormDialog
          title={ar.actions.addDay}
          action={saveDay}
          open={addDayOpen}
          onOpenChange={setAddDayOpen}
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {ar.actions.addDay}
            </Button>
          }
        >
          <input type="hidden" name="programId" value={programId} />
          <Field label={ar.fields.title} name="title" hint="مثال: الوصول وجولة المدينة">
            <Input name="title" required />
          </Field>
          <Field label={ar.fields.description} name="description">
            <Textarea name="description" rows={2} />
          </Field>
        </ActionFormDialog>
      </div>

      {days.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          ابدأ ببناء الجدول — أضف اليوم الأول ثم أضف الفقرات (أنشطة، تنقلات،
          وجبات، فنادق...)
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={days.map((d) => d.id)}
          className="grid gap-3"
        >
          {days.map((day, dayIndex) => (
            <AccordionItem
              key={day.id}
              value={day.id}
              className="rounded-lg border bg-card px-4 last:border-b"
            >
              <div className="flex items-center gap-2">
                <AccordionTrigger className="flex-1 hover:no-underline">
                  <div className="flex flex-wrap items-center gap-2 text-start">
                    <span className="font-bold">
                      اليوم {day.dayNumber}: {day.title}
                    </span>
                    <Badge variant="outline">{day.items.length} فقرة</Badge>
                  </div>
                </AccordionTrigger>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={dayIndex === 0}
                    aria-label={ar.actions.moveUp}
                    onClick={() => startTransition(() => void moveDay(day.id, "up"))}
                  >
                    <ChevronUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={dayIndex === days.length - 1}
                    aria-label={ar.actions.moveDown}
                    onClick={() =>
                      startTransition(() => void moveDay(day.id, "down"))
                    }
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={ar.actions.edit}
                    onClick={() => setEditDayId(day.id)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <ConfirmDeleteButton
                    action={deleteDay.bind(null, day.id)}
                    description="سيتم حذف اليوم وجميع فقراته وإعادة ترقيم الأيام التالية."
                  />
                </div>
              </div>
              <AccordionContent className="grid gap-2 pb-4">
                {day.description && (
                  <p className="text-sm text-muted-foreground">{day.description}</p>
                )}
                {day.items.map((item, itemIndex) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isFirst={itemIndex === 0}
                    isLast={itemIndex === day.items.length - 1}
                    areas={areas}
                    attractions={attractions}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setAddItemDayId(day.id)}
                >
                  <PlusIcon className="size-4" />
                  {ar.actions.addItem}
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {editDay && (
        <ActionFormDialog
          title={`تعديل اليوم ${editDay.dayNumber}`}
          action={saveDay}
          open={!!editDayId}
          onOpenChange={(open) => !open && setEditDayId(null)}
        >
          <input type="hidden" name="id" value={editDay.id} />
          <input type="hidden" name="programId" value={programId} />
          <Field label={ar.fields.title} name="title">
            <Input name="title" defaultValue={editDay.title} required />
          </Field>
          <Field label={ar.fields.description} name="description">
            <Textarea
              name="description"
              defaultValue={editDay.description ?? ""}
              rows={2}
            />
          </Field>
        </ActionFormDialog>
      )}

      {addItemDayId && (
        <ActionFormDialog
          title={ar.actions.addItem}
          action={saveItem}
          open={!!addItemDayId}
          onOpenChange={(open) => !open && setAddItemDayId(null)}
        >
          <ItemFormFields
            dayId={addItemDayId}
            areas={areas}
            attractions={attractions}
          />
        </ActionFormDialog>
      )}
    </div>
  );
}
