"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dibuja el PDF en un <canvas> con pdf.js.
 * Es la única forma de mostrarlo en el celular: Chrome de Android
 * no renderiza PDFs dentro de un <iframe>.
 */

type ModuloPdfjs = typeof import("pdfjs-dist");
type TareaCarga = ReturnType<ModuloPdfjs["getDocument"]>;
type Documento = Awaited<TareaCarga["promise"]>;
type Hoja = Awaited<ReturnType<Documento["getPage"]>>;
type TareaRender = ReturnType<Hoja["render"]>;

let modulo: Promise<ModuloPdfjs> | null = null;

function cargarPdfjs(): Promise<ModuloPdfjs> {
  if (!modulo) {
    modulo = import("pdfjs-dist").then((mod) => {
      // `workerSrc` y no `workerPort`: con un worker compartido, destruir una
      // carga lo mata para todas las siguientes ("the worker is being destroyed").
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return mod;
    });
  }
  return modulo;
}

export default function VistaPdf({
  blob,
  className = "",
}: {
  blob: Blob | null;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [fallo, setFallo] = useState(false);
  const [dibujado, setDibujado] = useState(false);

  // El ancho disponible manda: el PDF siempre entra a lo ancho de la pantalla.
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(Math.floor(entrada.contentRect.width));
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (!blob || ancho <= 0) return;
    let cancelado = false;
    let carga: TareaCarga | null = null;
    let render: TareaRender | null = null;

    (async () => {
      try {
        const pdfjs = await cargarPdfjs();
        const datos = await blob.arrayBuffer();
        if (cancelado) return;

        carga = pdfjs.getDocument({ data: datos });
        const documento = await carga.promise;
        if (cancelado) return;

        setPaginas(documento.numPages);
        const hoja = await documento.getPage(Math.min(Math.max(pagina, 1), documento.numPages));
        if (cancelado) return;

        const base = hoja.getViewport({ scale: 1 });
        const nitidez = Math.min(window.devicePixelRatio || 1, 2);
        const vista = hoja.getViewport({ scale: (ancho / base.width) * nitidez });

        const canvas = lienzo.current;
        if (!canvas) return;
        canvas.width = Math.floor(vista.width);
        canvas.height = Math.floor(vista.height);

        render = hoja.render({ canvas, viewport: vista });
        await render.promise;
        if (!cancelado) {
          setFallo(false);
          setDibujado(true);
        }
      } catch (error) {
        // `cancel()` rechaza la promesa a propósito cuando llega un PDF nuevo.
        if (!cancelado) {
          console.error(error);
          setFallo(true);
        }
      }
    })();

    return () => {
      cancelado = true;
      render?.cancel();
      void carga?.destroy();
    };
  }, [blob, ancho, pagina]);

  return (
    <div className={`flex min-h-0 flex-col gap-2 ${className}`}>
      <div
        ref={contenedor}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl bg-slate-200/70 p-2 sm:p-3"
      >
        {/* El canvas nunca se desmonta: pdf.js necesita la referencia. */}
        <canvas
          ref={lienzo}
          className={`mx-auto block h-auto w-full rounded-lg bg-white shadow-md ${
            dibujado && !fallo ? "" : "hidden"
          }`}
        />
        {!dibujado || fallo ? (
          <p className="px-4 py-16 text-center text-sm text-slate-500">
            {fallo
              ? "No se pudo dibujar la vista previa. El PDF igual se descarga bien."
              : "Generando vista previa…"}
          </p>
        ) : null}
      </div>

      {paginas > 1 ? (
        <div className="flex shrink-0 items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 disabled:opacity-40 sm:min-h-9 sm:min-w-9"
          >
            ‹
          </button>
          <span className="tabular-nums text-slate-600">
            Página {Math.min(pagina, paginas)} de {paginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
            disabled={pagina >= paginas}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 text-lg text-slate-700 disabled:opacity-40 sm:min-h-9 sm:min-w-9"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
