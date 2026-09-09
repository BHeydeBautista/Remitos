"use client";

import dynamic from "next/dynamic";

// El editor vive sólo en el navegador: usa localStorage y genera el PDF del lado del cliente.
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
      Cargando el generador…
    </div>
  ),
});

export default function Pagina() {
  return <Editor />;
}
