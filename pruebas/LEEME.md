# Pruebas

    node pruebas/integracion.js

Comprueba que **lo que el formulario envía** entra bien en la validación del
servidor. Nació de un error real: el formulario mandaba el teléfono ya con el
indicativo (`+573001234567`) y el servidor, al quedarse solo con los dígitos,
contaba 12 en vez de 10 y rechazaba números correctos.

Cada lado estaba bien probado por separado. El error vivía justo en la junta,
que es donde nadie miraba. Si vuelve a cambiar la normalización de un campo,
esta prueba es la que debe avisar.
