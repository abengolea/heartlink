"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  { code: "AR", dial: "+54", name: "Argentina" },
  { code: "MX", dial: "+52", name: "México" },
  { code: "ES", dial: "+34", name: "España" },
  { code: "CL", dial: "+56", name: "Chile" },
  { code: "CO", dial: "+57", name: "Colombia" },
  { code: "PE", dial: "+51", name: "Perú" },
  { code: "UY", dial: "+598", name: "Uruguay" },
  { code: "PY", dial: "+595", name: "Paraguay" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "VE", dial: "+58", name: "Venezuela" },
  { code: "BR", dial: "+55", name: "Brasil" },
  { code: "US", dial: "+1", name: "Estados Unidos" },
];

function parsePhone(value: string): { countryCode: string; numberPart: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { countryCode: "+54", numberPart: "" };
  for (const c of COUNTRIES) {
    if (c.dial && trimmed.startsWith(c.dial)) {
      const rest = trimmed.slice(c.dial.length).replace(/^\s+/, "");
      return { countryCode: c.dial, numberPart: rest };
    }
  }
  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) return { countryCode: match[1], numberPart: match[2] || "" };
  }
  return { countryCode: "+54", numberPart: trimmed };
}

function buildFullPhone(countryCode: string, numberPart: string): string {
  const num = (numberPart ?? "").trim();
  if (!num) return "";
  if (!countryCode) return num;
  return `${countryCode} ${num}`;
}

interface PhoneInputWithCountryProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Para formularios con action: incluye input hidden con este name */
  name?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInputWithCountry({
  value = "",
  onChange,
  name,
  placeholder = "9 336 451-3355",
  id = "phone",
  required,
  disabled,
}: PhoneInputWithCountryProps) {
  const [internalValue, setInternalValue] = useState(value);
  useEffect(() => {
    if (onChange === undefined && value !== undefined) setInternalValue(value);
  }, [value, onChange]);
  const effectiveValue = onChange !== undefined ? value : internalValue;
  const { countryCode, numberPart } = parsePhone(effectiveValue);
  const currentCountry = COUNTRIES.find((c) => c.dial === countryCode) ?? COUNTRIES[0];
  const fullPhone = buildFullPhone(countryCode || "+54", numberPart);

  const handleCountryChange = (dial: string) => {
    const full = buildFullPhone(dial, numberPart);
    onChange?.(full);
    setInternalValue(full);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const full = buildFullPhone(countryCode || "+54", e.target.value);
    onChange?.(full);
    setInternalValue(full);
  };

  return (
    <div className="flex gap-2">
      {name && <input type="hidden" name={name} value={fullPhone} />}
      <Select
        value={currentCountry.dial}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px] shrink-0">
          <SelectValue placeholder="País" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.dial}>
              {c.name} ({c.dial})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        value={numberPart}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
