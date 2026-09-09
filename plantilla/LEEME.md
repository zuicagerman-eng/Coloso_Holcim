# Plantilla: publicar una pantalla dentro de Holcim

Convierte **cualquier archivo HTML** en una página con dirección propia,
privada por omisión, sin servidor y sin instalar nada. Una presentación de
reinducción, un instructivo, un tablero, una calculadora: si es un HTML, esto
lo publica.

Son 10 minutos.

## Qué hace

```
su-archivo.html
     │  se pega en el archivo `pagina`
     ▼
Apps Script  Publicar.gs   decide quién puede verlo
     │
     ├── restringido al dominio  →  entra cualquiera con sesión @holcim.com
     └── abierto + claves        →  pide la clave; sin ella no entrega nada
     │
     └──►  hoja VISITAS (opcional): fecha · correo · con qué clave entró
```

La diferencia con el registro de empresas: allá la página se entrega siempre y
lo protegido son los datos. Aquí **lo protegido es la página**, así que el
contenido no sale del servidor hasta que la clave sea válida. Quien no entró
nunca recibió la presentación.

## Montarlo

1. Vaya a [script.google.com](https://script.google.com) **con la cuenta de
   Holcim** → *Proyecto nuevo*.
2. Cree los archivos con el mismo nombre y contenido que hay aquí:
   - `Config.gs` y `Publicar.gs` (**+ → Script**)
   - `puerta` y `pagina` (**+ → HTML**)
3. **Pegue su HTML en `pagina`**, reemplazando todo. Debe ser un solo archivo:
   si tiene imágenes, incrústelas como `data:` o apúntelas a una dirección
   pública. Si tiene PDF o video, súbalos a Drive y enlácelos.
4. En `Config.gs` ponga el `TITULO`.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario de Holcim** ← el predeterminado
6. Copie la URL que termina en `/exec`. Esa es la dirección que se reparte.

## ¿Y si quien tiene que verla no tiene cuenta de Holcim?

Contratistas, personal nuevo, aprendices, terceros. Entonces:

1. Publique con acceso **"Cualquier usuario"**.
2. Llene `CONFIG.CLAVES` — una por grupo o por convocatoria, no una sola para
   todos. Ejecute `nuevaClave` desde el editor para armar cada una.

Sin clave válida, la página no se entrega. Y retirarle el acceso a un grupo es
borrar su línea de `CLAVES` y volver a implementar: la dirección no cambia y
los demás no se enteran.

> En el Workspace de Holcim la opción "Cualquier usuario" puede estar
> deshabilitada. Es el mismo bloqueo del formulario de proveedores; el pedido a
> TI está en [`../docs/SOLICITUD-TI.md`](../docs/SOLICITUD-TI.md).

## Constancia de quién la abrió

Opcional y apagada por omisión. Ponga en `CONFIG.REGISTRAR_EN` el
identificador de una hoja de Holcim —compartida como Editor con la cuenta que
ejecuta el script— y cada apertura queda anotada en la pestaña `VISITAS`:

| Fecha | Correo | Autorizado a | Página |
|---|---|---|---|

El correo sale solo si quien entra tiene sesión de Holcim; si entró con clave,
queda a qué grupo se le entregó. Para una reinducción, eso es la constancia de
quién la vio.

Compruébelo con `probarRegistro` desde el editor. Si el registro falla, la
página se entrega igual: nadie se queda sin ver la capacitación porque la hoja
esté caída.

> Anota **una fila por apertura**, no una por persona. Para saber quién
> completó qué —y a quién se le venció— eso se arma aparte, con las listas de
> asistencia: ver [`../docs/ENTORNO-CAPACITACIONES.md`](../docs/ENTORNO-CAPACITACIONES.md).

## Cada vez que cambie el HTML

**Implementar → Administrar implementaciones → Editar → Versión nueva.** Si no,
la dirección sigue sirviendo la versión anterior.

Y guarde el archivo en la carpeta del área: lo que vive solo dentro de Apps
Script se pierde el día que alguien borre el proyecto.
