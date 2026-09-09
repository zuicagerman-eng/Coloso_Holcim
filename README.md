# Coloso Holcim

Los programas del área, sin servidor: hojas de cálculo con Apps Script, dentro
del dominio de Holcim.

- **[`docs/PROGRAMAS.md`](docs/PROGRAMAS.md)** — el listado de todos los
  programas: dónde vive cada uno y quién puede entrar.
- **[`plantilla/`](plantilla/)** — publica cualquier HTML como página propia de
  Holcim, privada por omisión. La reinducción va por aquí.
- **[`docs/ENTORNO-CAPACITACIONES.md`](docs/ENTORNO-CAPACITACIONES.md)** — el
  diseño del entorno de capacitaciones: subir, ver, tomar asistencia, vencidos.
- **[`docs/REQUISITOS.md`](docs/REQUISITOS.md)** — todo lo que hace falta para
  ejecutar cualquiera de ellos.

Lo que sigue de este archivo es el primero que quedó montado: el registro de
empresas y personas.

---

## Registro de Empresas y Personas

Formulario web con la identidad de Holcim que registra **empresas** y las
**personas** que pertenecen a ellas, y guarda todo en una **hoja de cálculo**
de Google.

```
vista/index.html            un solo archivo, se abre en cualquier navegador
        │  pide la clave de acceso antes de mostrar nada
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

**Para ponerlo a funcionar no hay que instalar nada**: se hace con el navegador,
pegando archivos en el editor de Apps Script. La lista completa de lo que sí
hace falta —cuentas, permisos y los datos que hay que tener a la mano— está en
**[`docs/REQUISITOS.md`](docs/REQUISITOS.md)**. Revísela antes de empezar y no
se topará con nada a mitad de camino.

Después son cuatro pasos, unos 15 minutos: crear la hoja, pegar el script,
publicarlo como aplicación web y pegar la URL en el formulario.
Está detallado en **[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)**.

Mientras `API.url` esté vacía, el formulario funciona igual pero no guarda nada;
sirve para mostrarlo sin montar nada.

## Estructura

| Archivo | Para qué |
|---|---|
| `vista/index.html` | El formulario completo: un archivo, sin dependencias |
| `vista/assets/logo-holcim.svg` | Símbolo de la marca (reconstrucción, ver abajo) |
| `apps-script/Config.gs` | **Lo único que se edita**: claves de acceso, correos de aviso y token |
| `apps-script/Api.gs` | Recibe los registros y los guarda |
| `apps-script/Validaciones.gs` | Las reglas, del lado del servidor |
| `apps-script/Hoja.gs` | Único punto que toca la hoja de cálculo |
| `apps-script/Correo.gs` | Aviso por correo, apagado mientras no haya destinatarios |
| `plantilla/` | Publica cualquier HTML como página de Holcim, con clave si hace falta |
| `docs/REQUISITOS.md` | Todo lo que hace falta antes de empezar: cuentas, permisos y programas |
| `docs/PROGRAMAS.md` | El listado de programas: dónde vive cada uno y quién puede entrar |
| `herramientas/empaquetar.py` | Arma el `.zip` que se sube a la unidad compartida del área |

## Quién puede entrar

El formulario se publica en abierto —quien lo diligencia es externo y no tiene
cuenta de Holcim—, así que la entrada la controla una **clave de acceso**: una
por empresa o por convocatoria, que se pone en `CONFIG.CLAVES` y se entrega con
la invitación. Sin clave válida no se ve el formulario, y cada registro queda
marcado con a quién se le entregó la clave que se usó.

La regla para este y para los demás programas del área —todo en el dominio de
Holcim, privado por omisión, público solo lo que tiene que serlo y siempre con
clave— está en **[`docs/PROGRAMAS.md`](docs/PROGRAMAS.md)**, junto con el
listado.

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
