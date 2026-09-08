# Conectar el formulario a la hoja de cálculo

Son cuatro pasos, unos 15 minutos.

## Antes de empezar: ¿en qué cuenta se crea?

**En la cuenta de Holcim, no en una personal.** La hoja, el script y los datos
pertenecen a quien los crea, y aquí se van a guardar cédulas, correos y teléfonos
de terceros.

| | Cuenta Holcim | Cuenta personal |
|---|---|---|
| Dueño de los datos | Holcim | Una persona |
| Si esa persona sale de la empresa | No pasa nada | Holcim pierde la base |
| Responsable ante la ley de datos (1581 de 2012) | La empresa, como debe ser | Un particular |
| Correos por día | 1.500 | 100 |
| Restringir el acceso a `@holcim.com` | Sí | No existe |

Además, **cree la hoja en una unidad compartida** del área, no en "Mi unidad" de
alguien. Una unidad compartida pertenece al equipo: si el dueño se va o le
desactivan la cuenta, el archivo sigue ahí.

Cuidado con un detalle tonto que pasa seguido: si tiene la sesión abierta con una
cuenta personal, Google crea el archivo **en esa**. Verifique arriba a la derecha
antes de crear la hoja.

### ¿Y si quiere probar hoy, sin esperar permisos?

Puede montarlo en una cuenta personal **solo para ensayar, y solo con datos
inventados**. Nunca con proveedores reales.

Eso sí, después no se "mueve": Google normalmente no deja transferir la propiedad
de un archivo entre una cuenta personal y un dominio corporativo. Lo que se hace
es **volver a montarlo** en la cuenta de Holcim, y eso cuesta 15 minutos porque
el código está en este repositorio. Esa es justamente la razón de tenerlo aquí:
la hoja se vuelve a crear, el código no se vuelve a escribir.

## 1. Crear la hoja y el script

1. Cree una hoja de cálculo nueva en Drive: `Registro Empresas y Personas`.
2. Menú **Extensiones → Apps Script**.
3. Borre el `Código.gs` de ejemplo y cree estos archivos con el mismo nombre y
   contenido que en `apps-script/`:
   `Config.gs`, `Api.gs`, `Hoja.gs`, `Validaciones.gs`, `Correo.gs`.
4. Con el **+ → HTML**, cree un archivo llamado **`pagina`** y pegue el
   contenido de `apps-script/pagina.html`. Ese es el formulario.
   No hay más archivos HTML: el correo de aviso se arma dentro de `Correo.gs`.
5. En **Configuración del proyecto**, marque *Mostrar el archivo de manifiesto
   `appsscript.json`* y pegue el contenido de `apps-script/appsscript.json`.

> Con `clasp` es más corto: `clasp create --type sheets --rootDir apps-script` y `clasp push`.

## 2. Poner los correos que reciben el aviso

En `Config.gs`, arriba del todo:

```js
NOTIFICAR_A: ['su.correo@holcim.com'],
```

Ejecute la función **`prepararHojas`** una vez y acepte los permisos.
Se crean las hojas `EMPRESAS`, `PERSONAS` y `ERRORES`.

## 3. Publicar el servicio

**Implementar → Nueva implementación → Aplicación web**:

- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario**

Esas dos opciones juntas son la clave:

- *Cualquier usuario* deja entrar a proveedores y contratistas, que **no
  tienen cuenta de Holcim**. Si aquí pone "Usuarios de holcim.com", Google
  les pide iniciar sesión y no pueden diligenciar.
- *Ejecutar como: Yo* hace que la escritura en la hoja y el envío del correo
  ocurran con **sus** permisos. Nadie de afuera necesita acceso a la hoja, ni
  la ve, ni puede abrirla: solo ve el formulario.

Copie la URL que termina en `/exec`. **Ábrala en el navegador: ahí está el
formulario.** Esa es la dirección que se comparte.

> Al cambiar el acceso, la URL cambia de forma: la restringida al dominio se
> ve como `script.google.com/a/macros/holcim.com/s/…`, y la pública como
> `script.google.com/macros/s/…`. Vuelva a copiarla del cuadro de diálogo.

Para comprobar que el servicio responde, agréguele `?ping=1` al final:

```json
{"ok":true,"servicio":"Registro de Empresas y Personas — Holcim","listo":true}
```

## 4. ¿Y el archivo suelto?

No hace falta: la página servida por Apps Script **es** el formulario, y así
Google exige sesión del dominio y registra quién diligencia. La página se
acomoda sola al entorno; no hay que configurarle nada.

El archivo `vista/index.html` sigue sirviendo para dos cosas: mostrar el
formulario sin montar nada, y como **única fuente** del diseño. Cuando lo
cambie, regenere la página del servidor con

```bash
python3 herramientas/generar-pagina.py
```

y vuelva a pegar `apps-script/pagina.html` en el editor.

### Solo si necesita abrirlo como archivo local

Requiere publicar con acceso **"Cualquier usuario"** y llenar, en el bloque
`var API` de `vista/index.html`, la `url` y el `token` de `Config.gs`. Con la
publicación restringida al dominio esta vía **no funciona**: el navegador no
puede entregarle a Google la sesión del usuario.

> Cada vez que cambie el código en Apps Script hay que hacer
> **Implementar → Administrar implementaciones → Editar → Versión nueva**.
> Si no, la URL sigue sirviendo la versión anterior.

## Verificación

| Prueba | Resultado esperado |
|---|---|
| Abrir la URL `/exec` en el navegador | Aparece el formulario |
| Abrir la URL `/exec?ping=1` | El JSON con su correo en `usuario` |
| `pruebaDeEscritura` desde el editor | Fila nueva en `EMPRESAS`, sin pasar por el formulario |
| Registrar una empresa desde el formulario | Fila en `EMPRESAS` y radicado `EMP-2026-0001` en pantalla |
| Registrar la misma empresa otra vez | "Ya hay una empresa registrada con el NIT…" |
| Ir al paso 2 | La empresa aparece en la lista desplegable |
| Registrar persona con cédula repetida | La rechaza |
| Abrir el enlace en una ventana de incógnito | Debe salir el formulario **sin pedir cuenta de Google** |
| Registrar una empresa | Llega el correo de aviso a `NOTIFICAR_A` |

## Bloqueo conocido: el dominio no permite publicar en abierto

En el Workspace de Holcim, el desplegable **"Usuarios con acceso"** solo ofrece
*Solo yo* y *Cualquier usuario de Holcim*, incluso con "Ejecutar como: Yo"
correctamente seleccionado. **Falta la opción "Cualquier usuario".**

No es un error de configuración del proyecto: el administrador de Google
Workspace tiene deshabilitada la publicación de aplicaciones de Apps Script con
acceso anónimo. En muchas organizaciones esa política va atada a la de compartir
archivos fuera del dominio.

Mientras eso siga así, un proveedor externo no puede abrir el formulario.

### Camino elegido: cuenta personal

Se decidió montarlo en una **cuenta personal de Google**, donde la opción
"Cualquier usuario" sí está disponible, y pasarlo a Holcim más adelante.

Funciona igual: mismo código, misma hoja, mismo formulario. Dos diferencias
que conviene tener presentes:

- **Cuota de correo:** 100 envíos al día en cuenta personal (1.500 en
  Workspace). De sobra para este volumen.
- **El aviso llega igual al correo de Holcim.** En `NOTIFICAR_A` va la
  dirección `@holcim.com`; quien envía es la cuenta personal.

#### Cómo pasarlo a Holcim después

No es un traslado: Google no permite transferir la propiedad de un archivo
entre una cuenta personal y un dominio corporativo. Es una copia.

1. Desde la cuenta personal, comparta la hoja con la cuenta de Holcim.
2. Desde la cuenta de Holcim: **Archivo → Hacer una copia**. La copia ya es
   propiedad de Holcim; déjela en la unidad compartida del área.
3. En esa copia, **Extensiones → Apps Script**, y pegue de nuevo los archivos
   desde este repositorio. Son 15 minutos: el código no se reescribe.
4. Publique la aplicación web desde la cuenta de Holcim. **Aquí reaparece el
   bloqueo del dominio**, así que este paso solo tiene sentido cuando TI haya
   habilitado la publicación anónima.
5. La URL cambia. Avise a quien tenga la anterior.

Mientras tanto, los datos viven en una cuenta personal. Es una situación
temporal y conviene tratarla como tal.

### Salidas, en orden de preferencia

1. **Pedir a TI que habilite la publicación anónima** para esta cuenta o para
   este proyecto. Es lo más limpio: el día que lo habiliten, se cambia un
   desplegable y todo lo demás ya está hecho. Texto sugerido para el pedido en
   `docs/SOLICITUD-TI.md`.

2. **Google Forms**, si el dominio sí permite formularios públicos. Se pierde la
   interfaz a la medida y la lista de empresas encadenada, pero el Sheet y el
   aviso por correo funcionan igual. Comprobación rápida: cree un formulario y
   mire si puede desmarcar *"Restringir a usuarios de Holcim"*.

3. **Alojar el formulario fuera de Google** y escribir en la hoja con una cuenta
   de servicio y la API de Sheets. Es la opción de la "Fase 2" del análisis de
   plataforma: funciona sin depender de esta política, pero exige servidor,
   credenciales y aprobación de TI de todos modos.

## Qué implica que el formulario sea público

Quien diligencia es externo a Holcim, así que el formulario **no puede pedir
inicio de sesión**. La contrapartida es la misma de cualquier formulario
público, incluido un Google Form: quien tenga el enlace puede enviar datos.

Lo que sí está protegido:

- **La hoja no se expone.** Nadie de afuera la ve ni la abre. El formulario
  escribe con los permisos del dueño, no con los del visitante.
- **Solo se puede escribir lo que el formulario permite.** El servidor valida
  todo otra vez y rechaza lo que no cumpla; no hay forma de leer lo ya
  registrado desde afuera, salvo la lista de empresas que el paso 2 necesita.
- **Duplicados controlados** por NIT y por cédula.

Lo que queda expuesto es que alguien mande registros basura si consigue el
enlace. Si algún día pasa, las salidas son: pedir un dato que solo el
proveedor real conozca (una orden de compra, por ejemplo) o mover el
formulario detrás del portal de proveedores.

## Qué se guarda

**EMPRESAS** — ID · Fecha · NIT · DV · Nombre empresa · Correo · Teléfono

**PERSONAS** — ID · Fecha · Nombres · Primer apellido · Segundo apellido ·
Nombre completo · Cédula · Correo · NIT empresa · Nombre empresa

**ERRORES** — cualquier fallo del servicio, para no perderlo de vista.

Los datos entran normalizados: nombres en mayúscula sostenida, correos en
minúscula, teléfono como `+57` + 10 dígitos, NIT sin puntos y con su dígito
de verificación calculado aparte.

## Avisos por correo

Cada registro manda un correo a `CONFIG.NOTIFICAR_A` diciendo **qué** se
registró y **quién** lo hizo. Para probarlo sin tocar la hoja, ejecute la
función `pruebaDeCorreo` desde `Correo.gs`.

Para apagarlos, deje la lista vacía: `NOTIFICAR_A: []`.

Si el envío falla, el registro **igual queda guardado** y el fallo se anota
en la hoja `ERRORES`. Nunca se pierde un dato por culpa del correo.

Cuota de Google Workspace: 1.500 correos al día.
