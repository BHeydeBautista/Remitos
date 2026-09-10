"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaTexto,
  Boton,
  Campo,
  CampoNumero,
  claseInput,
  Interruptor,
  Seccion,
} from "@/components/ui";
import { HojaPdf, PanelPdf } from "@/components/PanelPdf";
import {
  compartirPdf,
  descargarPdf,
  nombreDeArchivo,
  puedeCompartir,
  usePdfRemito,
} from "@/components/pdfRemito";
import { calcularTotales, totalDeItem } from "@/lib/calculos";
import { fechaLarga, hoyISO, moneda, numeroComprobante, numeroES } from "@/lib/format";
import { achicarImagen, CLAVES, escribir, leer, leerLista } from "@/lib/storage";
import {
  CLIENTE_VACIO,
  EMISOR_DEMO,
  EMISOR_INICIAL,
  EMPRESA_SIN_CARGAR,
  nuevoItem,
  type ArticuloGuardado,
  type Cliente,
  type Emisor,
  type Item,
  type Remito,
} from "@/lib/types";

const LISTA_ARTICULOS = "articulos-usados";

/** Fila con datos cargados pero cantidad en cero: no suma nada al total. */
function sinSumar(item: Item) {
  const tieneDatos = item.descripcion.trim() !== "" || item.precioUnitario > 0;
  return tieneDatos && !(item.cantidad > 0);
}

function remitoInicial(): Remito {
  return {
    letra: "R",
    puntoVenta: "0001",
    numero: "",
    fecha: hoyISO(),
    formaPago: "Cuenta corriente",
    vendedor: "",
    observaciones: "",
    mostrarPrecios: true,
    descuento: 0,
    emisor: EMISOR_INICIAL,
    cliente: CLIENTE_VACIO,
    items: [nuevoItem()],
  };
}

function remitoGuardado(): Remito {
  const base = remitoInicial();
  const emisor = leer<Emisor>(CLAVES.emisor, base.emisor);
  if (emisor.razonSocial === EMISOR_DEMO) return base;

  const guardado = leer<Remito>(CLAVES.borrador, base);
  return {
    ...base,
    ...guardado,
    emisor: { ...base.emisor, ...emisor },
    items: guardado.items?.length ? guardado.items : base.items,
    fecha: guardado.fecha || base.fecha,
  };
}

export default function Editor() {
  const [remito, setRemito] = useState<Remito>(remitoGuardado);
  const [catalogo, setCatalogo] = useState<ArticuloGuardado[]>(() =>
    leerLista<ArticuloGuardado>(CLAVES.catalogo),
  );
  const [verHoja, setVerHoja] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string | null>(null);
  const contenedorItems = useRef<HTMLDivElement>(null);
  const enfocarUltimo = useRef(false);

  const pdf = usePdfRemito(remito);
  const nombre = nombreDeArchivo(remito);
  const comprobante = numeroComprobante(remito.puntoVenta, remito.numero);
  const compartible = puedeCompartir(pdf.blob);

  const totales = useMemo(
    () => calcularTotales(remito.items, remito.descuento),
    [remito.items, remito.descuento],
  );
  const lineasEnCero = remito.items.filter(sinSumar).length;

  /* ---- autoguardado ---- */
  useEffect(() => {
    const id = setTimeout(() => {
      escribir(CLAVES.borrador, remito);
      escribir(CLAVES.emisor, remito.emisor);
    }, 400);
    return () => clearTimeout(id);
  }, [remito]);

  /* ---- foco en el artículo recién agregado ---- */
  useEffect(() => {
    if (!enfocarUltimo.current) return;
    enfocarUltimo.current = false;
    const inputs = contenedorItems.current?.querySelectorAll<HTMLInputElement>(
      "input[data-descripcion]",
    );
    inputs?.[inputs.length - 1]?.focus();
  }, [remito.items.length]);

  const set = <K extends keyof Remito>(clave: K, valor: Remito[K]) =>
    setRemito((r) => ({ ...r, [clave]: valor }));

  const setEmisor = (clave: keyof Emisor, valor: string | null) =>
    setRemito((r) => ({ ...r, emisor: { ...r.emisor, [clave]: valor } }));

  const setCliente = (clave: keyof Cliente, valor: string) =>
    setRemito((r) => ({ ...r, cliente: { ...r.cliente, [clave]: valor } }));

  const setItem = (id: string, cambios: Partial<Item>) =>
    setRemito((r) => ({
      ...r,
      items: r.items.map((i) => (i.id === id ? { ...i, ...cambios } : i)),
    }));

  /** Al elegir un artículo ya usado, trae el precio de la última vez. */
  const cambiarDescripcion = (item: Item, valor: string) => {
    const conocido = catalogo.find(
      (a) => a.descripcion.toLowerCase() === valor.trim().toLowerCase(),
    );
    setItem(item.id, {
      descripcion: valor,
      ...(conocido && !item.precioUnitario
        ? { precioUnitario: conocido.precioUnitario }
        : {}),
    });
  };

  const agregarItem = () => {
    enfocarUltimo.current = true;
    setRemito((r) => ({ ...r, items: [...r.items, nuevoItem()] }));
  };

  const quitarItem = (id: string) =>
    setRemito((r) => ({
      ...r,
      items: r.items.length > 1 ? r.items.filter((i) => i.id !== id) : [nuevoItem()],
    }));

  /** Guarda los artículos del remito para autocompletar los próximos. */
  const recordarArticulos = () => {
    const mapa = new Map(catalogo.map((a) => [a.descripcion.toLowerCase(), a]));
    for (const item of remito.items) {
      const descripcion = item.descripcion.trim();
      if (descripcion.length < 3 || item.precioUnitario <= 0) continue;
      mapa.set(descripcion.toLowerCase(), { descripcion, precioUnitario: item.precioUnitario });
    }
    const lista = [...mapa.values()].slice(-300);
    setCatalogo(lista);
    escribir(CLAVES.catalogo, lista);
  };

  const nuevoRemito = () => {
    recordarArticulos();
    setRemito((r) => ({
      ...r,
      numero: "",
      fecha: hoyISO(),
      cliente: CLIENTE_VACIO,
      observaciones: "",
      descuento: 0,
      items: [nuevoItem()],
    }));
    setVerHoja(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const subirLogo = async (archivo?: File | null) => {
    if (!archivo) return;
    setErrorLogo(null);
    try {
      setEmisor("logo", await achicarImagen(archivo));
    } catch (e) {
      setErrorLogo(e instanceof Error ? e.message : "No se pudo cargar el logo");
    }
  };

  const accionPrincipal = () => {
    recordarArticulos();
    if (compartible) compartirPdf(pdf.blob, nombre);
    else descargarPdf(pdf.url, nombre);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 lg:pb-0">
      <datalist id={LISTA_ARTICULOS}>
        {catalogo.map((a) => (
          <option key={a.descripcion} value={a.descripcion} />
        ))}
      </datalist>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-5 sm:py-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              Generador de remitos
            </h1>
            <p className="truncate text-[11px] sm:text-xs">
              <span className={comprobante ? "text-slate-500" : "text-amber-600"}>
                {comprobante ? `N° ${comprobante}` : "Sin número"}
              </span>
              <span className="text-slate-500"> · {fechaLarga(remito.fecha)}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-slate-500 lg:inline">
              Total:{" "}
              <strong className="text-slate-900 tabular-nums">
                $ {moneda(totales.total)}
              </strong>
            </span>
            <Boton onClick={nuevoRemito}>Nuevo</Boton>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
        <div className="flex flex-col gap-3">
          {/* ---------------- comprobante ---------------- */}
          <Seccion
            titulo="Comprobante"
            resumen={(comprobante ? "N° " + comprobante : "Sin número") + " · " + fechaLarga(remito.fecha)}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Campo
                label="Número de remito"
                valor={remito.numero}
                onChange={(v) => set("numero", v)}
                placeholder="00001844"
                aviso={comprobante ? undefined : "Cargalo vos: la app no numera sola."}
              />
              <Campo
                label="Fecha"
                tipo="date"
                valor={remito.fecha}
                onChange={(v) => set("fecha", v)}
              />
              <Campo
                label="Punto de venta"
                valor={remito.puntoVenta}
                onChange={(v) => set("puntoVenta", v)}
                placeholder="0001"
              />
              <Campo
                label="Letra"
                valor={remito.letra}
                onChange={(v) => set("letra", v.toUpperCase().slice(0, 1))}
              />
              <Campo
                label="Forma de pago"
                valor={remito.formaPago}
                onChange={(v) => set("formaPago", v)}
                placeholder="Cuenta corriente"
                ancho="col-span-2"
              />
              <Campo
                label="Atendido por"
                valor={remito.vendedor}
                onChange={(v) => set("vendedor", v)}
                placeholder="Nombre del vendedor"
                ancho="col-span-2"
                teclaEnter="done"
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-2">
              <Interruptor
                label="Mostrar precios"
                activo={remito.mostrarPrecios}
                onChange={(v) => set("mostrarPrecios", v)}
              />
            </div>
          </Seccion>

          {/* ---------------- cliente ---------------- */}
          <Seccion titulo="Cliente" resumen={remito.cliente.razonSocial || "Sin cargar"}>
            <div className="grid grid-cols-2 gap-3">
              <Campo
                label="Señor(es)"
                valor={remito.cliente.razonSocial}
                onChange={(v) => setCliente("razonSocial", v)}
                ancho="col-span-2"
                placeholder="Nombre del cliente"
                autoCompletar="off"
              />
              <Campo
                label="Dirección"
                valor={remito.cliente.direccion}
                onChange={(v) => setCliente("direccion", v)}
                ancho="col-span-2"
                autoCompletar="off"
              />
              <Campo
                label="Localidad"
                valor={remito.cliente.localidad}
                onChange={(v) => setCliente("localidad", v)}
                autoCompletar="off"
              />
              <Campo
                label="CUIT"
                valor={remito.cliente.cuit}
                onChange={(v) => setCliente("cuit", v)}
                autoCompletar="off"
              />
              <Campo
                label="Condición frente al IVA"
                valor={remito.cliente.condicionIva}
                onChange={(v) => setCliente("condicionIva", v)}
                ancho="col-span-2"
                placeholder="Responsable inscripto"
                teclaEnter="done"
                autoCompletar="off"
              />
            </div>
          </Seccion>

          {/* ---------------- artículos ---------------- */}
          <Seccion
            titulo="Artículos"
            insignia={remito.items.filter((i) => i.descripcion.trim()).length}
            acciones={
              <Boton variante="secundario" onClick={agregarItem}>
                + Agregar
              </Boton>
            }
          >
            <div className="mb-1 hidden gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[1.75rem_minmax(0,1fr)_72px_110px_110px_2.5rem]">
              <span />
              <span>Descripción</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">P. unitario</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div ref={contenedorItems} className="flex flex-col gap-2">
              {remito.items.map((item, indice) => (
                <div
                  key={item.id}
                  data-fila
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:grid-cols-[1.75rem_minmax(0,1fr)_72px_110px_110px_2.5rem] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <span className="text-center text-xs font-medium text-slate-400 tabular-nums">
                    {indice + 1}
                  </span>

                  <input
                    data-descripcion
                    list={LISTA_ARTICULOS}
                    autoComplete="off"
                    enterKeyHint="next"
                    className={claseInput}
                    placeholder="Descripción del artículo"
                    value={item.descripcion}
                    onChange={(e) => cambiarDescripcion(item, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      e.currentTarget
                        .closest("[data-fila]")
                        ?.querySelector<HTMLInputElement>('[aria-label="Precio unitario"]')
                        ?.focus();
                    }}
                  />

                  <div className="col-span-3 row-start-2 flex items-end gap-2 sm:contents">
                    <label className="w-20 shrink-0 sm:w-auto">
                      <span className="mb-1 block text-[11px] font-medium text-slate-500 sm:hidden">
                        Cant.
                      </span>
                      <CampoNumero
                        aria="Cantidad"
                        valor={item.cantidad}
                        onChange={(n) => setItem(item.id, { cantidad: n })}
                        placeholder="1"
                        alVaciar={1}
                        resaltado={sinSumar(item)}
                        puntoDecimal
                        decimales={3}
                      />
                    </label>
                    <span className="shrink-0 pb-3 text-sm text-slate-400 sm:hidden">×</span>
                    <label className="min-w-0 flex-1 sm:w-auto">
                      <span className="mb-1 block text-[11px] font-medium text-slate-500 sm:hidden">
                        Precio unit.
                      </span>
                      <CampoNumero
                        aria="Precio unitario"
                        valor={item.precioUnitario}
                        onChange={(n) => setItem(item.id, { precioUnitario: n })}
                        placeholder="0,00"
                        onEnter={agregarItem}
                      />
                    </label>
                    <div className="w-[92px] shrink-0 sm:w-auto">
                      <span className="mb-1 block text-right text-[11px] font-medium text-slate-500 sm:hidden">
                        Total
                      </span>
                      <div className="flex min-h-11 items-center justify-end rounded-lg bg-slate-100 px-2.5 text-sm font-medium tabular-nums text-slate-700 sm:min-h-9 sm:rounded-md">
                        {moneda(totalDeItem(item))}
                      </div>
                    </div>
                  </div>

                  {sinSumar(item) ? (
                    <p className="col-span-3 -mt-1 text-xs text-amber-600 sm:col-span-6">
                      Sin cantidad, esta línea suma $ 0.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => quitarItem(item.id)}
                    aria-label={`Quitar artículo ${indice + 1}`}
                    className="col-start-3 row-start-1 flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-slate-400 transition active:bg-red-50 active:text-red-600 sm:col-start-auto sm:row-start-auto sm:h-9 sm:w-9 sm:hover:bg-red-50 sm:hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Boton variante="secundario" onClick={agregarItem} ancho="mt-3 w-full sm:hidden">
              + Agregar artículo
            </Boton>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">
                {numeroES(totales.unidades, 3)} {totales.unidades === 1 ? "unidad" : "unidades"}
              </span>
              <span className="text-base font-semibold tabular-nums">
                $ {moneda(totales.total)}
              </span>
            </div>
          </Seccion>

          {/* ---------------- cierre ---------------- */}
          <Seccion
            titulo="Descuento y observaciones"
            abierta={false}
            resumen={
              remito.descuento > 0
                ? `Descuento ${remito.descuento}%`
                : remito.observaciones || "Sin observaciones"
            }
          >
            <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Descuento (%)
                </span>
                <CampoNumero
                  valor={remito.descuento}
                  onChange={(n) => set("descuento", n)}
                  placeholder="0"
                />
              </label>
              <AreaTexto
                label="Observaciones"
                valor={remito.observaciones}
                onChange={(v) => set("observaciones", v)}
                placeholder="Entrega en portería, mercadería sujeta a control…"
              />
            </div>

            {remito.descuento > 0 ? (
              <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="tabular-nums">$ {moneda(totales.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Descuento ({remito.descuento}%)</dt>
                  <dd className="tabular-nums text-red-600">
                    - $ {moneda(totales.montoDescuento)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </Seccion>

          {/* ---------------- empresa ---------------- */}
          <Seccion
            titulo="Datos de la empresa"
            abierta={!remito.emisor.razonSocial}
            resumen={`${remito.emisor.razonSocial || "Sin cargar"} · se guardan en este celular`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                label="Razón social"
                valor={remito.emisor.razonSocial}
                onChange={(v) => setEmisor("razonSocial", v)}
                ancho="sm:col-span-2"
                placeholder={EMPRESA_SIN_CARGAR}
                aviso={
                  remito.emisor.razonSocial ? undefined : "Sin esto el remito sale sin membrete."
                }
              />
              <Campo
                label="Rubro / bajada"
                valor={remito.emisor.rubro}
                onChange={(v) => setEmisor("rubro", v)}
                ancho="sm:col-span-2"
                placeholder="Productos de limpieza para empresas y el hogar"
              />
              <Campo
                label="Dirección"
                valor={remito.emisor.direccion}
                onChange={(v) => setEmisor("direccion", v)}
              />
              <Campo
                label="Localidad"
                valor={remito.emisor.localidad}
                onChange={(v) => setEmisor("localidad", v)}
              />
              <Campo
                label="Teléfono"
                tipo="tel"
                valor={remito.emisor.telefono}
                onChange={(v) => setEmisor("telefono", v)}
              />
              <Campo
                label="Administración"
                tipo="tel"
                valor={remito.emisor.administracion}
                onChange={(v) => setEmisor("administracion", v)}
              />
              <Campo
                label="Email"
                valor={remito.emisor.email}
                onChange={(v) => setEmisor("email", v)}
              />
              <Campo
                label="Web / redes"
                valor={remito.emisor.web}
                onChange={(v) => setEmisor("web", v)}
              />
              <Campo
                label="CUIT"
                valor={remito.emisor.cuit}
                onChange={(v) => setEmisor("cuit", v)}
                placeholder="30-12345678-9"
              />
              <Campo
                label="Ingresos Brutos"
                valor={remito.emisor.iibb}
                onChange={(v) => setEmisor("iibb", v)}
              />
              <Campo
                label="Condición frente al IVA"
                valor={remito.emisor.condicionIva}
                onChange={(v) => setEmisor("condicionIva", v)}
              />
              <Campo
                label="Inicio de actividades"
                valor={remito.emisor.inicioActividades}
                onChange={(v) => setEmisor("inicioActividades", v)}
                placeholder="01/2015"
                teclaEnter="done"
              />

              <div className="sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">Logo</span>
                <div className="flex flex-wrap items-center gap-3">
                  {remito.emisor.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={remito.emisor.logo}
                      alt="Logo cargado"
                      className="h-12 w-auto rounded border border-slate-200 bg-white object-contain p-1"
                    />
                  ) : null}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => subirLogo(e.target.files?.[0])}
                    className="text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:text-sm file:text-white"
                  />
                  {remito.emisor.logo ? (
                    <Boton variante="peligro" onClick={() => setEmisor("logo", null)}>
                      Quitar
                    </Boton>
                  ) : null}
                </div>
                {errorLogo ? <p className="mt-1 text-xs text-red-600">{errorLogo}</p> : null}
              </div>
            </div>
          </Seccion>
        </div>

        {/* ---------------- vista previa (escritorio) ---------------- */}
        <div className="hidden lg:sticky lg:top-[76px] lg:block lg:h-[calc(100vh-96px)]">
          <PanelPdf instancia={pdf} nombre={nombre} onUsar={recordarArticulos} />
        </div>
      </main>

      {/* ---------------- barra de acciones (celular) ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {lineasEnCero > 0 ? (
          <p className="mb-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
            {lineasEnCero === 1
              ? "Hay 1 artículo sin cantidad: no suma al total."
              : `Hay ${lineasEnCero} artículos sin cantidad: no suman al total.`}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-none text-slate-500">Total</p>
            <p className="truncate text-lg font-semibold leading-tight tabular-nums">
              $ {moneda(totales.total)}
            </p>
          </div>
          <Boton onClick={() => setVerHoja(true)}>Ver PDF</Boton>
          <Boton variante="primario" onClick={accionPrincipal} deshabilitado={!pdf.url}>
            {compartible ? "Compartir" : "Descargar"}
          </Boton>
        </div>
      </div>

      {verHoja ? (
        <HojaPdf
          instancia={pdf}
          nombre={nombre}
          onCerrar={() => setVerHoja(false)}
          onUsar={recordarArticulos}
        />
      ) : null}
    </div>
  );
}
