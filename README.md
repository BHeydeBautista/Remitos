# Generador de remitos

App en Next.js para cargar un remito y bajarlo en PDF, listo para imprimir en A4.
No usa base de datos ni backend: **el PDF se genera en el navegador** con
[`@react-pdf/renderer`](https://react-pdf.org).

Está pensada **primero para el celular**: se carga con una mano, sin zoom y con
todo a mano en la pantalla.

## Correrlo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Para probarlo desde el celular en la misma red,
`next dev` imprime también una URL `http://192.168.x.x:3000`.

## Cómo se usa en el celular

- Arranca con **Comprobante**, **Cliente** y **Artículos** abiertos; el resto
  queda plegado con un resumen de una línea.
- Barra fija abajo con el **total**, **Ver PDF** y **Compartir** (o **Descargar**
  si el navegador no soporta compartir archivos).
- **Compartir** abre el menú nativo del teléfono, así que el remito sale por
  WhatsApp o mail sin pasar por la galería de descargas.
- **Ver PDF** abre la vista previa a pantalla completa, con paginador si el
  remito ocupa más de una hoja.

### Carga rápida de artículos

- Enter en la descripción salta al precio; Enter en el precio crea la fila
  siguiente y deja el cursor ahí.
- Los artículos que ya usaste se guardan y se autocompletan: al elegir uno de la
  lista, **trae el precio de la última vez**.
- Al tocar un campo numérico se selecciona todo, para pisarlo de una.
- Cada caja tiene su etiqueta (**Cant. / Precio unit. / Total**), para no
  confundirlas en la pantalla del celular.
- Si la cantidad queda vacía vale 0 y la línea no suma: se marca en ámbar, se
  avisa arriba de los botones, y al salir del campo vuelve sola a 1.
- Los campos aceptan `5.100,50`, `5100,50` o `5100` indistinto.
- Inputs de 16px y 44px de alto, para que iOS no haga zoom al enfocar.

## La vista previa

Se dibuja con **pdf.js sobre un `<canvas>`**, no en un `<iframe>`: Chrome de
Android no renderiza PDFs embebidos y quedaría una caja en blanco.

## Qué más hace

- **Descargar PDF** guarda el archivo como `Remito 0001-00001844 - Cliente.pdf`.
- **Una hoja por remito.** Pasa a dos sólo cuando no entran los artículos: la
  tabla sigue en la página siguiente con su encabezado, y los totales y las
  firmas van al final. En A4 entran unos 26 artículos por hoja.
- Interruptor **Mostrar precios**: si lo apagás sale un remito sólo con cantidades
  (la caja del pie pasa a mostrar el total de unidades).
- Importe en letras automático: `sesenta y tres mil seiscientos con 05/100`.
- Descuento en % opcional, observaciones y campo "atendido por".
- **El número de remito lo ponés vos**: la app no lleva la cuenta ni lo numera
  sola. **Nuevo** limpia cliente, artículos y número, listo para el siguiente.
- La primera vez cargás los datos de tu empresa (y el logo) y quedan guardados;
  hasta entonces el PDF sale con “Nombre de la empresa” en el membrete.

## Dónde se guardan los datos

En el `localStorage` del navegador, con tres claves:

| Clave | Contenido |
| --- | --- |
| `remitos:emisor` | Datos de la empresa y el logo. Se cargan una vez y quedan. |
| `remitos:borrador` | El remito que estás editando, para no perderlo si cerrás la pestaña. |
| `remitos:catalogo` | Artículos ya usados con su último precio, para autocompletar. |

No hay historial de remitos: cada uno se descarga y listo.

## Estructura

```
app/page.tsx                   Carga el editor sólo en el cliente (ssr: false)
components/Editor.tsx          Formulario, estado del remito y barra de acciones
components/RemitoDocument.tsx  El PDF (layout A4 con @react-pdf/renderer)
components/pdfRemito.tsx       Hook de generación + descargar / compartir
components/PanelPdf.tsx        Panel de escritorio y hoja de pantalla completa
components/VistaPdf.tsx        Render del PDF en canvas con pdf.js
components/ui.tsx              Inputs, botones y secciones plegables
lib/types.ts                   Tipos y valores iniciales
lib/format.ts                  Moneda, fechas, número a letras, parseo de "1.234,56"
lib/calculos.ts                Subtotal, descuento y total
lib/storage.ts                 localStorage y redimensionado del logo
```

## Si más adelante querés guardar los remitos

Al no haber base de datos, el lugar natural sería un route handler
(`app/api/remitos/route.ts`) que reciba el objeto `Remito` y lo persista.
El PDF puede seguir generándose en el cliente, o rearmarse en el servidor
reutilizando `RemitoDocument` con `renderToStream` de `@react-pdf/renderer`.
