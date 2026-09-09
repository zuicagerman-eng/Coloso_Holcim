# Listado de programas — dónde vive cada uno y quién puede entrar

La regla, en una frase:

> **Todo dentro del dominio de Holcim y privado. Se publica en abierto solo la
> pantalla que un externo necesita para diligenciar, y esa pantalla pide clave
> de usuario antes de mostrar nada.**

Este archivo es el inventario. Un programa que no esté aquí no está listo para
usarse con datos reales.

## La regla, por partes

1. **Dueño: Holcim.** El archivo, el script y la hoja se crean con una cuenta
   `@holcim.com`, y en una **unidad compartida** del área — no en "Mi unidad" de
   alguien. Si esa persona sale de la empresa, el programa sigue funcionando.
2. **Privado por omisión.** Un programa nuevo nace restringido al dominio.
   Abrirlo es una decisión que se toma aparte, se anota en este listado y se
   justifica en una línea.
3. **Los datos nunca se publican.** Ninguna hoja, ninguna carpeta de Drive se
   comparte como "cualquiera con el enlace". Lo que se publica es una pantalla
   que **escribe**; la información ya registrada no se puede leer desde afuera.
4. **Se abre solo lo que tiene que abrirse.** Si quien lo usa es externo y no
   tiene cuenta de Holcim, no hay alternativa: esa pantalla debe ser pública.
   Es una sola pantalla, no el programa entero.
5. **Lo público lleva clave.** Enlace abierto no significa entrada libre: la
   pantalla pide una clave que Holcim entrega junto con la invitación. Una clave
   por empresa o por convocatoria, nunca una sola para todos, y cada registro
   queda marcado con la clave que se usó.

## Los cuatro niveles

| Nivel | Qué significa | Cuándo se usa |
|---|---|---|
| **N0 · Dominio** | Google pide sesión `@holcim.com`. Entra cualquier empleado. | El predeterminado. Todo lo interno. |
| **N1 · Nominal** | Solo las personas o el grupo que se nombran. | Datos personales, nómina, contratos. |
| **N2 · Público con clave** | El enlace es abierto, pero la pantalla no muestra nada hasta que se escribe una clave válida. | Cuando quien diligencia es externo y no tiene cuenta de Holcim. |
| **N3 · Público abierto** | Sin clave. | Solo pantallas informativas: sin datos, sin escritura. |

Entre N1 y N2 no hay nada intermedio: o Google verifica la sesión, o la
verificamos nosotros con una clave. Lo que no se hace es dejar N3 algo que
recibe datos de personas.

## El listado

| # | Programa | Qué hace | Dónde vive | Nivel | Estado |
|---|---|---|---|---|---|
| 1 | **Registro de Empresas y Personas** | Formulario web donde proveedores y contratistas se registran | Apps Script (aplicación web) | **N2** | En marcha, en cuenta personal — ver deuda abajo |
| 2 | **Hoja de registros** | La base: `EMPRESAS`, `PERSONAS`, `ERRORES` | Google Sheets, ligada al script | **N1** | En marcha, en cuenta personal |
| 3 | **Copia en hoja de Holcim** | Cada registro se escribe también en una hoja propiedad de Holcim | Google Sheets, unidad compartida | **N1** | Configurable (`ID_HOJA_HOLCIM`), apagado si está vacío |
| 4 | **Aviso por correo** | Notifica cada registro a los responsables | Apps Script (`MailApp`) | **N1** | En marcha; destinatarios en `NOTIFICAR_A` |
| 5 | **Código fuente** | Este repositorio | GitHub | **Privado** | ⚠️ Hoy es público — ver deuda abajo |
| 6 | **Vista de demostración** | `vista/index.html` sin `API.url`: valida y confirma en pantalla, no guarda nada | Archivo suelto | **N3** | Sirve para mostrar el formulario sin montar nada |

### 1 · Registro de Empresas y Personas — por qué es N2

Quien diligencia es un proveedor o un contratista: **no tiene cuenta de
Holcim**. Si la aplicación se publica restringida al dominio, Google le pide
iniciar sesión y no puede entrar. Por eso esta pantalla —y solo esta— se publica
con acceso "Cualquier usuario".

Lo que eso **no** abre:

- La hoja no queda expuesta. La aplicación escribe con los permisos del dueño,
  no con los del visitante; nadie de afuera ve la hoja ni puede abrirla.
- No hay forma de leer lo ya registrado. La única lectura que sale es la lista
  de nombres de empresas que el paso 2 necesita, y también queda detrás de la
  clave.
- Cada registro guarda **a quién se le entregó la clave** con la que entró.

Cómo se configuran las claves: `CONFIG.CLAVES` en `apps-script/Config.gs`, y el
detalle en [`DESPLIEGUE.md`](DESPLIEGUE.md#claves-de-acceso).

## Agregar un programa nuevo al listado

1. Créelo con la cuenta de Holcim, en una unidad compartida.
2. Publíquelo **N0** y compruebe que funciona así.
3. ¿Alguien que lo necesita no tiene cuenta de Holcim? Solo entonces súbalo a
   **N2**, y encienda las claves antes de repartir el enlace.
4. Agregue la fila a la tabla de arriba: qué hace, dónde vive, nivel y estado.
5. El código, a este repositorio. Un programa que vive solo en Drive se pierde
   el día que alguien borre el archivo.

## Lo que hoy está fuera de la regla

Dos cosas, y conviene tratarlas como temporales:

1. **El script y la hoja están en una cuenta personal.** El Workspace de Holcim
   tiene deshabilitada la publicación de aplicaciones con acceso anónimo, así que
   la opción "Cualquier usuario" ni siquiera aparece. El pedido a TI está escrito
   en [`SOLICITUD-TI.md`](SOLICITUD-TI.md); el día que lo habiliten, el programa
   se vuelve a montar en Holcim en 15 minutos porque el código está aquí. Mientras
   tanto, la copia en la hoja de Holcim (`ID_HOJA_HOLCIM`) hace que los datos
   estén desde el principio donde deben estar.
2. **El repositorio es público.** Settings → General → Danger Zone → Make private.
   Antes de que entren datos o correos reales.
