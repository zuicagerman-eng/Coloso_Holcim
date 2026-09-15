# Reporte de vencimientos por planta

Sustituye el PDF adjunto por un **enlace** que cada planta abre en el navegador.
El Excel se mantiene, para quien necesite trabajar los datos.

```
Matriz de Capacitaciones H&S  ──►  aplicación web  ──►  enlace por planta
   (solo lectura)                   ?planta=HC-BELLO      abre en el navegador
```

Solo pueden abrirlo cuentas de `holcim.com`. Cada enlace **abre en su planta**,
que es lo único que viaja al cargar; las demás se piden al servidor solo si
alguien las elige en el selector.

Eso es un cambio deliberado respecto al diseño inicial: antes una planta no
podía ver a las otras porque sus datos no llegaban nunca al navegador. Ahora sí
puede, a petición. Se decidió así porque quien abre es siempre una cuenta
corporativa y los coordinadores necesitan comparar entre plantas. Para volver al
comportamiento anterior basta con que `registrosDeOtraPlanta()` compruebe que la
planta pedida es la del enlace.

## Archivos

| Archivo | Qué es |
|---|---|
| `ReporteWeb.gs` | Lee la matriz, arma los datos y publica la aplicación web |
| `reporte.html` | El tablero, tal cual se diseñó, con los datos inyectados al abrirlo |

El estándar de cada curso viaja aparte, como una tabla de 62 entradas, y no
repetido en cada registro: por eso el filtro nuevo no le suma peso al enlace.

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

**El filtro por estándar se busca solo.** En la barra, antes del desplegable de
cursos, hay uno de **estándares**: el estándar agrupa varias capacitaciones (todo
lo de alturas cuelga del mismo), y al elegirlo el desplegable de cursos se reduce
a los suyos. El estándar vive en una fila de encabezado de la matriz, combinada
sobre varias columnas. Qué fila es no está fijado: el script mira las filas por
encima del nombre del curso y descarta la que rotula la matriz entera, la que
trae un valor distinto por curso y la de puros números, y se queda con la que
más códigos de estándar trae. `probar()` escribe qué fila eligió y con qué
estándares. Si se equivoca, se fija el número en `CFG.FILA_ESTANDAR` y deja de
buscar.

Si no encuentra ninguno, el desplegable no aparece y el tablero funciona igual
que antes.

**El filtro por mes** sale de la fecha de vencimiento (`AAAA-MM`). Quien nunca ha
hecho el curso no tiene fecha, así que al filtrar por mes queda fuera: no vence
en ninguno. Con menos de dos meses distintos el desplegable se esconde.

**La fecha tentativa de la solicitud es opcional.** El campo es un calendario
del navegador, así que no depende del formato que tenga el equipo, y no admite
días anteriores a mañana. Debajo se repite en palabras para que no se confunda
08/10 con 10/08. `fechaTentativa()` la vuelve a validar en el servidor —que
exista, que no sea pasada, que el año sea razonable— y si no cuadra la ignora en
silencio en vez de tumbar la solicitud. Cuando viene, sale destacada en el correo
y en el asunto.

**El correo del martes va totalizado.** Una fila por tipo de capacitación con
cuántas **personas** están vencidas, por vencer o sin realizar, no el listado
persona por persona: eso vive en el enlace, que es donde se puede filtrar,
buscar y solicitar. Se cuentan personas distintas, así que alguien a quien le
falten dos cursos de alturas cuenta una vez en esa fila —y otra vez en las
demás filas donde tenga algo, por eso el total de abajo se dice aparte.

Las vencidas ya no se recortan a los últimos treinta días. Ese recorte existía
para que la tabla no se hiciera enorme; con la tabla totalizada ya no hace
falta, y mantenerlo escondía justo los peores casos: alguien vencido hace
doscientos días no aparecía por ningún lado.

**Las fechas del correo se escriben a mano en español.** `Utilities.formatDate`
con `MMMM` toma el idioma del proyecto de Apps Script, que está en inglés, y en
el correo salía «con corte al 15 de September de 2026». Para eso está
`fechaEnEspanol()`.

**El envío semanal no manda dos veces lo mismo.** Apps Script corta cualquier
ejecución a los seis minutos, y dieciséis correos con Excel adjunto pueden
acercarse. Si eso pasara, unas plantas habrían recibido y otras no, sin registro
de cuáles. Por eso cada planta se apunta en cuanto sale, el envío se detiene
solo a los `MINUTOS_MAXIMOS` y volver a ejecutarlo sigue por donde quedó.
`verEnviosDeHoy()` dice cómo va sin tocar nada, y `olvidarEnviosDeHoy()` borra la
marca cuando de verdad se quiere repetir un envío el mismo día.

La marca es por día y por planta, así que el activador del martes no repite lo
que se haya mandado a mano esa misma mañana.

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
