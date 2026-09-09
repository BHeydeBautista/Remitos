export const CLAVES = {
  emisor: "remitos:emisor",
  borrador: "remitos:borrador",
  catalogo: "remitos:catalogo",
} as const;

export function leer<T>(clave: string, porDefecto: T): T {
  if (typeof window === "undefined") return porDefecto;
  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo) return porDefecto;
    return { ...porDefecto, ...(JSON.parse(crudo) as object) } as T;
  } catch {
    return porDefecto;
  }
}

export function leerLista<T>(clave: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? (datos as T[]) : [];
  } catch {
    return [];
  }
}

export function escribir(clave: string, valor: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* localStorage lleno o bloqueado: seguimos sin persistir */
  }
}

export function borrar(clave: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(clave);
  } catch {
    /* ignorado */
  }
}

/** Reduce una imagen a un dataURL chico para que entre en localStorage. */
export function achicarImagen(archivo: File, anchoMaximo = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Formato de imagen no soportado"));
      img.onload = () => {
        const escala = Math.min(1, anchoMaximo / img.width);
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        const ctx = lienzo.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        resolve(lienzo.toDataURL("image/png"));
      };
      img.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  });
}
