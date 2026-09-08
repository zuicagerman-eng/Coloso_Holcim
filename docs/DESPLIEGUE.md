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
4. Cree un archivo **HTML** llamado literalmente `mail/notificacion` con el
   contenido de `apps-script/mail/notificacion.html`.
5. En **Configuración del proyecto**, marque *Mostrar el archivo de manifiesto
   `appsscript.json`* y pegue el contenido de `apps-script/appsscript.json`.

> Con `clasp` es más corto: `clasp create --type sheets --rootDir apps-script` y `clasp push`.

## 2. Poner la clave

En `Config.gs`, cambie `TOKEN` por una cadena propia, larga y sin sentido:

```js
TOKEN: 'hlc-7f3a91c4d8e2b6',
```

Ejecute la función **`prepararHojas`** una vez y acepte los permisos.
Se crean las hojas `EMPRESAS`, `PERSONAS` y `ERRORES`.

## 3. Publicar el servicio

**Implementar → Nueva implementación → Aplicación web**:

- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario**

Copie la URL que termina en `/exec`. Ábrala en el navegador: debe responder

```json
{"ok":true,"servicio":"Registro de Empresas y Personas — Holcim","listo":true}
```

## 4. Conectar el formulario

En `vista/index.html`, arriba del todo en el bloque `<script>`:

```js
var API = {
  url: 'https://script.google.com/macros/s/AKfy.../exec',
  token: 'hlc-7f3a91c4d8e2b6'      // la misma de Config.gs
};
```

Listo. Abra el archivo y registre una empresa: la fila aparece en la hoja.

> Cada vez que cambie el código en Apps Script hay que hacer
> **Implementar → Administrar implementaciones → Editar → Versión nueva**.
> Si no, la URL sigue sirviendo la versión anterior.

## Verificación

| Prueba | Resultado esperado |
|---|---|
| Abrir la URL `/exec` en el navegador | El JSON de arriba |
| `pruebaDeEscritura` desde el editor | Fila nueva en `EMPRESAS`, sin pasar por el formulario |
| Registrar una empresa desde el formulario | Fila en `EMPRESAS` y radicado `EMP-2026-0001` en pantalla |
| Registrar la misma empresa otra vez | "Ya hay una empresa registrada con el NIT…" |
| Ir al paso 2 | La empresa aparece en la lista desplegable |
| Registrar persona con cédula repetida | La rechaza |
| Cambiar el token del formulario y enviar | "No autorizado." |

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

Están listos pero apagados. Para encenderlos, en `Config.gs`:

```js
NOTIFICAR_A: ['compras@holcim.com', 'contratacion@holcim.com'],
```

Publique una versión nueva y desde ahí cada registro manda el correo.
Si el envío falla, el registro igual queda guardado y el fallo se anota
en la hoja `ERRORES`.
