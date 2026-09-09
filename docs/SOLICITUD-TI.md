# Solicitudes a TI

Dos pedidos, independientes entre sí. El primero desbloquea el formulario; el
segundo resuelve dónde guarda el área el código de sus automatizaciones.

## 1. Habilitar la publicación de la aplicación web

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

---

## 2. Dónde guardar el código de las automatizaciones

Texto sugerido para enviar a quien corresponda en TI.

---

**Asunto:** ¿Tiene Holcim un repositorio de código corporativo al que podamos subir automatizaciones del área?

Buen día,

En el área tenemos varias automatizaciones pequeñas hechas con Google Apps
Script: hojas de cálculo con un script que valida datos, escribe registros y
manda avisos por correo. **No usan servidores ni infraestructura**: corren
dentro de Google Workspace, que ya está aprobado.

Lo que no está resuelto es dónde guardar los archivos de ese código. Hoy están
en una cuenta personal de GitHub y eso no nos sirve: si esa persona se va, el
área se queda sin la fuente para volver a montar sus programas.

Dos preguntas:

1. **¿Holcim tiene un repositorio de código corporativo** —GitHub Enterprise,
   Azure DevOps, GitLab o equivalente— al que podamos pedir un espacio para el
   área? Es texto plano, sin datos de personas: solo el código.
2. Si no existe o el trámite es largo, **¿hay algún reparo en que la copia quede
   en una unidad compartida de Drive** del área, mientras tanto?

Para dimensionarlo: son unos pocos archivos de texto, cambian pocas veces al
mes, y no requieren compilación, despliegue ni permisos especiales.

Gracias,
