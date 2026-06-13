import { NativeSelect } from "@/components/shared/native-select";
import { ar } from "@/lib/i18n/ar";

export type AreaOption = {
  id: string;
  name: string;
  parentId: string | null;
  destinationName: string;
};

// A <select> of areas grouped by destination, with child areas lightly
// indented. Used to pin drivers/providers/transfers to the geographic tree.
export function AreaSelect({
  name,
  id,
  areas,
  defaultValue,
  noneLabel,
}: {
  name: string;
  id?: string;
  areas: AreaOption[];
  defaultValue?: string | null;
  noneLabel?: string;
}) {
  const groups = new Map<string, AreaOption[]>();
  for (const a of areas) {
    const list = groups.get(a.destinationName);
    if (list) list.push(a);
    else groups.set(a.destinationName, [a]);
  }

  return (
    <NativeSelect id={id} name={name} defaultValue={defaultValue ?? ""}>
      <option value="">{noneLabel ?? ar.misc.none}</option>
      {[...groups].map(([destination, items]) => (
        <optgroup key={destination} label={destination}>
          {items.map((a) => (
            <option key={a.id} value={a.id}>
              {a.parentId ? "— " : ""}
              {a.name}
            </option>
          ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
