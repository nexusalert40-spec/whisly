import { useMemo } from "react";
import { Globe } from "lucide-react";
import { countryOptions } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountrySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
}) {
  const options = useMemo(() => countryOptions(), []);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">Country</span>
      <span
        className={cn(
          "flex items-center gap-3 rounded-full border bg-muted/60 px-4",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Globe className="size-5 text-secondary-foreground" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none"
        >
          <option value="">Select your country</option>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
      </span>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
