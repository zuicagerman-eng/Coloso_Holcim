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

**Y nunca se archiva ni se borra una implementación cuyo enlace ya salió por
correo.** El enlace lleva dentro el identificador de esa implementación
concreta; si desaparece, Google responde «No se pudo abrir el archivo en este
momento» y los correos enviados quedan inservibles. No avisa: se descubre
cuando alguien intenta abrirlos.

**`ScriptApp.getService().getUrl()` no devuelve siempre lo mismo.** Depende de
desde dónde se ejecute: a mano desde el editor da una cosa, y disparado por el
activador del martes puede dar otra. Eso explica que `probarCorreo()` mandara
un enlace que abría y el envío de las siete mandara uno que no.

Por eso está `URL_APP`: se pega ahí la dirección `/exec` de la implementación
activa y manda esa, no lo que opine ScriptApp. `enlaceDeLaApp()` es el único
sitio donde se decide, y rechaza cualquier `/dev` —esa solo abre a los
editores del script, así que un correo con ella llega roto a las dieciséis
plantas sin que el remitente lo note, porque a él sí le abre—.

**Y antes de mandar, se comprueba que el enlace abre.** `elEnlaceAbre()` lo
pide con el token del script y mira el código de respuesta; si no es 200,
`enviarEnlacesSemanales()` aborta sin mandar nada y dice por qué. Dieciséis
correos con un enlace muerto no se pueden recoger.

`verEnlaceActual()` compara el enlace de ahora con el que llevaba el último
correo y dice si siguen coincidiendo. `enviarEnlacesSemanales()` anota el
enlace en cada envío, y se niega a enviar si `getUrl()` devuelve una URL `/dev`
—que solo abre a los editores del script—.

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

**`AVISO_CORREO` pone un recuadro al principio del correo**, para avisos de
una sola vez: una corrección, un cambio de fecha. Con `texto` vacío no sale
nada. Hay que **vaciarlo después de usarlo**, o el aviso de hoy vuelve a salir
el martes que viene cuando ya no significa nada; `enviarEnlacesSemanales()` lo
recuerda en el registro cada vez que envía con uno puesto.

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

**Los enlaces de los cursos en línea no se guardan en caché.** Iban dentro de
cada registro, y los registros sí se guardan: al cambiar una URL había que
publicar *y además* esperar a que venciera la caché para verla. Ahora
`CURSOS_CON_ENLACE` viaja al tablero como tabla y el enlace se resuelve al
pintar cada fila. Cambiar una URL solo exige publicar una versión nueva.

`enviarSolicitud()` sigue resolviéndolo en el servidor y no lo toma del
navegador: lo que va en un correo no se decide desde el cliente.

**El selector de plantas admite varias a la vez.** `state.plantas` es una lista
y la lista vacía significa «todas», para que ese caso no necesite un valor
especial que haya que recordar en cada comparación. Marcarlas todas a mano se
guarda como lista vacía, y desmarcar la última no se permite: dejaría la
pantalla en blanco sin decir por qué.

Con varias plantas a la vista una misma selección de solicitudes puede
mezclarlas. Por eso la planta viaja con **cada persona** y no con la solicitud,
`enviarSolicitud()` la resuelve contra la lista del servidor —nunca copia lo que
diga el navegador— y el correo añade una columna «Planta» solo cuando hay más
de una.

**La tabla del correo va por estándar**, con su número y su nombre completo tal
como están en la matriz, y con un subtotal de externas y otro de internas.
Cuando un estándar cubre varias categorías, se listan debajo en pequeño; cuando
cubre una sola no se repite, que no aporta nada.

**Los nombres de las urgencias están en `URG`, no en el servidor.** El servidor
solo clasifica (`urgenciaPorDias`: vencida · ≤7 · ≤15 · ≤30 · resto); cómo se
llama cada grupo se cambia en una línea del HTML. `lb` es el nombre largo —la
pastilla de cada fila, el pie—, `short` el corto, para las fichas y los
rótulos de sección donde hay menos espacio.

Las cuatro tarjetas **parten** el total: vencidas · vencen en 15 días · vencen
en 16–60 · sin realizar. Cada registro cae en una y solo una, así que los
cuatro números suman lo que está en vista. Antes la primera mezclaba vencidas
con las de ≤7, la tercera volvía a contar a las dos y no existía tarjeta para
el tramo de 16 a 60: los números no se podían sumar y no era evidente por qué.

Las fichas **son** ese reparto, así que se calculan sobre `base()` y no sobre
las filas ya filtradas: al pulsar una, las otras tres se iban a cero y decían
cosas falsas («todas se han hecho alguna vez») cuando lo único cierto era que
no quedaba ninguna *en el filtro puesto*. Los botones de urgencia ya lo hacían
bien; las fichas no. La que está puesta se marca, para que se vea que la lista
está recortada aunque los números de arriba no se hayan movido.

Salieron dos: «personas involucradas», cuyo promedio de cursos por persona no
llevaba a ninguna acción y que la pestaña «Por persona» ya da mejor, y
«registros en vista», que repetía el botón «Todas» de la fila de arriba.

**Los filtros viejos `urgente` y `d30` siguen respondiendo** aunque ninguna
tarjeta los use: los enlaces que la gente compartió los llevan en el `#` y
romperlos no vale la pena.

**«Movimiento reciente» no es historia, es deducción.** La matriz guarda
cuándo vence cada cosa, no un registro de cambios: no hay manera de saber qué
estaba vencido la semana pasada. Lo que sí se deduce es cuándo se hizo cada
capacitación —vencimiento menos la vigencia en meses de la fila de encabezado—
y con eso se listan las de los últimos `DIAS_GESTIONADAS` días.

Se recogen **antes** del corte por ventana, dentro del mismo recorrido: lo
recién hecho vence dentro de años, así que si no se recoge ahí no se recoge en
ninguna parte. Viajan aparte de los registros, no dentro, porque ninguna de
ellas está en la lista ni podría estarlo.

`leerVigencias()` busca la fila de números igual que `leerEstandares()` busca
la del estándar. Si no la encuentra devuelve vacío: se apaga ese panel y nada
más se entera. Por eso el cambio no puede tumbar el correo del martes, que
comparte el mismo `construirRegistros()`.

**La caché guarda `{r, g}`**, no una lista suelta, y por eso la clave subió a
`rep_v3_`: una caché viva de la versión anterior se habría leído como si
trajera las gestionadas.

**El estándar se limpia una sola vez, al leerlo.** La celda de la matriz no
trae solo el nombre: la de HSE-001 sigue con un asterisco y una aclaración
sobre los roles de COPASST y brigada, doscientos y pico caracteres en total.
`limpiarEstandar()` corta por cuatro reglas, en orden: el primer renglón (la
nota suele ir debajo, dentro de la misma celda), el asterisco de la llamada al
pie, un guión o dos puntos **con espacio a los dos lados** —para no partir
«HSE-001»— y un arranque de aclaración reconocible («Nota», «Aplica a»,
«Dirigido a», «Roles como»…). Lo que sobreviva se corta a `ESTANDAR_MAX`
caracteres en palabra completa.

Por eso `valoresPorBloque()` junta espacios y tabuladores pero **no** los
saltos de línea: ese salto es la pista más fiable de dónde acaba el nombre, y
colapsarlo antes de tiempo la borraba.

Los paréntesis de cierre no se tocan: «(SGAS)» es parte del nombre. Si un
corte deja uno abierto sin cerrar, se quita desde ahí.

`probar()` imprime cada estándar crudo y recortado, uno debajo del otro, para
revisarlos todos de una vez en vez de descubrirlos de a uno.

Se limpia en `mapaDeEstandares()` y no en cada sitio donde se pinta, porque de
ese mapa salen tres cosas: la etiqueta de cada fila, el desplegable de
estándares y la columna del correo del martes. Recortarlo tres veces sería
recordar tres veces lo mismo, y olvidarlo en la tercera.

El HTML además le pone tope visual a la etiqueta —se recorta con puntos
suspensivos y el texto entero queda en el `title`—, por si algún día la matriz
trae algo que estas reglas no prevean.

**Nada que consulte un servicio de Google puede ir dentro del bucle de la
matriz.** Son dos mil personas por sesenta y dos cursos: lo que ahí dentro
cueste un milisegundo cuesta dos minutos en total. `categoriaDe()` empezó a
llamar a `mapaEstandares()`, que hace un `CacheService.get` y un `JSON.parse`,
y la ejecución se quedó colgada sin dar error. `mapaEstandares()`,
`categoriaDe()` y `grupoDeCurso()` recuerdan su respuesta en memoria mientras
dura la ejecución: dependen solo del nombre del curso, que se repite en cada
fila. Sesenta y dos respuestas distintas para cientos de miles de preguntas.

**La etiqueta sale del estándar; el grupo, de la tabla.** Son dos cosas y
conviene no mezclarlas. `CATEGORIA_DESDE_ESTANDAR` hace que la etiqueta que se
ve —«Trabajo en alturas»— venga del estándar de la matriz en vez de la tabla
escrita a mano. El grupo externa/interna lo sigue decidiendo
`categoriaDeLaTabla()`, no la etiqueta mostrada.

Esa separación no es un lujo: `CATEGORIAS_EXTERNAS` dice «Alturas» y el
estándar dice «Trabajo en alturas». Si el grupo se calculara sobre la etiqueta,
ninguna coincidiría, todo quedaría interna y de golpe nadie podría solicitar
nada. Se detectó probándolo, no razonándolo.

**Quién dicta cada curso: mi clasificación o su matriz.** `CATEGORIA_CURSO`
tiene dos mitades. Dieciocho cursos vienen del HTML original, con la
clasificación que ya existía. Once son cursos nuevos que **clasifiqué yo
mirando el nombre**, y están marcados como tales en el código. Adivinar el
nombre no es saber: «Trabajo cerca al agua» acabó bajo *Alturas*, y como
*Alturas* está en `CATEGORIAS_EXTERNAS`, ese curso salió como externa, con
botón de solicitar y en el bloque de proveedor del correo.

El estándar sí es dato de la matriz. Llenando `ESTANDARES_EXTERNOS` con los
códigos que imprime `probar()` (basta `"HSE-004"`, no hace falta el nombre
completo), el estándar pasa a decidir y mis categorías dejan de hacerlo. La
categoría se sigue mostrando como etiqueta, pero ya no determina nada.

`probar()` imprime ahora el reparto completo —qué cursos quedan externos, qué
categoría tiene cada uno y qué está decidiendo— para que se revise de una vez
en vez de irlos descubriendo de a uno.

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
