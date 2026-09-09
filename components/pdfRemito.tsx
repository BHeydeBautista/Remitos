"use client";

import { useEffect } from "react";
import { usePDF } from "@react-pdf/renderer";
import RemitoDocument from "./RemitoDocument";
import type { Remito } from "@/lib/types";
import { numeroComprobante } from "@/lib/format";

/** Regenera el PDF con un retardo, para no recalcular en cada tecla. */
export function usePdfRemito(remito: Remito) {
  const [instancia, actualizar] = usePDF({ document: <RemitoDocument remito={remito} /> });

  useEffect(() => {
    const id = setTimeout(() => actualizar(<RemitoDocument remito={remito} />), 700);
    return () => clearTimeout(id);
  }, [remito, actualizar]);

  return instancia;
}

export function nombreDeArchivo(remito: Remito) {
  const partes = [
    "Remito",
    numeroComprobante(remito.puntoVenta, remito.numero),
    remito.cliente.razonSocial.trim(),
  ].filter(Boolean);
  const base = partes.length > 1 ? partes.join(" - ").replace("Remito - ", "Remito ") : "Remito";
  return `${base.replace(/[\\/:*?"<>|]/g, "-").slice(0, 90)}.pdf`;
}

export function descargarPdf(url: string | null, nombre: string) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function abrirPdf(url: string | null) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** ¿El navegador puede compartir archivos? (Android/iOS: WhatsApp, mail, etc.) */
export function puedeCompartir(blob: Blob | null) {
  if (!blob || typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([blob], "remito.pdf", { type: "application/pdf" })],
    });
  } catch {
    return false;
  }
}

export async function compartirPdf(blob: Blob | null, nombre: string) {
  if (!blob) return;
  const archivo = new File([blob], nombre, { type: "application/pdf" });
  try {
    await navigator.share({ files: [archivo], title: nombre });
  } catch (error) {
    // El usuario canceló el diálogo: no es un error que valga la pena mostrar.
    if ((error as Error)?.name !== "AbortError") console.error(error);
  }
}
