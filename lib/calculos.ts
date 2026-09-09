import type { Item } from "./types";

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function totalDeItem(item: Item): number {
  return redondear((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0));
}

export function calcularTotales(items: Item[], descuento: number) {
  const subtotal = redondear(items.reduce((acc, i) => acc + totalDeItem(i), 0));
  const montoDescuento = redondear((subtotal * (Number(descuento) || 0)) / 100);
  const total = redondear(subtotal - montoDescuento);
  const unidades = items.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
  return { subtotal, montoDescuento, total, unidades };
}
