# Entorno de capacitaciones — el diseño antes de programar

Lo que tiene que hacer: **subir** capacitaciones, **verlas** desde adentro,
**tomar la lista de asistencia** y **controlar los vencidos**.

Y lo que no cambia: sin servidor. Hojas de cálculo + Apps Script + Drive, todo
del dominio de Holcim, privado por omisión y con clave donde entre alguien sin
cuenta corporativa. Lo mismo que ya está funcionando en el registro de
proveedores, con más pantallas.

## Las cuatro piezas

```
       SUBIR                    VER                  ASISTENCIA            VENCIDOS
  carpeta de Drive   ──►   la aplicación   ──►   quien la vio      ──►   quién debe
  + fila en el             web sirve la          escribe su              repetirla y
  catálogo                 capacitación          cédula                  cuándo
        │                       │                     │                      │
        └───────────────────────┴─────────────────────┴──────────────────────┘
                                  un solo libro de Google Sheets
```

## El libro: cinco pestañas y nada más

Una sola hoja de cálculo, en la unidad compartida del área. Es la base de datos.

> Las pestañas construidas se llaman `CURSOS` y `MODULOS`: el curso es la
> unidad que vence, el módulo es cada parte en que se segmenta.

**`CURSOS`** — el catálogo. Una fila por curso.

| ID | Nombre | Tipo | Enlace | Vigencia (meses) | Obligatoria para | Activa |
|---|---|---|---|---|---|---|
| CAP-001 | Reinducción | HTML | *(la URL que publica la plantilla)* | 12 | Todos | Sí |
| CAP-002 | Trabajo en alturas | PDF | *(archivo en Drive)* | 24 | Planta | Sí |

**`PERSONAS`** — quién debe capacitarse. **Es la misma hoja del registro de
proveedores**: cédula, nombre completo, correo y a qué empresa pertenece. No se
crea otra: si un contratista ya se registró, ya está aquí.

**`ASISTENCIAS`** — el hecho. Una fila cada vez que alguien completa una.

| Fecha | ID capacitación | Cédula | Nombre | Cómo | Quién tomó la lista | Constancia |
|---|---|---|---|---|---|---|

**`VENCIMIENTOS`** — no se escribe, **se calcula**. Última asistencia de esa
persona a esa capacitación, más la vigencia. Guardar el estado sería garantizar
que algún día quede desactualizado.

**`ERRORES`** — cualquier fallo del servicio, para no perderlo de vista. Igual
que en el registro.

### La decisión de fondo: la gente se identifica con la cédula

No con la cuenta de Google. Un contratista no tiene cuenta de Holcim, y la
constancia de una capacitación de seguridad tiene que servirle a HSE, que
trabaja con cédulas. Cuando además hay sesión de Holcim, el correo queda
anotado como evidencia adicional — pero lo que amarra la fila es la cédula.

## Las pantallas

Una sola aplicación web, que decide qué mostrar según la dirección:

| Dirección | Qué es | Quién entra |
|---|---|---|
| `?p=catalogo` | Qué capacitaciones hay y cuáles me faltan | **N0** — dominio Holcim |
| `?p=ver&id=CAP-001` | La capacitación en pantalla | **N0** o **N2 con clave**, según a quién va dirigida |
| `?p=asistencia&id=CAP-001` | La lista: la persona escribe su cédula y queda registrada | Igual que la anterior |
| `?p=vencidos` | El tablero: quién está vencido, quién vence este mes | **N0**, y ojalá solo el área |

El tablero de vencidos **nunca** se abre con clave. Es información de personas:
se queda adentro.

## Cómo se toma la lista — hacen falta las dos maneras

**1. En línea, la propia persona.** Al final de la capacitación, un botón
*Registrar mi asistencia*: escribe la cédula, confirma el nombre y queda la
fila. Sirve para lo que se ve desde un computador o un celular.

Es por confianza, como cualquier curso en línea. Se puede apretar un poco sin
volverlo incómodo: una clave de sesión que solo se dice al final, un tiempo
mínimo antes de habilitar el botón, o tres preguntas de control. Vale la pena
decidirlo por capacitación, no para todas.

**2. Presencial, el instructor.** Una charla en planta a las 6 de la mañana no
se registra con celulares. El instructor abre la pantalla, marca en una lista a
los que asistieron y se graba una fila por cada uno. Sin esto, la mitad de las
capacitaciones del área no entran al sistema.

## Vencidos: se calcula, no se guarda

Para cada persona y cada capacitación obligatoria:

```
última asistencia + vigencia = vence el
```

Y cuatro estados: **al día**, **por vencer** (dentro de 30 días), **vencido**,
**nunca la hizo** — que en la práctica es el más importante y el que nadie mira.

Un disparador diario de Apps Script —*Activadores → Añadir activador*, sin
servidor ni nada que instalar— manda el correo con los que vencen el mes
entrante. La cuota de Workspace son 1.500 correos al día: sobra.

## Dónde viven los archivos

Una carpeta `Capacitaciones/` en la unidad compartida del área. Nunca
compartida como "cualquiera con el enlace": eso es justo lo que la regla del
listado no permite.

- **HTML** — se publica con [`../plantilla/`](../plantilla/) y el catálogo
  guarda esa dirección. Es el formato que mejor funciona, y el único que se
  puede mostrar a alguien sin cuenta de Holcim sin abrir nada de Drive.
- **PDF y video** — viven en Drive y el catálogo enlaza. Con público interno
  funciona directo. **Con público externo no**: Drive le va a pedir cuenta. Ahí
  toca o pasarlo a HTML, o incrustar el PDF dentro de la página que sirve el
  script. Por eso, para lo que vean contratistas, conviene HTML.

## En qué orden se construye

| Fase | Qué queda funcionando | Se apoya en |
|---|---|---|
| **1** | ✅ **Hecha** — el libro, el catálogo y el visor: subir una capacitación y verla, partida en partes | [`../capacitaciones/`](../capacitaciones/) |
| **2** | Asistencia en línea. Es la pieza que más se va a usar | `Hoja.gs` del registro |
| **3** | Vencidos y el correo automático | Fase 2 |
| **4** | Asistencia presencial por lote y reportes por área | Fase 2 |

La fase 1 está construida y probada: [`../capacitaciones/`](../capacitaciones/).
El curso se parte en las partes que haga falta —presentación, video, cartilla,
evaluación— y cada una puede ser HTML, PDF, video o un enlace a algo que viva
por fuera. Lo que sigue es la asistencia.

## Lo que se reutiliza de lo que ya está hecho

No se empieza de cero:

- **La plantilla** (`plantilla/`) — el visor.
- **Las claves** — `Publicar.gs` y `Config.gs`, tal cual.
- **`Hoja.gs`** del registro — encabezados que se completan solos, filas en
  orden, copia a una hoja de Holcim y anotación de errores.
- **`PERSONAS`** — la hoja del registro de proveedores, sin duplicar nada.

## Hasta dónde aguanta esto

Los límites de Apps Script, para saber cuándo dejaría de servir:

- 30 segundos por pantalla y 6 minutos por ejecución. Suficiente, salvo que se
  intente calcular todo el tablero de vencidos de una vez para miles de filas.
- ~50.000 filas cómodas por hoja. A 3.000 asistencias al año, son más de quince
  años.
- 1.500 correos diarios.
- Video pesado: lo sirve Drive, no el script. Nunca meta un video dentro del
  HTML.

Con cientos de personas y decenas de capacitaciones va sobrado.

## Lo que hay que decidir antes de la fase 2

Estas cuatro no las puedo decidir yo, y cambian lo que se programa:

1. **¿Quién tiene que capacitarse?** ¿Solo empleados con cuenta `@holcim.com`,
   o también contratistas sin cuenta? Define si el visor y la asistencia van en
   N0 o en N2 con clave.
2. **¿Qué formatos hay que soportar hoy?** Si es solo HTML, la fase 1 es un día.
   Si hay PDF y video, hay que resolver primero lo de Drive con externos.
3. **¿La vigencia es por capacitación o por cargo?** Un año para todos es una
   columna; distinto por cargo es una tabla aparte.
4. **¿Quién responde por que la lista esté al día?** Sin un dueño, a los seis
   meses el tablero de vencidos deja de creerse.
