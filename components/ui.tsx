"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { parsearNumero } from "@/lib/format";

/**
 * En el celular los inputs van a 16px: cualquier tamaño menor hace que
 * Safari haga zoom solo al enfocarlos. Y alto mínimo de 44px para el dedo.
 */
export const claseInput =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:min-h-0 sm:rounded-md sm:px-2.5 sm:py-1.5 sm:text-sm";

export function Seccion({
  titulo,
  resumen,
  acciones,
  children,
  abierta: abiertaInicial = true,
  insignia,
}: {
  titulo: string;
  resumen?: string;
  acciones?: ReactNode;
  children: ReactNode;
  abierta?: boolean;
  insignia?: string | number;
}) {
  const [abierta, setAbierta] = useState(abiertaInicial);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          className="flex min-h-11 flex-1 items-center gap-2 text-left sm:min-h-0"
        >
          <span
            aria-hidden
            className={`text-slate-400 transition-transform ${abierta ? "rotate-90" : ""}`}
          >
            ›
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{titulo}</span>
              {insignia !== undefined ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {insignia}
                </span>
              ) : null}
            </span>
            {!abierta && resumen ? (
              <span className="mt-0.5 block truncate text-xs text-slate-500">{resumen}</span>
            ) : null}
          </span>
        </button>
        {abierta ? acciones : null}
      </div>

      {abierta ? <div className="px-3 pb-3 sm:px-4 sm:pb-4">{children}</div> : null}
    </section>
  );
}

export function Campo({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  ancho = "",
  lista,
  autoCompletar,
  teclaEnter = "next",
  onEnter,
  aviso,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  ancho?: string;
  lista?: string;
  autoCompletar?: string;
  teclaEnter?: "next" | "done" | "go";
  onEnter?: () => void;
  /** Nota corta debajo del campo, para avisar que falta completarlo. */
  aviso?: string;
}) {
  return (
    <label className={`block ${ancho}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={tipo}
        className={`${claseInput} ${aviso ? "border-amber-400 focus:border-amber-500" : ""}`}
        value={valor}
        placeholder={placeholder}
        list={lista}
        autoComplete={autoCompletar}
        enterKeyHint={teclaEnter}
        inputMode={tipo === "tel" ? "tel" : undefined}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
      {aviso ? <span className="mt-1 block text-xs text-amber-600">{aviso}</span> : null}
    </label>
  );
}

export function AreaTexto({
  label,
  valor,
  onChange,
  placeholder,
  filas = 3,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  filas?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <textarea
        rows={filas}
        className={`${claseInput} resize-y`}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/**
 * Input numérico que conserva lo que el usuario tipea (coma, punto, vacío)
 * y avisa hacia afuera con el número ya parseado.
 */
export function CampoNumero({
  valor,
  onChange,
  placeholder,
  alineado = "right",
  onEnter,
  aria,
  className = "",
}: {
  valor: number;
  onChange: (n: number) => void;
  placeholder?: string;
  alineado?: "left" | "right";
  onEnter?: () => void;
  aria?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(() => (valor ? String(valor).replace(".", ",") : ""));
  const propio = useRef(valor);

  useEffect(() => {
    if (valor !== propio.current) {
      propio.current = valor;
      setTexto(valor ? String(valor).replace(".", ",") : "");
    }
  }, [valor]);

  return (
    <input
      aria-label={aria}
      inputMode="decimal"
      enterKeyHint={onEnter ? "next" : "done"}
      className={`${claseInput} tabular-nums ${alineado === "right" ? "text-right" : ""} ${className}`}
      value={texto}
      placeholder={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const t = e.target.value;
        setTexto(t);
        const n = parsearNumero(t);
        propio.current = n;
        onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );
}

export function Boton({
  children,
  onClick,
  variante = "secundario",
  tipo = "button",
  deshabilitado,
  ancho,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "fantasma" | "peligro";
  tipo?: "button" | "submit";
  deshabilitado?: boolean;
  ancho?: string;
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition select-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:rounded-md sm:px-3";
  const variantes = {
    primario: "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700",
    secundario:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    fantasma: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    peligro: "text-red-600 hover:bg-red-50",
  } as const;
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={deshabilitado}
      className={`${base} ${variantes[variante]} ${ancho ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Interruptor({
  label,
  activo,
  onChange,
}: {
  label: string;
  activo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-sm text-slate-700 sm:min-h-0">
      <input
        type="checkbox"
        checked={activo}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 sm:h-4 sm:w-4"
      />
      {label}
    </label>
  );
}
