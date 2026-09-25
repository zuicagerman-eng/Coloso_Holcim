# Puesta en marcha

La solución son **dos proyectos de Apps Script**, no uno. Vale la pena entender
por qué antes de montarlos, porque explica todos los pasos que siguen.

```
        el proveedor
             │  entra con su cuenta de Google
             ▼
┌────────────────────────────┐
│  FORMULARIO                │  Ejecutar como: Usuario que accede
│  entrega la página y       │  Acceso: Cualquier usuario con cuenta de Google
│  averigua quién entró      │  Permisos que pide: ver su correo
└────────────┬───────────────┘
             │  le pasa los datos junto con el correo
             ▼
┌────────────────────────────┐
│  REGISTRO                  │  Ejecutar como: Yo
│  escribe en la hoja y      │  Acceso: Cualquier usuario
│  manda los correos         │  Permisos: hojas de cálculo y envío de correo
└────────────┬───────────────┘
             ▼
     Hoja de cálculo  +  aviso por correo
```

**Por qué separados.** Google solo dice quién entró cuando el script corre con
la autorización de esa persona. Pero un script que corre con la cuenta del
proveedor no puede escribir en una hoja que no es suya. Con dos proyectos cada
uno hace lo que puede: el de adelante identifica, el de atrás escribe.

Y hay una razón mejor: los permisos que se le piden al proveedor son los del
proyecto que autoriza. Si todo estuviera junto, al entrar le aparecería
*"esta aplicación quiere ver, editar y eliminar sus hojas de cálculo"* — un
permiso enorme para alguien que solo va a llenar cuatro casillas, y que con
razón muchos rechazarían. Separados, solo le pide **ver su dirección de correo**.

---

## 1. Servicio de REGISTRO

Es el que ya está montado, ligado a la hoja de cálculo.

1. Cree la hoja y entre por **Extensiones → Apps Script**.
2. Cree cinco archivos con el contenido de `apps-script/registro/`:
   `Config.gs`, `Api.gs`, `Hoja.gs`, `Validaciones.gs`, `Correo.gs`.
   **No lleva ningún archivo HTML**: este servicio no atiende personas.
3. En **Configuración del proyecto**, muestre `appsscript.json` y pegue el de
   esa misma carpeta.
4. `Config.gs` **ya viene con los valores reales**: el correo que recibe el
   aviso y `ID_HOJA_HOLCIM` vacío. No hay nada que escribir. Solo se toca si
   cambian los destinatarios o si algún día aparece una segunda hoja.
5. Ejecute **`prepararHojas`** y acepte los permisos.
6. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
7. Copie la URL `/exec`. **Esta no se le comparte a nadie**: es solo para el
   otro proyecto. Ábrala para comprobar; debe responder un JSON.

## 2. Servicio de FORMULARIO

Es un proyecto **nuevo y aparte**, que no va ligado a ninguna hoja.

1. Entre a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Cree dos archivos de secuencia de comandos con el contenido de
   `apps-script/formulario/`: `Config.gs` y `Codigo.gs`.
3. Cree un archivo **HTML** llamado exactamente **`pagina`** y pegue
   `apps-script/formulario/pagina.html`.
4. Muestre `appsscript.json` y pegue el de esa carpeta. Es importante: es lo
   que mantiene los permisos en el mínimo.
5. `Config.gs` **ya trae la dirección del servicio de registro**. Solo hay que
   cambiarla si vuelve a publicar ese servicio como implementación nueva, cosa
   que no debería pasar: los cambios van siempre con *Administrar
   implementaciones → ✏️ → Versión nueva*, que conserva la dirección.
6. Ejecute **`probarEnlace`**. Debe responder el JSON del otro servicio. Si
   responde otra cosa, la URL quedó mal copiada.
7. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Usuario que accede a la app web**
   - Quién tiene acceso: **Cualquier usuario con una cuenta de Google**
8. Copie esa URL. **Esta sí es la que se comparte.**

## 3. Comprobar

| Prueba | Resultado esperado |
|---|---|
| Abrir el enlace del formulario en incógnito | Pide iniciar sesión con Google |
| Después de entrar | Sale el formulario, y donde iba el correo aparece *"Registrando con su cuenta de Google"* con su dirección |
| Registrar una empresa | Fila en la hoja, con esa dirección en *Diligenciado por* |
| El correo de aviso | Llega a `NOTIFICAR_A`, con copia a quien diligenció |

### Cambiar entre correo automático y correo escrito

El código sirve para los dos modos sin tocar una línea. Lo decide la
implementación del FORMULARIO:

| Ejecutar como | Quién tiene acceso | Resultado |
|---|---|---|
| Usuario que accede | Cualquier usuario con cuenta de Google | El correo sale de la sesión. Sale la pantalla de "no verificada". |
| **Yo** | **Cualquier usuario** | Sin inicio de sesión ni pantalla de aviso. La página muestra sola el campo para escribir el correo. |

Para cambiar: **Administrar implementaciones → ✏️**, mueva los dos desplegables,
**Versión: Nueva**. Nada más. La página pregunta al servidor si hay sesión; si
no la hay, saca el campo.

Lo que se pierde al escribirlo: el correo lo pone la persona y podría poner
otro. Con sesión lo pone el servidor y no se puede alterar desde el navegador.

### La pantalla de "aplicación no verificada"

La primera vez, a cada proveedor le aparecerá un aviso de Google diciendo que
la aplicación no está verificada, con un **Configuración avanzada → Ir a
(no seguro)**. Es lo normal en un script propio sin verificar ante Google.

Lo que el proveedor ve después de *Revisar permisos* es un solo permiso:
**ver su dirección de correo electrónico**. La aplicación no puede leer sus
archivos ni nada más. Pero la palabra *Unverified* en rojo aparece antes, y de
cara a un tercero pesa.

Quitarla del todo exige un trámite, no un ajuste: hay que vincular el script a
un proyecto de Google Cloud propio, configurar allí la pantalla de
consentimiento —nombre, logotipo, correo de soporte, política de privacidad en
un dominio verificado— y, según los permisos, pasar una revisión de Google. Es
un proyecto con TI, no cosa de diez minutos.

La alternativa inmediata es la tabla de arriba: volver al correo escrito, donde
nadie inicia sesión y no aparece ningún aviso.

---

## Los datos de este montaje

Quedan escritos en el repositorio, así que **copiar y pegar los archivos es todo
lo que hay que hacer**: no queda nada por configurar a mano.

| Qué | Dónde está escrito |
|---|---|
| Correo que recibe el aviso | `registro/Config.gs` → `NOTIFICAR_A` |
| Dirección del servicio de registro | `formulario/Config.gs` → `URL_SERVICIO` |
| Copia en otra hoja | `registro/Config.gs` → `ID_HOJA_HOLCIM`, **vacío a propósito** |

La hoja donde vive el registro **no se configura en ninguna parte**: el script
está ligado a ella y la encuentra solo. Por eso `ID_HOJA_HOLCIM` va vacío —
poner ahí esa misma hoja fue lo que duplicó las filas.

## Qué se guarda

**EMPRESAS** — ID · Fecha · Tipo de solicitud · NIT · DV · Nombre empresa ·
Correo · Diligenciado por

Las filas se escriben **por nombre de columna**, no por posición. Así, cuando el
modelo cambia, una columna retirada queda vacía y una nueva se llena sola: nada
se descoloca, ni siquiera en las filas que ya existían. La columna `Teléfono`
sigue en la hoja con los datos viejos, y los registros nuevos simplemente la
dejan en blanco.

**ERRORES** — cualquier fallo del servicio, para no perderlo de vista.

Los datos entran normalizados: nombres en mayúscula sostenida, correos en
minúscula, teléfono como `+57` + 10 dígitos, NIT sin puntos y con su dígito
de verificación calculado aparte.

El correo de quien diligencia lo pone el servicio del formulario tomándolo de
la sesión, y **pisa cualquier valor que llegue de la página**: así nadie puede
registrar a nombre de otro manipulando el navegador.

## Copia en una hoja de Holcim

Cada registro se guarda dos veces: en la hoja de este script y en una hoja
propiedad de Holcim.

1. En la cuenta de **Holcim**, cree la hoja destino.
2. Compártala **con permiso de Editor** con la cuenta que ejecuta el registro.
3. Copie el identificador de su dirección:
   `docs.google.com/spreadsheets/d/`**`ESTO`**`/edit`
4. Péguelo en el `Config.gs` del registro: `ID_HOJA_HOLCIM: '1AbC...XyZ'`.
5. Ejecute **`probarCopiaEnHolcim`**. Si responde con el nombre de la hoja, ya
   quedó, y sus pestañas se crearon solas.

**Si la copia falla** —permisos revocados, hoja borrada, sin conexión— el
registro principal **igual queda guardado** y el fallo se anota en `ERRORES`.

Para dejar de copiar, borre el identificador: `ID_HOJA_HOLCIM: ''`.

## Avisos por correo

Cada registro manda un correo a `CONFIG.NOTIFICAR_A` diciendo qué se registró y
quién lo hizo, **con copia a quien diligenció** como constancia. Para probarlo
sin tocar la hoja, ejecute `pruebaDeCorreo` desde `Correo.gs` del registro.

Para apagarlos, deje la lista vacía: `NOTIFICAR_A: []`.

Si el envío falla, el registro **igual queda guardado** y el fallo se anota en
`ERRORES`. Cuota de una cuenta personal: 100 correos al día.

## Al cambiar el código

**Implementar → Administrar implementaciones → ✏️ → Versión: Nueva.**
Así la URL no cambia. "Nueva implementación" crea otra distinta, con otra
dirección, y deja la anterior viva sirviendo el código viejo.

Recuerde que son dos proyectos: mire cuál de los dos tocó.

## En qué cuenta vive todo esto

Ver la sección correspondiente en el historial del repositorio: hoy está en una
cuenta personal porque el dominio de Holcim no permite publicar aplicaciones con
acceso externo. El procedimiento para pasarlo a Holcim, cuando TI lo habilite,
está en `docs/SOLICITUD-TI.md` y en las notas de esta misma guía.
