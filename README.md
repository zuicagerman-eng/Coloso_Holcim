# Coloso Holcim — Registro de Empresas y Personas

Formulario web con la identidad de Holcim que registra **empresas** y las
**personas** que pertenecen a ellas, y guarda todo en una **hoja de cálculo**
de Google.

```
vista/index.html            un solo archivo, se abre en cualquier navegador
        │  fetch POST (JSON + token)
        ▼
Apps Script  Api.gs         valida otra vez y escribe
        │
        ▼
Google Sheet  EMPRESAS · PERSONAS · ERRORES
        │
        └──►  correo de aviso (opcional, apagado por defecto)
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
| `vista/index.html` | El formulario completo: un archivo, sin dependencias |
| `vista/assets/logo-holcim.svg` | Símbolo de la marca (reconstrucción, ver abajo) |
| `apps-script/Config.gs` | **Lo único que se edita**: token y correos de aviso |
| `apps-script/Api.gs` | Recibe los registros y los guarda |
| `apps-script/Validaciones.gs` | Las reglas, del lado del servidor |
| `apps-script/Hoja.gs` | Único punto que toca la hoja de cálculo |
| `apps-script/Correo.gs` | Aviso por correo, apagado mientras no haya destinatarios |

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
