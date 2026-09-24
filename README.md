# Coloso Holcim — Registro de Empresas y Personas

Formulario web con la identidad de Holcim que registra **empresas** y las
**personas** que pertenecen a ellas, y guarda todo en una **hoja de cálculo**
de Google.

```
El proveedor entra con su cuenta de Google
        │
        ▼
apps-script/formulario/     ← sabe quién entró; solo pide ver su correo
        │  le pasa los datos con una clave compartida
        ▼
apps-script/registro/       ← valida y escribe; corre con la cuenta dueña
        │
        ├─► Google Sheet   EMPRESAS · ERRORES
        ├─► copia en una hoja de Holcim (opcional)
        └─► correo de aviso, con copia a quien diligenció
```

## Qué se captura

**Empresa** — NIT sin dígito de verificación (el DV se calcula y se guarda
aparte), nombre, correo y teléfono `+57` de 10 dígitos.

**Personas** — nombres, primer apellido, segundo apellido opcional, nombre
completo armado solo, cédula, correo y la empresa a la que pertenecen, elegida
de una lista que sale de las empresas ya registradas.

Todo entra normalizado: nombres en **mayúscula sostenida**, correos en
minúscula, NIT y cédula solo con dígitos.

## Puesta en marcha

Cuatro pasos, unos 15 minutos: crear la hoja, pegar el script, publicarlo como
aplicación web y pegar la URL en el formulario.
Está detallado en **[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)**.

Mientras `API.url` esté vacía, el formulario funciona igual pero no guarda nada;
sirve para mostrarlo sin montar nada.

## Estructura

| Archivo | Para qué |
|---|---|
| `vista/index.html` | El formulario. Única fuente del diseño |
| `vista/assets/logo-holcim.png` | Logotipo oficial, incrustado en la página |
| `apps-script/formulario/Config.gs` | **Se edita**: dirección del otro servicio y clave |
| `apps-script/formulario/Codigo.gs` | Entrega la página y averigua quién entró |
| `apps-script/formulario/pagina.html` | Generado desde la vista, no se edita a mano |
| `apps-script/registro/Config.gs` | **Se edita**: correos del aviso, clave, hoja de Holcim |
| `apps-script/registro/Api.gs` | Recibe los registros y los guarda |
| `apps-script/registro/Validaciones.gs` | Las reglas, del lado del servidor |
| `apps-script/registro/Hoja.gs` | Único punto que toca la hoja de cálculo |
| `apps-script/registro/Correo.gs` | Aviso por correo |

Las reglas están escritas dos veces a propósito: en el navegador para que quien
diligencia vea el error mientras escribe, y en el servidor porque cualquiera
puede mandar datos a la URL sin pasar por el formulario. Lo que decide qué entra
a la hoja es siempre el servidor.

## Dos cosas por resolver

1. **El repositorio es público.** Antes de meter datos o correos reales:
   Settings → General → Danger Zone → Make private.
2. **El logotipo es una reconstrucción**, no el archivo oficial. Se parece, pero
   pídalo a Comunicaciones y reemplace `vista/assets/logo-holcim.svg` y el bloque
   `<svg>` del HTML, que está comentado.

## Por qué Apps Script

El Sheet y el correo son nativos de Google: cero infraestructura, cero costo y
nada que aprobar con TI. El análisis completo, con el límite de cuándo convendría
migrar, está en [`docs/DECISION-GITHUB-VS-APPS-SCRIPT.md`](docs/DECISION-GITHUB-VS-APPS-SCRIPT.md).
