"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { EMPRESA_SIN_CARGAR, type Remito } from "@/lib/types";
import { calcularTotales, totalDeItem } from "@/lib/calculos";
import { fechaLarga, moneda, montoEnLetras, numeroComprobante, numeroES } from "@/lib/format";

const TINTA = "#111111";
const GRIS = "#6b7280";
const LINEA = "#111111";
const SUAVE = "#c9ced6";
const FONDO_CABECERA = "#e9edf2";

const FILAS_MINIMAS = 12;

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 26,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: TINTA,
  },

  cabecera: { borderWidth: 1, borderColor: LINEA, flexDirection: "row" },
  cabeceraLado: { flex: 1, padding: 8, justifyContent: "center" },
  cabeceraDerecha: { flex: 1, padding: 8, justifyContent: "center", alignItems: "flex-end" },
  cabeceraCentro: {
    width: 58,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: LINEA,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  letra: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: LINEA,
    alignItems: "center",
    justifyContent: "center",
  },
  letraTexto: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  codigo: { fontSize: 5.5, marginTop: 3, color: GRIS },

  logo: { maxHeight: 44, maxWidth: 150, marginBottom: 5, objectFit: "contain" },
  razonSocial: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  rubro: {
    fontSize: 6.5,
    color: GRIS,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  datoEmisor: { fontSize: 7.5, lineHeight: 1.5 },

  titulo: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 3 },
  numero: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 3 },
  datoDerecha: { fontSize: 7.5, lineHeight: 1.5, textAlign: "right" },

  aviso: { fontSize: 6, color: GRIS, textAlign: "center", marginTop: 3, letterSpacing: 0.8 },

  cliente: {
    borderWidth: 1,
    borderColor: LINEA,
    marginTop: 5,
    flexDirection: "row",
    paddingVertical: 5,
  },
  clienteCol: { flex: 1, paddingHorizontal: 8 },
  campo: { flexDirection: "row", marginBottom: 2.5, alignItems: "flex-end" },
  campoLabel: { fontSize: 7, color: GRIS, width: 62 },
  campoValor: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0.5,
    borderBottomColor: SUAVE,
    paddingBottom: 1,
  },

  tabla: { marginTop: 6, borderWidth: 1, borderColor: LINEA },
  filaCabecera: {
    flexDirection: "row",
    backgroundColor: FONDO_CABECERA,
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: SUAVE,
    minHeight: 16,
  },
  celdaCabecera: { fontSize: 7.5, fontFamily: "Helvetica-Bold", padding: 4 },
  celda: { fontSize: 8, paddingVertical: 3.5, paddingHorizontal: 4 },
  colDescripcion: { flex: 1 },
  colCantidad: { width: 42, textAlign: "center", borderLeftWidth: 0.5, borderLeftColor: SUAVE },
  colUnitario: { width: 78, textAlign: "right", borderLeftWidth: 0.5, borderLeftColor: SUAVE },
  colTotal: { width: 84, textAlign: "right", borderLeftWidth: 0.5, borderLeftColor: SUAVE },

  pie: { flexDirection: "row", marginTop: 6 },
  pieIzquierda: { flex: 1, paddingRight: 10 },
  bloqueLetras: {
    borderWidth: 1,
    borderColor: LINEA,
    padding: 6,
    minHeight: 34,
    justifyContent: "center",
  },
  letrasLabel: { fontSize: 6.5, color: GRIS, marginBottom: 2 },
  letrasTexto: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  observaciones: { marginTop: 5, fontSize: 7, color: GRIS, lineHeight: 1.5 },

  totales: { width: 210, borderWidth: 1, borderColor: LINEA },
  filaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
  },
  filaTotalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: FONDO_CABECERA,
    borderTopWidth: 1,
    borderTopColor: LINEA,
  },
  totalLabel: { fontSize: 8 },
  totalValor: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  totalFinalValor: { fontSize: 13, fontFamily: "Helvetica-Bold" },

  firmas: { flexDirection: "row", marginTop: 26, justifyContent: "space-between" },
  firma: { width: 190, borderTopWidth: 0.5, borderTopColor: LINEA, paddingTop: 3 },
  firmaTexto: { fontSize: 6.5, color: GRIS, textAlign: "center" },

  numeroPagina: {
    position: "absolute",
    bottom: 12,
    left: 26,
    right: 26,
    fontSize: 6,
    color: GRIS,
    textAlign: "center",
  },
});

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{valor && valor.trim() ? valor : " "}</Text>
    </View>
  );
}

function Pagina({ remito }: { remito: Remito }) {
  const { emisor, cliente } = remito;
  const visibles = remito.items.filter(
    (i) => i.descripcion.trim() !== "" || i.precioUnitario > 0,
  );
  const { subtotal, montoDescuento, total, unidades } = calcularTotales(
    visibles,
    remito.descuento,
  );
  const relleno = Math.max(0, FILAS_MINIMAS - visibles.length);
  const precios = remito.mostrarPrecios;
  const comprobante = numeroComprobante(remito.puntoVenta, remito.numero);
  const empresa = emisor.razonSocial || EMPRESA_SIN_CARGAR;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.cabecera}>
        <View style={styles.cabeceraLado}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- el Image de react-pdf no acepta alt */}
          {emisor.logo ? <Image style={styles.logo} src={emisor.logo} /> : null}
          <Text style={styles.razonSocial}>{empresa}</Text>
          {emisor.rubro ? <Text style={styles.rubro}>{emisor.rubro}</Text> : null}
          {emisor.direccion ? <Text style={styles.datoEmisor}>{emisor.direccion}</Text> : null}
          {emisor.localidad ? <Text style={styles.datoEmisor}>{emisor.localidad}</Text> : null}
          {emisor.telefono ? (
            <Text style={styles.datoEmisor}>Tel.: {emisor.telefono}</Text>
          ) : null}
          {emisor.administracion ? (
            <Text style={styles.datoEmisor}>Administración: {emisor.administracion}</Text>
          ) : null}
          {emisor.email ? <Text style={styles.datoEmisor}>{emisor.email}</Text> : null}
          {emisor.web ? <Text style={styles.datoEmisor}>{emisor.web}</Text> : null}
        </View>

        <View style={styles.cabeceraCentro}>
          <View style={styles.letra}>
            <Text style={styles.letraTexto}>{remito.letra || "R"}</Text>
          </View>
          <Text style={styles.codigo}>COD. 91</Text>
        </View>

        <View style={styles.cabeceraDerecha}>
          <Text style={styles.titulo}>REMITO</Text>
          {comprobante ? <Text style={styles.numero}>N&deg; {comprobante}</Text> : null}
          <Text style={styles.datoDerecha}>Fecha: {fechaLarga(remito.fecha)}</Text>
          {emisor.cuit ? <Text style={styles.datoDerecha}>CUIT: {emisor.cuit}</Text> : null}
          {emisor.iibb ? (
            <Text style={styles.datoDerecha}>Ing. Brutos: {emisor.iibb}</Text>
          ) : null}
          {emisor.condicionIva ? (
            <Text style={styles.datoDerecha}>{emisor.condicionIva}</Text>
          ) : null}
          {emisor.inicioActividades ? (
            <Text style={styles.datoDerecha}>Inicio de act.: {emisor.inicioActividades}</Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.aviso}>DOCUMENTO NO VÁLIDO COMO FACTURA</Text>

      <View style={styles.cliente}>
        <View style={styles.clienteCol}>
          <Campo label="Sr. (es):" valor={cliente.razonSocial} />
          <Campo label="Dirección:" valor={cliente.direccion} />
          <Campo label="Localidad:" valor={cliente.localidad} />
        </View>
        <View style={styles.clienteCol}>
          <Campo label="CUIT:" valor={cliente.cuit} />
          <Campo label="Cond. IVA:" valor={cliente.condicionIva} />
          <Campo label="Forma de pago:" valor={remito.formaPago} />
        </View>
      </View>

      <View style={styles.tabla}>
        <View style={styles.filaCabecera} fixed>
          <Text style={[styles.celdaCabecera, styles.colDescripcion]}>
            Nombre y/o denominación del artículo
          </Text>
          <Text style={[styles.celdaCabecera, styles.colCantidad]}>Cant.</Text>
          {precios ? (
            <Text style={[styles.celdaCabecera, styles.colUnitario]}>$ Unitario</Text>
          ) : null}
          {precios ? (
            <Text style={[styles.celdaCabecera, styles.colTotal]}>$ Total</Text>
          ) : null}
        </View>

        {visibles.map((item) => (
          <View key={item.id} style={styles.fila} wrap={false}>
            <Text style={[styles.celda, styles.colDescripcion]}>{item.descripcion}</Text>
            <Text style={[styles.celda, styles.colCantidad]}>
              {item.cantidad ? numeroES(item.cantidad, 3) : " "}
            </Text>
            {precios ? (
              <Text style={[styles.celda, styles.colUnitario]}>
                {moneda(item.precioUnitario)}
              </Text>
            ) : null}
            {precios ? (
              <Text style={[styles.celda, styles.colTotal]}>{moneda(totalDeItem(item))}</Text>
            ) : null}
          </View>
        ))}

        {Array.from({ length: relleno }).map((_, i) => (
          <View key={`vacia-${i}`} style={styles.fila}>
            <Text style={[styles.celda, styles.colDescripcion]}> </Text>
            <Text style={[styles.celda, styles.colCantidad]}> </Text>
            {precios ? <Text style={[styles.celda, styles.colUnitario]}> </Text> : null}
            {precios ? <Text style={[styles.celda, styles.colTotal]}> </Text> : null}
          </View>
        ))}
      </View>

      <View style={styles.pie}>
        <View style={styles.pieIzquierda}>
          <View style={styles.bloqueLetras}>
            <Text style={styles.letrasLabel}>
              {precios ? "SON PESOS:" : "CANTIDAD TOTAL DE UNIDADES:"}
            </Text>
            <Text style={styles.letrasTexto}>
              {precios ? montoEnLetras(total) : numeroES(unidades, 3)}
            </Text>
          </View>
          {remito.observaciones ? (
            <Text style={styles.observaciones}>Observaciones: {remito.observaciones}</Text>
          ) : null}
          {remito.vendedor ? (
            <Text style={styles.observaciones}>Usted fue atendido por: {remito.vendedor}</Text>
          ) : null}
        </View>

        {precios ? (
          <View style={styles.totales}>
            <View style={styles.filaTotal}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValor}>$ {moneda(subtotal)}</Text>
            </View>
            {remito.descuento > 0 ? (
              <View style={styles.filaTotal}>
                <Text style={styles.totalLabel}>Descuento ({remito.descuento}%)</Text>
                <Text style={styles.totalValor}>- $ {moneda(montoDescuento)}</Text>
              </View>
            ) : null}
            <View style={styles.filaTotalFinal}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValor}>$ {moneda(total)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.firmas}>
        <View style={styles.firma}>
          <Text style={styles.firmaTexto}>Firma y aclaración del receptor</Text>
        </View>
        <View style={styles.firma}>
          <Text style={styles.firmaTexto}>Por {empresa}</Text>
        </View>
      </View>

      <Text
        style={styles.numeroPagina}
        render={({ pageNumber, totalPages }) =>
          totalPages > 1
            ? `Remito N° ${comprobante} - Página ${pageNumber} de ${totalPages}`
            : `Remito N° ${comprobante}`
        }
        fixed
      />
    </Page>
  );
}

export function RemitoDocument({ remito }: { remito: Remito }) {
  const empresa = remito.emisor.razonSocial || EMPRESA_SIN_CARGAR;
  return (
    <Document
      title={`Remito ${numeroComprobante(remito.puntoVenta, remito.numero)}`.trim()}
      author={empresa}
      creator={empresa}
    >
      <Pagina remito={remito} />
    </Document>
  );
}

export default RemitoDocument;
