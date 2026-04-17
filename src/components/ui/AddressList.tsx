import AddressAutocomplete from "./AddressAutocomplete";
import type { LatLng } from "./MapPicker";

export type AddressEntry = {
  id: string;
  text: string;
  location: LatLng | null;
};

type Props = {
  items: AddressEntry[];
  onChange: (id: string, text: string) => void;
  onSelect: (id: string, location: LatLng) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  placeholder?: string;
  addLabel?: string;
};

export default function AddressList({
  items,
  onChange,
  onSelect,
  onAdd,
  onRemove,
  placeholder,
  addLabel = "Добавить адрес",
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <AddressAutocomplete
            value={item.text}
            onChange={(v) => onChange(item.id, v)}
            onSelect={(r) => onSelect(item.id, { lat: r.lat, lng: r.lng })}
            placeholder={placeholder}
            className="flex-1 max-w-full lg:max-w-[488px]"
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Удалить адрес"
            className="shrink-0 size-10 rounded-[8px] border border-neutral-300 bg-white flex items-center justify-center hover:bg-neutral-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-600">
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="self-start flex items-center gap-2 font-body text-base text-cta-main hover:opacity-80"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.5v7M6.5 10h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-semibold">{addLabel}</span>
      </button>
    </div>
  );
}
