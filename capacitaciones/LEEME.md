# Entorno de capacitaciones — fase 1: catálogo y visor

Sube capacitaciones, las muestra partidas en partes y deja entrar tanto a
empleados de Holcim como a contratistas sin cuenta. Sin servidor: una hoja de
cálculo, un script y una carpeta de Drive.

```
Carpeta de Drive          Libro de cálculo              La aplicación
 el material         ◄──   CURSOS · MODULOS      ──►   catálogo → curso → parte
 (HTML, PDF, video)        ASISTENCIAS · ERRORES        │
                                                        └─ sirve el material con
                                                           los permisos del dueño
```

Lo que hace que un contratista sin cuenta de Google pueda ver un PDF que vive
en Drive: **el script lo lee con los permisos de quien publicó**, no con los del
visitante. Nunca hay que compartir nada de Drive con nadie de afuera.

## Montarlo

1. Cree la hoja de cálculo en la unidad compartida del área:
   `Capacitaciones — Holcim`.
2. **Extensiones → Apps Script**, y cree los archivos con el mismo nombre y
   contenido que hay aquí:
   - Script: `Config.gs`, `Acceso.gs`, `Datos.gs`, `Web.gs`
   - HTML: `estilos`, `puerta`, `catalogo`, `curso`, `modulo`, `error`
3. En **Configuración del proyecto**, marque *Mostrar `appsscript.json`* y pegue
   el de aquí.
4. Ejecute **`prepararLibro`** una vez y acepte los permisos. Se crean las
   cuatro pestañas y queda un curso de ejemplo.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario de Holcim**

Abra la URL que termina en `/exec`: ahí está el catálogo.

## Subir una capacitación

Dos filas, sin tocar código.

**En `CURSOS`**, una por curso:

| ID | Nombre | Descripción | Vigencia (meses) | Dirigido a | Activo |
|---|---|---|---|---|---|
| CUR-002 | Trabajo en alturas | Para quien suba a estructura | 24 | Planta | Sí |

`Activo` en **No** lo saca del catálogo sin borrar nada.

**En `MODULOS`**, una por cada parte del curso — esto es la segmentación:

| ID | Curso | Orden | Nombre | Tipo | Origen | Minutos |
|---|---|---|---|---|---|---|
| MOD-010 | CUR-002 | 1 | Presentación | HTML | *(enlace del archivo en Drive)* | 20 |
| MOD-011 | CUR-002 | 2 | Video | VIDEO | *(enlace de YouTube)* | 8 |
| MOD-012 | CUR-002 | 3 | Cartilla | PDF | *(enlace del archivo en Drive)* | 10 |
| MOD-013 | CUR-002 | 4 | Evaluación | ENLACE | *(dirección del formulario)* | 5 |

En `Origen` puede pegar el enlace completo de Drive o solo el identificador: da
igual, el script saca lo que necesita.

## Los cuatro tipos

| Tipo | De dónde sale | Con público externo |
|---|---|---|
| **HTML** | Un archivo `.html` en Drive. Lo sirve el script | ✅ Funciona siempre. Es el mejor formato |
| **PDF** | Un archivo en Drive. El script lo incrusta en la página | ✅ Hasta `MAXIMO_PDF_MB` (10 MB) |
| **VIDEO** | YouTube (oculto) o un archivo de Drive | ⚠️ Solo YouTube, o el archivo compartido con enlace: el video no pasa por el script |
| **ENLACE** | Cualquier dirección | ✅ Se abre en pestaña nueva |

El HTML debe ser **un solo archivo**: imágenes incrustadas como `data:`, o
apuntando a una dirección pública. Los videos, nunca dentro del HTML — pesan
demasiado; se ponen como una parte aparte de tipo `VIDEO`.

## Contratistas y personal sin cuenta de Holcim

1. Publique con acceso **"Cualquier usuario"**.
2. Llene `CONFIG.CLAVES`, una por convocatoria o por empresa. `nuevaClave` arma
   cada una desde el editor.

Sin clave válida no se entrega nada: **ni el catálogo, ni el material**. Y la
clave viaja en los enlaces del entorno, porque quien entra así no tiene sesión
de Google donde recordarla.

> Si en el desplegable no aparece "Cualquier usuario", es la política del
> dominio. El pedido a TI está en [`../docs/SOLICITUD-TI.md`](../docs/SOLICITUD-TI.md).

## Probar sin Google

    node pruebas/capacitaciones.js

Comprueba el enrutador, el control de acceso y cómo se resuelve cada tipo de
parte, con dobles de Sheets y Drive.

## Lo que falta (fases 2 a 4)

Asistencia, vencidos y reportes. La pestaña `ASISTENCIAS` ya se crea vacía y
espera. El diseño completo está en
[`../docs/ENTORNO-CAPACITACIONES.md`](../docs/ENTORNO-CAPACITACIONES.md).

Cada vez que cambie el código: **Implementar → Administrar implementaciones →
Editar → Versión nueva.**
