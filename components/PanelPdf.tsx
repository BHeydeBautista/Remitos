"use client";

import { useEffect } from "react";
import VistaPdf from "./VistaPdf";
import { Boton } from "./ui";
import {
  abrirPdf,
  compartirPdf,
  descargarPdf,
  puedeCompartir,
} from "./pdfRemito";

type Instancia = {
  loading: boolean;
  blob: Blob | null;
  url: string | null;
  error: string | null;
};

function Estado({ instancia }: { instancia: Instancia }) {
  if (instancia.error) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
        error
      </span>
    );
  }
  return instancia.loading ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      actualizando…
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      al día
    </span>
  );
}

function Acciones({
  instancia,
  nombre,
  ancho = false,
  onUsar,
}: {
  instancia: Instancia;
  nombre: string;
  ancho?: boolean;
  onUsar?: () => void;
}) {
  const listo = !!instancia.url;
  const compartible = puedeCompartir(instancia.blob);

  const compartir = () => {
    onUsar?.();
    compartirPdf(instancia.blob, nombre);
  };

  const descargar = () => {
    onUsar?.();
    descargarPdf(instancia.url, nombre);
  };

  return (
    <div className={`flex gap-2 ${ancho ? "w-full [&>*]:flex-1" : ""}`}>
      {compartible ? (
        <Boton onClick={compartir} deshabilitado={!listo}>
          Compartir
        </Boton>
      ) : (
        <Boton onClick={() => abrirPdf(instancia.url)} deshabilitado={!listo}>
          Abrir
        </Boton>
      )}
      <Boton variante="primario" onClick={descargar} deshabilitado={!listo}>
        Descargar PDF
      </Boton>
    </div>
  );
}

/** Columna fija de la derecha en escritorio. */
export function PanelPdf({
  instancia,
  nombre,
  onUsar,
}: {
  instancia: Instancia;
  nombre: string;
  onUsar?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Vista previa</h2>
          <Estado instancia={instancia} />
        </div>
        <Acciones instancia={instancia} nombre={nombre} onUsar={onUsar} />
      </div>

      {instancia.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo generar el PDF: {instancia.error}
        </p>
      ) : null}

      <VistaPdf blob={instancia.blob} className="min-h-0 flex-1" />
    </div>
  );
}

/** Pantalla completa en el celular. */
export function HojaPdf({
  instancia,
  nombre,
  onCerrar,
  onUsar,
}: {
  instancia: Instancia;
  nombre: string;
  onCerrar: () => void;
  onUsar?: () => void;
}) {
  // Mientras está abierta, la página de atrás no se mueve.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 lg:hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Vista previa</h2>
          <Estado instancia={instancia} />
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar vista previa"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-500 active:bg-slate-100"
        >
          ✕
        </button>
      </header>

      <VistaPdf blob={instancia.blob} className="min-h-0 flex-1 px-2 pt-2" />

      <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Acciones instancia={instancia} nombre={nombre} onUsar={onUsar} ancho />
      </footer>
    </div>
  );
}
