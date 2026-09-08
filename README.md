# Coloso Holcim — Registro de Empresas y Personas

Dos **Google Forms** que alimentan una **hoja de cálculo** (la base de datos de
quién diligenció qué) y un script que **avisa por correo** a las personas
responsables cada vez que alguien registra una empresa o una persona.

```
Google Form Empresa  ──┐
                       ├──►  Google Sheet (hojas EMPRESAS y PERSONAS)
Google Form Personas ──┘            │
                                    └──►  correo automático a CONFIG.NOTIFICAR_A
                                          "Fulano diligenció el registro de …"
```

Sin formularios a la medida, sin servidor y sin hosting: el formulario lo pone
Google, la base de datos es el Sheet, y el único código que corre son unas
líneas que arman y envían el aviso.

## Qué se captura

**Empresa** — NIT *sin dígito de verificación* (el script calcula el DV y lo
guarda en su propia columna), nombre, correo y contacto.

**Personas** — nombres, apellidos, cédula, correo y la empresa a la que
pertenecen, elegida de una lista que **se actualiza sola** con las empresas ya
registradas.

Los dos formularios guardan además el correo de **quien responde**, que es lo
que convierte al Sheet en la base de datos de quién diligenció.

Las validaciones las hace el propio Google Form al escribir: NIT de 8 a 10
dígitos sin guion, cédula de 6 a 10 dígitos, correos con formato válido.

## Puesta en marcha

1. Cree una hoja de cálculo nueva en el Drive de Holcim.
2. **Extensiones → Apps Script**, y suba los archivos de `apps-script/`
   (o `clasp push`, ver [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)).
3. En `Config.gs`, escriba los correos que deben recibir el aviso.
4. Ejecute la función **`instalar()`** una sola vez y acepte los permisos.

`instalar()` crea los dos formularios con sus validaciones, los conecta a la
hoja y deja activo el aviso por correo. Al terminar muestra los **dos enlaces
para compartir**: esos son los que se le pasan a quien deba diligenciar.

## Archivos

| Archivo | Para qué |
|---|---|
| `apps-script/Config.gs` | **Lo único que se edita**: correos notificados y textos de las preguntas |
| `apps-script/Instalar.gs` | Crea los formularios, los conecta al Sheet y activa el aviso |
| `apps-script/Notificaciones.gs` | Envía el correo en cada respuesta, calcula el DV y refresca la lista de empresas |
| `apps-script/mail/notificacion.html` | Plantilla del correo |

## Cambiar los correos que reciben el aviso

Solo `Config.gs`; no hay que reinstalar nada:

```js
NOTIFICAR_A: ['compras@holcim.com', 'contratacion@holcim.com'],
```

## Por qué Apps Script y no un desarrollo propio

El Sheet y el correo son nativos de Google: cero infraestructura, cero costo y
nada que aprobar con TI. GitHub queda como el respaldo y el historial del
código. El análisis completo, con el límite de cuándo convendría migrar, está en
[`docs/DECISION-GITHUB-VS-APPS-SCRIPT.md`](docs/DECISION-GITHUB-VS-APPS-SCRIPT.md).
