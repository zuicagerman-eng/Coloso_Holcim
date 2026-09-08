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
- Quién tiene acceso: **Usuarios de holcim.com**

Copie la URL que termina en `/exec`. **Ábrala en el navegador: ahí está el
formulario.** Esa es la dirección que se le comparte a la gente.

Para comprobar que el servicio responde, agréguele `?ping=1` al final:

```json
{"ok":true,"servicio":"Registro de Empresas y Personas — Holcim","usuario":"quien.sea@holcim.com"}
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
| Registrar una empresa | La columna *Registrado por* trae el correo de quien la registró |

## Sobre el acceso "Cualquier usuario"

> Con la cuenta de Holcim existe la opción de publicar solo para
> **"Usuarios de holcim.com"**, que resuelve de raíz lo que viene abajo.
> Con una cuenta personal esa opción no aparece.

Un formulario en un archivo HTML suelto no puede autenticarse contra Google, así
que el servicio se publica abierto y el `TOKEN` es lo que evita escrituras de
terceros. **El token viaja dentro del HTML**: quien tenga el archivo puede leerlo.
Sirve contra curiosos, no contra alguien decidido.

Si eso no es aceptable para Holcim, la alternativa es servir el formulario
**desde el propio Apps Script** (`doGet` devolviendo la página) y publicar con
acceso *"Usuarios de holcim.com"*. Ahí Google exige sesión del dominio, el token
sobra y queda registrado quién entra. El costo es que la página deja de ser un
archivo que se abre con doble clic.

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
