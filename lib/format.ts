const UNIDADES = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];

const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

function decenasEnLetras(n: number): string {
  if (n < 30) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function centenasEnLetras(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes = [CENTENAS[c], decenasEnLetras(r)].filter(Boolean);
  return partes.join(" ");
}

/** "veintiuno" -> "veintiún", "treinta y uno" -> "treinta y un" */
function apocopar(texto: string): string {
  if (texto === "uno") return "un";
  if (texto.endsWith("veintiuno")) return `${texto.slice(0, -9)}veintiún`;
  if (texto.endsWith(" uno")) return `${texto.slice(0, -4)} un`;
  return texto;
}

/** Convierte un entero (0 – 999.999.999) a palabras en castellano. */
export function enteroEnLetras(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "cero";

  const millones = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const miles = Math.floor(resto / 1000);
  const cientos = resto % 1000;

  const partes: string[] = [];

  if (millones === 1) partes.push("un millón");
  else if (millones > 1) partes.push(`${apocopar(enteroEnLetras(millones))} millones`);

  if (miles === 1) partes.push("mil");
  else if (miles > 1) partes.push(`${apocopar(centenasEnLetras(miles))} mil`);

  if (cientos > 0) partes.push(centenasEnLetras(cientos));

  return partes.join(" ");
}

/** 63600.05 -> "sesenta y tres mil seiscientos con 05/100" */
export function montoEnLetras(monto: number): string {
  const valor = Math.max(0, Math.round((Number(monto) || 0) * 100) / 100);
  const entero = Math.floor(valor);
  const centavos = Math.round((valor - entero) * 100);
  return `${enteroEnLetras(entero)} con ${String(centavos).padStart(2, "0")}/100`;
}

const NUMERO = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 63600.05 -> "63.600,05" */
export function moneda(n: number): string {
  return NUMERO.format(Number.isFinite(n) ? n : 0);
}

/** "2026-08-21" -> "21/08/2026" */
export function fechaLarga(iso: string): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** 1844 -> "0001-00001844". Vacío si todavía no cargaron el número. */
export function numeroComprobante(puntoVenta: string, numero: string): string {
  const digitos = (numero || "").replace(/\D/g, "");
  if (!digitos) return "";
  const pv = (puntoVenta || "").replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `${pv}-${digitos.padStart(8, "0").slice(-8)}`;
}

/**
 * Acepta "5.100,50", "5100,50", "5100.5" o "5.100" y devuelve un número.
 *
 * Con un solo punto y sin coma el texto es ambiguo: "11.985" son once mil
 * novecientos ochenta y cinco para un precio, pero 11,985 kg para una cantidad.
 * `puntoDecimal` decide de qué lado cae, y lo elige cada campo.
 */
export function parsearNumero(texto: string, puntoDecimal = false): number {
  if (!texto) return 0;
  let limpio = texto.replace(/[^0-9.,-]/g, "");
  const tieneComa = limpio.includes(",");
  const tienePunto = limpio.includes(".");

  if (tieneComa && tienePunto) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (tieneComa) {
    limpio = limpio.replace(",", ".");
  } else if (tienePunto) {
    const partes = limpio.split(".");
    if (puntoDecimal) {
      limpio = `${partes.shift()}.${partes.join("")}`;
    } else {
      // "1.234" o "1.234.567" son miles; "1.5" o "1.50" son decimales.
      const ultima = partes[partes.length - 1];
      if (partes.length > 2 || ultima.length === 3) limpio = partes.join("");
    }
  }

  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : 0;
}

/** Formatea un número con la convención de acá: 11985 -> "11.985", 11.985 -> "11,985". */
export function numeroES(n: number, decimales = 2): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: decimales }).format(
    Number.isFinite(n) ? n : 0,
  );
}
