/**
 * Reglas de negocio del lado del servidor.
 *
 * Son las mismas que hace el formulario en pantalla, repetidas a propósito:
 * la validación del navegador es comodidad para quien escribe, no seguridad.
 * Cualquiera puede mandar datos a esta URL sin pasar por el formulario, así
 * que lo único que decide qué entra a la hoja es este archivo.
 */

function soloDigitos_(v) { return String(v || '').replace(/[^0-9]/g, ''); }

function limpiar_(v) { return String(v || '').trim().replace(/\s+/g, ' '); }

function mayusculas_(v) { return limpiar_(v).toUpperCase(); }

/** Dígito de verificación del NIT colombiano (DIAN). */
function calcularDV_(nitSinDV) {
  var pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  var digitos = soloDigitos_(nitSinDV).split('').reverse();
  var suma = 0;
  for (var i = 0; i < digitos.length; i++) suma += parseInt(digitos[i], 10) * pesos[i];
  var residuo = suma % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}

function esCorreo_(v) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(String(v || '').trim().toLowerCase());
}

/** Valida y normaliza el cuerpo de una empresa. */
function depurarEmpresa_(datos) {
  var errores = [];
  var d = {};

  var nitCrudo = String(datos.nit || '');
  if (/[-.]/.test(nitCrudo)) {
    errores.push('El NIT no debe llevar puntos, guion ni dígito de verificación.');
  }
  d.nit = soloDigitos_(nitCrudo);
  if (d.nit.length < 8 || d.nit.length > 10) {
    errores.push('El NIT debe tener entre 8 y 10 dígitos, sin el dígito de verificación.');
  }
  d.dv = calcularDV_(d.nit);

  d.nombreEmpresa = mayusculas_(datos.nombreEmpresa);
  if (d.nombreEmpresa.length < 3) errores.push('Falta el nombre de la empresa.');

  d.correoEmpresa = limpiar_(datos.correoEmpresa).toLowerCase();
  if (!esCorreo_(d.correoEmpresa)) errores.push('El correo de la empresa no es válido.');

  /* El formulario manda el teléfono ya con el indicativo (+573001234567).
     Hay que quitárselo antes de contar, o los 10 dígitos parecerían 12. */
  var telefono = soloDigitos_(datos.contacto);
  if (telefono.length === 12 && telefono.indexOf('57') === 0) telefono = telefono.substring(2);
  if (telefono.length !== 10) errores.push('El teléfono debe tener exactamente 10 dígitos.');
  d.telefono = '+57' + telefono;

  return { ok: errores.length === 0, errores: errores, datos: d };
}

/** Valida y normaliza el cuerpo de una persona. */
function depurarPersona_(datos) {
  var errores = [];
  var d = {};

  d.nombres = mayusculas_(datos.nombres);
  if (d.nombres.length < 2) errores.push('Faltan los nombres.');

  d.apellido1 = mayusculas_(datos.apellido1);
  if (d.apellido1.length < 2) errores.push('Falta el primer apellido.');

  d.apellido2 = mayusculas_(datos.apellido2);
  if (d.apellido2 && d.apellido2.length < 2) errores.push('El segundo apellido es muy corto.');

  d.nombreCompleto = [d.nombres, d.apellido1, d.apellido2]
    .filter(function (p) { return !!p; }).join(' ');

  d.cedula = soloDigitos_(datos.cedula);
  if (d.cedula.length < 6 || d.cedula.length > 10) {
    errores.push('La cédula debe tener entre 6 y 10 dígitos.');
  }

  d.correoPersona = limpiar_(datos.correoPersona).toLowerCase();
  if (!esCorreo_(d.correoPersona)) errores.push('El correo de la persona no es válido.');

  d.nitEmpresa = soloDigitos_(datos.empresa);
  if (!d.nitEmpresa) errores.push('Falta la empresa a la que pertenece.');

  return { ok: errores.length === 0, errores: errores, datos: d };
}
