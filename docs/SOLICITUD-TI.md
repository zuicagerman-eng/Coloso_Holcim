# Solicitud a TI — habilitar publicación de aplicación web

Texto sugerido para enviar al administrador de Google Workspace.

---

**Asunto:** Habilitar publicación de una aplicación de Apps Script con acceso externo

Buen día,

Estoy montando un formulario interno para el **registro de empresas y personas
de proveedores y contratistas**. Está hecho con Google Apps Script y guarda en
una hoja de cálculo de Holcim.

Necesito publicarlo como aplicación web con la opción **"Cualquier usuario"**,
porque quienes lo diligencian son **externos y no tienen cuenta de Holcim**.
Hoy el desplegable solo ofrece *Solo yo* y *Cualquier usuario de Holcim*, así
que entiendo que la publicación anónima está deshabilitada por política del
dominio.

Detalles que pueden ser útiles para evaluar el riesgo:

- La aplicación se ejecuta **con mi cuenta** ("Ejecutar como: Yo"), no con la
  del visitante. Quien entra **no obtiene ningún acceso** a la hoja ni a Drive:
  únicamente ve un formulario y envía datos.
- Solo se puede **escribir** lo que el formulario permite. El servidor valida
  cada campo y no expone la información ya registrada.
- Los datos quedan en una hoja de cálculo propiedad de Holcim, en la unidad
  compartida del área.
- Se captura: NIT, razón social, correo y teléfono de la empresa; y nombres,
  apellidos, cédula y correo de las personas.

¿Es posible habilitarlo para mi cuenta o para este proyecto en particular? Si
la política no lo permite, agradezco me orienten sobre la alternativa aprobada
para recibir información de terceros.

Gracias,
