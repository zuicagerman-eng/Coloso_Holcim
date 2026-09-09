# Los programas del área — dónde vive cada uno y quién puede entrar

La regla, en una frase:

> **Todo dentro del dominio de Holcim y privado. Se publica en abierto solo la
> pantalla que un externo necesita para diligenciar, y esa pantalla pide clave
> de usuario antes de mostrar nada.**

Este archivo es el inventario del **área**, no de un programa. El registro de
proveedores es una fila más, y no la más importante: la reinducción la ve todo
el mundo y el entorno de capacitaciones va a ser lo más grande que tengamos.

Un programa que no esté aquí no está listo para usarse con datos reales. Lo que
hace falta para montar cualquiera está en [`REQUISITOS.md`](REQUISITOS.md).

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

| # | Programa | Qué es | Dónde vive | Nivel | Estado |
|---|---|---|---|---|---|
| 1 | **Entorno de capacitaciones** | Subir capacitaciones, verlas, tomar asistencia y controlar vencidos | Sheets + Apps Script + Drive | **N0**, y **N2** lo que vean contratistas | Diseñado, sin construir — [`ENTORNO-CAPACITACIONES.md`](ENTORNO-CAPACITACIONES.md) |
| 2 | **Presentación de reinducción** | La presentación en HTML que ve todo el personal | Por publicar con [`../plantilla/`](../plantilla/) | **N0**, o **N2** si la ven contratistas | ⚠️ Falta saber dónde está hoy y quién la mantiene |
| 3 | **Registro de Empresas y Personas** | Formulario donde proveedores y contratistas se registran | Apps Script (aplicación web) | **N2** | En marcha, en cuenta personal — ver deuda abajo |
| 4 | **Hoja de registros** | La base del registro: `EMPRESAS`, `PERSONAS`, `ERRORES` | Google Sheets | **N1** | En marcha, en cuenta personal |
| 5 | **Copia en hoja de Holcim** | Cada registro se escribe también en una hoja propiedad de Holcim | Google Sheets, unidad compartida | **N1** | Configurable (`ID_HOJA_HOLCIM`) |
| 6 | **Aviso por correo** | Notifica cada registro a los responsables | Apps Script (`MailApp`) | **N1** | En marcha |
| 7 | **Código fuente** | Los archivos con los que se vuelve a montar todo | Ver *Dónde vive el código* | **Privado** | ⚠️ Hoy, GitHub personal y público |
| — | **Lo que falte** | | | | Ver *Por inventariar* |

### Por inventariar

Las filas 1 y 2 están puestas porque salieron en la conversación; las demás son
las que se ven desde este repositorio. **Falta el resto de los programas del
área.** Por cada uno hacen falta cinco cosas, ni una más:

```
Nombre        —
Qué hace      —
Dónde vive    —  hoja / Apps Script / archivo HTML / otro
Quién entra   —  empleados con cuenta Holcim / contratistas sin cuenta / ambos
Estado        —  en marcha / a medias / por hacer
```

Con esa lista, cada uno entra a la tabla y se le asigna nivel. Sin ella, este
inventario dice que hay siete programas cuando probablemente hay quince.

## Publicar una pantalla nueva

Cualquier programa del área que sea "una pantalla" —una presentación, un
instructivo, un tablero, una calculadora— se publica igual, con
[`../plantilla/`](../plantilla/): se pega el HTML, se elige si entra todo Holcim
o solo quien tenga clave, y queda con dirección propia en 10 minutos. Sin
servidor y sin instalar nada.

Ahí está resuelto lo que no resuelve Drive: **un HTML guardado en Drive no se
puede abrir como página web**, Google quitó esa función hace años. Por eso una
presentación en HTML termina o convertida a otro formato, o publicada así.

### Ficha · Registro de Empresas y Personas — por qué es N2

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

## Dónde vive el código

Que el código esté versionado **no significa montar un servidor**. Los programas
corren donde siempre: una hoja de cálculo con su script. Lo que se guarda aparte
son los archivos con los que se vuelve a montar el programa si alguien borra la
hoja — y eso es un archivo de texto en una carpeta, no infraestructura.

La pregunta es en qué carpeta, y hay tres respuestas posibles:

| Dónde | ¿Es de Holcim? | Historial | Qué cuesta conseguirlo |
|---|---|---|---|
| **El propio proyecto de Apps Script** | Sí, si la hoja está en una unidad compartida | Débil: guarda versiones de la implementación, sin diferencias ni comparación | Nada, ya está |
| **Carpeta en una unidad compartida de Drive** | Sí, del área — no de una persona | Drive guarda el historial de cada archivo; una versión se puede marcar para que no se borre | Nada, ya está |
| **Git corporativo de Holcim** (GitHub Enterprise, Azure DevOps, GitLab) | Sí | Completo: ramas, comparación, quién cambió qué | Hay que preguntarle a TI si existe y pedir el espacio |

**Lo que se hace, en ese orden:**

1. **Preguntar a TI si Holcim tiene Git corporativo.** Es la respuesta buena y no
   cuesta nada averiguarla; el texto del pedido está en
   [`SOLICITUD-TI.md`](SOLICITUD-TI.md). Si existe, el código se muda ahí y este
   listado se actualiza.
2. **Mientras tanto, la unidad compartida del área.** Para un programa de este
   tamaño alcanza, porque lo que hay que garantizar son tres cosas y Drive las
   da: que el código no viva solo en la cuenta de una persona, que un archivo
   borrado se pueda recuperar, y que el programa se pueda volver a montar en 15
   minutos. Para dejar la copia al día:

   ```bash
   python3 herramientas/empaquetar.py
   ```

   Arma un `.zip` con fecha —el código, la vista y los documentos— que se sube a
   la carpeta del área. Súbalo cada vez que cambie algo que ya esté en marcha.
3. **El repositorio de GitHub personal deja de ser la casa.** Hoy además es
   público: eso se corrige ya (ver abajo). Sirve mientras se trabaja, no como
   el sitio donde Holcim guarda lo suyo.

Vaya donde vaya, viaja lo mismo: `apps-script/`, `vista/` y `docs/`. Con eso
—y nada más— se vuelve a montar cualquiera de los programas del listado.

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
2. **El código está en un GitHub personal, y además público.** Dos arreglos, uno
   hoy y otro cuando haya respuesta:
   - Hoy: Settings → General → Danger Zone → Make private. Antes de que entren
     datos o correos reales.
   - Y en paralelo, dejar la copia en la unidad compartida del área y preguntarle
     a TI por el Git corporativo, como dice *Dónde vive el código*.
