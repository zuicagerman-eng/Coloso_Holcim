# Pruebas

    node pruebas/integracion.js

Comprueba que **lo que el formulario envía** entra bien en la validación del
servidor. Nació de un error real: el formulario mandaba el teléfono ya con el
indicativo (`+573001234567`) y el servidor, al quedarse solo con los dígitos,
contaba 12 en vez de 10 y rechazaba números correctos.

Cada lado estaba bien probado por separado. El error vivía justo en la junta,
que es donde nadie miraba. Si vuelve a cambiar la normalización de un campo,
esta prueba es la que debe avisar.


---

    node pruebas/copia-holcim.js

Comprueba la copia en la hoja de Holcim con dos libros simulados: que la fila
llegue idéntica a los dos, que si Holcim niega el acceso el registro principal
**igual se guarde** y el fallo quede en `ERRORES`, y que el propio registro de
errores no se copie — copiarlo llamaría otra vez a `agregarFila_` y se mordería
la cola.


---

    node pruebas/columnas.js

Comprueba que cambiar el modelo no descoloca las filas. Las filas se escriben
por **nombre de columna**, leyendo los encabezados que tiene la hoja, no por la
posición que ocupan en `CONFIG.ENCABEZADOS`. Sin eso, quitar un campo —el
teléfono, por ejemplo— habría corrido un lugar todos los valores siguientes en
los registros nuevos, y el desastre solo se vería comparando con filas viejas.


---

    node pruebas/modos.js

Comprueba `atender()` en los dos modos de publicación: con cuenta de Google el
correo de quien diligencia sale de la sesión; publicado abierto queda vacío y el
registro pasa igual. Nació de un bloqueo real: al quitar el campo donde ese
correo se escribía a mano quedó un guardia que exigía la sesión, y en modo
abierto no dejaba registrar nada.


---

    node pruebas/creacion-edicion.js

Creación y edición tienen la regla **inversa** sobre el NIT: para crear no puede
existir; para corregir tiene que existir, o no habría nada que corregir. Sin
esa distinción toda solicitud de edición se habría rechazado por duplicada.
Comprueba las cuatro combinaciones y que la lista del desplegable traiga la
última versión de cada NIT, no una entrada por corrección.


---

    node pruebas/avisos.js

Comprueba que **guardar no manda correo**. Enviar un correo con `MailApp` tarda
uno o dos segundos, y mientras tanto la persona miraba el botón «Guardando…».
Ahora la fila se escribe y se responde de una vez; el aviso sale después, en
una llamada aparte (`avisar`), y si esa falla la fila ya está guardada igual.
La prueba fija ese orden, que los dos responsables queden en el aviso, y que el
botón de reportar un problema escriba solo a `CORREO_SOPORTE` —no a la lista de
avisos— con el responder dirigido a quien reportó.

También cubre la constancia que recibe el proveedor: que vaya al correo que él
escribió, que repita lo que registró, que cuente qué sigue, que **no lleve el
enlace a la base de datos** —ese es del equipo— y que, si ese correo rebota, el
aviso interno salga igual y el registro no se caiga.


---

El buscador de empresas se prueba en el navegador, no desde node: vive en la
página. `scratchpad/e2e/buscador.html` lo ejercita con datos de mentiras —
buscar por nombre, por NIT, sin tildes, sin coincidencias, y elegir con las
flechas del teclado— pero es un armado de la sesión, no un archivo del
repositorio. Si se vuelve a tocar el buscador, vale la pena rehacerlo.
