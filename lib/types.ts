export type Emisor = {
  razonSocial: string;
  direccion: string;
  localidad: string;
  telefono: string;
  administracion: string;
  email: string;
  web: string;
  rubro: string;
  cuit: string;
  iibb: string;
  inicioActividades: string;
  condicionIva: string;
  logo: string | null; // dataURL
};

export type Cliente = {
  razonSocial: string;
  direccion: string;
  localidad: string;
  cuit: string;
  telefono: string;
  condicionIva: string;
};

export type Item = {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

export type Remito = {
  letra: string;
  puntoVenta: string;
  numero: string;
  fecha: string; // yyyy-mm-dd
  formaPago: string;
  vendedor: string;
  observaciones: string;
  mostrarPrecios: boolean;
  descuento: number; // %
  emisor: Emisor;
  cliente: Cliente;
  items: Item[];
};

/** Nombre que se imprime mientras el emisor no cargó su razón social. */
export const EMPRESA_SIN_CARGAR = "Nombre de la empresa";

/**
 * La primera versión venía con datos de demo precargados. Si el navegador
 * todavía los tiene guardados, arrancamos en blanco en vez de imprimirlos.
 */
export const EMISOR_DEMO = "Agua Marina S.R.L.";

export const EMISOR_INICIAL: Emisor = {
  razonSocial: "",
  direccion: "",
  localidad: "",
  telefono: "",
  administracion: "",
  email: "",
  web: "",
  rubro: "",
  cuit: "",
  iibb: "",
  inicioActividades: "",
  condicionIva: "",
  logo: null,
};

export const CLIENTE_VACIO: Cliente = {
  razonSocial: "",
  direccion: "",
  localidad: "",
  cuit: "",
  telefono: "",
  condicionIva: "",
};

/** Artículo recordado de remitos anteriores, para autocompletar. */
export type ArticuloGuardado = {
  descripcion: string;
  precioUnitario: number;
};

export const nuevoItem = (): Item => ({
  id: Math.random().toString(36).slice(2, 10),
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
});
