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

/** Lista ampliada de países, Argentina primero por defecto para operadores */
const COUNTRIES = [
  { code: "AR", dial: "+54", name: "Argentina" },
  { code: "UY", dial: "+598", name: "Uruguay" },
  { code: "PY", dial: "+595", name: "Paraguay" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "CL", dial: "+56", name: "Chile" },
  { code: "BR", dial: "+55", name: "Brasil" },
  { code: "PE", dial: "+51", name: "Perú" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "CO", dial: "+57", name: "Colombia" },
  { code: "VE", dial: "+58", name: "Venezuela" },
  { code: "MX", dial: "+52", name: "México" },
  { code: "ES", dial: "+34", name: "España" },
  { code: "US", dial: "+1", name: "Estados Unidos" },
  { code: "CR", dial: "+506", name: "Costa Rica" },
  { code: "PA", dial: "+507", name: "Panamá" },
  { code: "CU", dial: "+53", name: "Cuba" },
  { code: "IT", dial: "+39", name: "Italia" },
  { code: "DE", dial: "+49", name: "Alemania" },
  { code: "FR", dial: "+33", name: "Francia" },
  { code: "GB", dial: "+44", name: "Reino Unido" },
];

function parsePhone(value: string): { countryCode: string; numberPart: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { countryCode: "+54", numberPart: "" };
  for (const c of COUNTRIES) {
    if (c.dial && trimmed.startsWith(c.dial)) {
      const rest = trimmed.slice(c.dial.length).replace(/^\s+/, "").replace(/\D/g, "");
      return { countryCode: c.dial, numberPart: rest };
    }
    const dialDigits = (c.dial ?? "").replace(/\D/g, "");
    if (dialDigits && /^\d+$/.test(trimmed) && trimmed.startsWith(dialDigits) && trimmed.length > dialDigits.length) {
      let rest = trimmed.slice(dialDigits.length);
      if (c.dial === "+54" && rest.length === 12 && rest.startsWith("54")) {
        rest = rest.slice(2);
      }
      return { countryCode: c.dial, numberPart: rest };
    }
  }
  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) return { countryCode: match[1], numberPart: (match[2] || "").replace(/\D/g, "") };
  }
  return { countryCode: "+54", numberPart: trimmed.replace(/\D/g, "") };
}

/**
 * Construye el número completo para guardar.
 * NO agregamos el 9 automáticamente (causaba que no llegaran mensajes de WhatsApp).
 */
function buildFullPhone(countryCode: string, numberPart: string): string {
  const raw = (numberPart ?? "").trim();
  if (!raw) return "";
  if (!countryCode) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return `${countryCode.replace(/\D/g, "")}${digits}`;
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

/** Placeholder para Argentina: ingresa solo código de área + número (sin el 9) */
const PLACEHOLDER_AR = "336 451-3355";

export function PhoneInputWithCountry({
  value = "",
  onChange,
  name,
  placeholder,
  id = "phone",
  required,
  disabled,
}: PhoneInputWithCountryProps) {
  const effectivePlaceholder = placeholder ?? PLACEHOLDER_AR;
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
        placeholder={effectivePlaceholder}
        required={required}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
