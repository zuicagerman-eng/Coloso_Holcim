# Todo lo que hace falta, antes de empezar

Esta es la lista completa. Si la tiene entera, no se va a topar con una sorpresa
a la mitad.

Lo primero, para quitarlo del camino:

> **Para poner el registro a funcionar no hay que instalar nada.** Ni Python, ni
> Node, ni programas de desarrollador. Se hace todo con el navegador, pegando
> archivos en el editor de Apps Script. Los programas de la segunda lista solo
> hacen falta si va a **cambiar el código**, no para usarlo.

## Camino corto — poner a funcionar el registro

### 1. Cuentas y accesos

| Qué | Para qué | Si no lo tiene |
|---|---|---|
| **Cuenta de Google de Holcim** | Crear la hoja y el script; es la dueña de los datos | Se puede ensayar con una cuenta personal y datos inventados — nunca con proveedores reales |
| **Unidad compartida del área**, con permiso para crear archivos | Que la hoja sea del equipo y no de una persona | Pídala al administrador de Drive. Mientras tanto sirve "Mi unidad", pero es deuda |
| **Publicación con acceso "Cualquier usuario"** habilitada en el dominio | Que un proveedor sin cuenta de Holcim pueda abrir el formulario | Hoy está bloqueada. El pedido a TI está escrito en [`SOLICITUD-TI.md`](SOLICITUD-TI.md); mientras responden, se monta en cuenta personal |

Nada de esto se paga ni se instala: viene con Google Workspace.

### 2. Datos que hay que tener a la mano

Consígalos antes de sentarse, o va a tener que parar a mitad de camino:

- [ ] **Los correos que reciben el aviso** de cada registro (`NOTIFICAR_A`).
      Uno o varios, `@holcim.com`.
- [ ] **Las claves de acceso y a quién se le entrega cada una** (`CLAVES`): una
      por empresa o por convocatoria. Se arman solas con la función `nuevaClave`
      desde el editor; lo que hay que decidir es a quién van.
- [ ] **El identificador de la hoja de Holcim**, si quiere la copia
      (`ID_HOJA_HOLCIM`). Sale de la dirección de la hoja, y esa hoja debe estar
      compartida **como Editor** con la cuenta que ejecuta el script.
- [ ] **El logotipo oficial**, si lo quiere exacto. El que trae el repositorio es
      una reconstrucción; el bueno lo tiene Comunicaciones. Sin él funciona igual.

Los tres primeros se pueden dejar vacíos y llenarlos después: sin correos no
avisa, sin claves el formulario queda abierto, sin identificador no copia. Nada
se rompe.

### 3. Los archivos

Los de la carpeta `apps-script/` de este repositorio, que se copian y pegan en el
editor: `Config.gs`, `Api.gs`, `Hoja.gs`, `Validaciones.gs`, `Correo.gs`,
`appsscript.json` y `pagina.html`.

Se bajan de GitHub con **Code → Download ZIP**, o del `.zip` que esté en la
carpeta del área en la unidad compartida.

### 4. Tiempo

Unos 15 minutos de trabajo seguido, si tiene lo de arriba. Lo que puede tardar
días es el permiso de TI, y eso no depende de usted.

El paso a paso está en [`DESPLIEGUE.md`](DESPLIEGUE.md).

---

## Camino completo — cambiar el código

Solo si va a modificar el formulario o el script. Para usarlo, no.

| Programa | Versión | Para qué | ¿Obligatorio? |
|---|---|---|---|
| **Un editor de texto** | cualquiera | Escribir el código | Sí |
| **Python 3** | 3.8 o más nuevo | `herramientas/generar-pagina.py` (pasa la vista al servidor) y `herramientas/empaquetar.py` (arma el `.zip` de la unidad compartida) | Sí, si toca `vista/index.html` |
| **Node.js** | 18 o más nuevo | Correr las pruebas: `node pruebas/claves.js` y las otras dos | Muy recomendable |
| **Git** | cualquiera | Bajar y subir cambios al repositorio | Sí, si trabaja contra el repositorio |
| **clasp** | `npm install -g @google/clasp` | Subir el código al proyecto de Apps Script sin copiar y pegar | No. Es comodidad |

Ninguno cuesta dinero y ninguno necesita servidor. Python y Node vienen
instalados en macOS y en la mayoría de Linux; en Windows se bajan de
`python.org` y `nodejs.org`. **clasp** además necesita Node, por eso va de
último: si no lo quiere instalar, copiar y pegar en el editor funciona igual.

### El orden en que se usan

```
editar vista/index.html
        │
        ▼
python3 herramientas/generar-pagina.py     ← deja apps-script/pagina.html al día
        │
        ▼
node pruebas/claves.js                     ← y las otras dos pruebas
        │
        ▼
pegar en el editor de Apps Script  (o  clasp push)
        │
        ▼
Implementar → Administrar implementaciones → Editar → Versión nueva
        │
        ▼
python3 herramientas/empaquetar.py         ← y suba el .zip a la unidad compartida
```

El último paso no es opcional aunque lo parezca: si el cambio se queda solo en
Apps Script, el área pierde la fuente. El porqué está en
[`PROGRAMAS.md`](PROGRAMAS.md), en *Dónde vive el código*.

## Lo que NO hace falta

Para que quede dicho, porque suele preguntarse:

- **Servidor, hosting o dominio.** Nada corre fuera de Google Workspace.
- **Base de datos.** La hoja de cálculo es la base.
- **Proveedor de correo.** El aviso lo manda Google con la cuenta que ejecuta el
  script.
- **Certificados, VPN o apertura de puertos.**
- **Licencias ni presupuesto.** Todo está incluido en Workspace o es gratuito.
- **Que el proveedor tenga cuenta de Google.** Entra con la clave que se le
  entregó, y nada más.
