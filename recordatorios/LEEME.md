# Reporte de vencimientos por planta

Sustituye el PDF adjunto por un **enlace** que cada planta abre en el navegador.
El Excel se mantiene, para quien necesite trabajar los datos.

```
Matriz de Capacitaciones H&S  ──►  aplicación web  ──►  enlace por planta
   (solo lectura)                   ?planta=HC-BELLO      abre en el navegador
```

Solo pueden abrirlo cuentas de `holcim.com`, y cada enlace lleva **únicamente**
los datos de su planta: el filtrado ocurre en el servidor, así que el HTML que
llega al navegador no contiene información de las demás.

## Archivos

| Archivo | Qué es |
|---|---|
| `ReporteWeb.gs` | Lee la matriz, arma los datos y publica la aplicación web |
| `reporte.html` | El tablero, tal cual se diseñó, con los datos inyectados al abrirlo |

## Puesta en marcha

Se trabaja en el proyecto de Apps Script del archivo D6 (**Extensiones → Apps Script**).

**1. Crear los dos archivos**

- `+` → **Secuencia de comandos** → nombrarla `ReporteWeb` → pegar `ReporteWeb.gs`
- `+` → **HTML** → nombrarlo exactamente **`reporte`** → borrar lo que traiga y pegar `reporte.html`

El nombre `reporte` importa: el código lo busca por ese nombre.

**2. Comprobar antes de publicar**

Seleccionar la función **`probar`** y ejecutarla. Pedirá autorización la primera vez.
No envía correos ni publica nada: solo lee y cuenta.

En **Ver → Registros** aparece cuántas personas activas hay, cuántos vencimientos
por urgencia y por planta, y dos avisos que conviene mirar:

- **divisiones sin correo configurado** — sus personas quedan fuera del reporte
- **cursos sin categoría** — salen como «Interna / formación»

**3. Publicar la aplicación web**

**Implementar → Nueva implementación → Aplicación web**

| Campo | Valor |
|---|---|
| Ejecutar como | **Yo** |
| Quién tiene acceso | **Cualquier usuario de holcim.com** |

«Ejecutar como: yo» es necesario para que el script pueda leer la matriz sin dar
acceso al archivo a cada persona. «Cualquier usuario de holcim.com» exige que
quien abra el enlace esté con su cuenta corporativa.

**4. Probar el enlace**

Ejecutar `probar()` otra vez: al final del registro imprime un enlace de ejemplo.
Abrirlo y revisar que el tablero se vea bien.

**5. Activar el correo**

Cuando el enlace funcione:

1. En `ReporteWeb.gs`, cambiar `ENVIAR_CORREOS` a `true`.
2. **⏰ Activadores** → editar el activador del martes y apuntarlo a
   **`enviarEnlacesSemanales`** en vez de `enviarRecordatoriosCapacitaciones`.

Antes de cambiar el activador conviene ejecutar `enviarEnlacesSemanales()` a mano
con `ENVIAR_CORREOS` todavía en `false`: escribe en el registro qué le tocaría a
cada planta, sin mandar nada.

## Al hacer cambios después

Para modificar el código y que **el enlace siga siendo el mismo**:

> **Implementar → Administrar implementaciones** → lápiz ✏️ → Versión: **Nueva** → Implementar

Si en vez de eso se crea una *implementación nueva*, **la URL cambia** y los
enlaces de los correos anteriores dejan de servir.

## Lo que hay que saber

**Los pendientes no están en el tablero.** Quien nunca ha hecho un curso no
aparece: el diseño tiene cinco urgencias y todas se calculan sobre una fecha de
vencimiento. El correo anterior sí los incluía. Añadirlos son seis retoques al
HTML (un token de color, una entrada en `URG`, `URG_ORDER` y `URG_COLOR`, y las
reglas de CSS que enumeran cada urgencia).

**La exportación a CSV del tablero puede no funcionar.** Las aplicaciones web de
Apps Script corren dentro de un marco con restricciones y las descargas que
genera la propia página suelen quedar bloqueadas. Imprimir sí funciona, y el
Excel adjunto al correo cubre esa necesidad.

**La ventana es de 60 días**, tomada de los datos del HTML original. Se cambia en
`CFG.VENTANA_DIAS`.

**Los cursos omitidos se comparan normalizados.** Los nombres de curso de la fila
6 traen espacios al inicio, y la comparación exacta del script anterior fallaba
con ellos: cursos que debían quedar fuera del reporte podían estar apareciendo.

**Divisiones sin correo.** Solo se reportan las plantas listadas en
`CORREOS_PLANTA`. Las personas de una división que no esté ahí no aparecen en
ningún enlace, y `probar()` las nombra para que no pase inadvertido.

**La matriz solo se lee.** No hay en este código ninguna instrucción que escriba,
borre o modifique el archivo D6.
