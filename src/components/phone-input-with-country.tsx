"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyArgentinaNationalMobileNine, toDigits } from "@/lib/phone-format";

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
 * Argentina: antepone 54 desde el selector y agrega el 9 móvil si falta (área + número).
 */
function buildFullPhone(countryCode: string, numberPart: string): string {
  const raw = (numberPart ?? "").trim();
  if (!raw) return "";
  if (!countryCode) return raw;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cc = countryCode.replace(/\D/g, "");
  if (cc === "54") {
    digits = applyArgentinaNationalMobileNine(digits);
  }
  return `${cc}${digits}`;
}

/**
 * Si el usuario pega el número completo sin "+", quita el prefijo del país
 * para no duplicar 54 y "llenar" el campo antes de tiempo.
 */
function stripDialCodeFromNationalDigits(countryDial: string, typed: string): string {
  let d = typed.replace(/\D/g, "");
  const cc = countryDial.replace(/\D/g, "");
  if (!cc || d.length <= cc.length) return d;
  if (d.startsWith(cc)) {
    d = d.slice(cc.length);
  }
  return d;
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

/** Argentina: solo área + número; el 9 móvil y el 54 se completan solos. */
const PLACEHOLDER_AR = "341 203-3382";

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (onChange === undefined && value !== undefined) setInternalValue(value);
  }, [value, onChange]);
  const effectiveValue = onChange !== undefined ? value : internalValue;
  const { countryCode, numberPart } = parsePhone(effectiveValue);
  const currentCountry = COUNTRIES.find((c) => c.dial === countryCode) ?? COUNTRIES[0];
  const fullPhone = buildFullPhone(countryCode || "+54", numberPart);

  /** Migra números AR viejos (54 sin 9) al formato WhatsApp 549… al abrir el formulario. */
  useEffect(() => {
    const cb = onChangeRef.current;
    if (!cb) return;
    const trimmed = (effectiveValue ?? "").trim();
    if (!trimmed) return;
    const { countryCode: ccParsed, numberPart: npParsed } = parsePhone(trimmed);
    if (ccParsed.replace(/\D/g, "") !== "54") return;
    const normalized = buildFullPhone(ccParsed, npParsed);
    if (!normalized || toDigits(trimmed) === normalized) return;
    cb(normalized);
  }, [effectiveValue]);

  const handleCountryChange = (dial: string) => {
    const full = buildFullPhone(dial, numberPart);
    onChange?.(full);
    setInternalValue(full);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const national = stripDialCodeFromNationalDigits(
      countryCode || "+54",
      e.target.value
    );
    const full = buildFullPhone(countryCode || "+54", national);
    onChange?.(full);
    setInternalValue(full);
  };

  return (
    <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:gap-2">
      {name && <input type="hidden" name={name} value={fullPhone} />}
      <Select
        value={currentCountry.dial}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full shrink-0 sm:w-[140px]">
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
        className="flex-1 min-w-0"
        autoComplete="tel-national"
      />
    </div>
  );
}
