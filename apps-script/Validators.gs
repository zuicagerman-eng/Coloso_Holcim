/**
 * Validaciones de negocio. Aisladas a propósito: si algún día la solución
 * migra fuera de Apps Script, este archivo se porta tal cual.
 */

function soloDigitos_(valor) {
  return String(valor || '').replace(/[^0-9]/g, '');
}

function limpiar_(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

/**
 * Dígito de verificación del NIT colombiano (DIAN).
 * El NIT se almacena SIN DV; el DV se calcula solo para mostrarlo/validarlo.
 */
function calcularDV_(nitSinDV) {
  var pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  var digitos = soloDigitos_(nitSinDV).split('').reverse();
  var suma = 0;
  for (var i = 0; i < digitos.length; i++) {
    suma += parseInt(digitos[i], 10) * pesos[i];
  }
  var residuo = suma % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}

function validarNit_(valor) {
  var crudo = String(valor || '').trim();
  if (!crudo) return { ok: false, mensaje: 'El NIT es obligatorio.' };
  if (/[-]/.test(crudo)) {
    return { ok: false, mensaje: 'Escriba el NIT SIN el dígito de verificación (sin el guion).' };
  }
  var nit = soloDigitos_(crudo);
  if (nit.length < 8 || nit.length > 10) {
    return { ok: false, mensaje: 'El NIT debe tener entre 8 y 10 dígitos, sin dígito de verificación.' };
  }
  return { ok: true, valor: nit, dv: calcularDV_(nit) };
}

function validarCedula_(valor) {
  var cedula = soloDigitos_(valor);
  if (!cedula) return { ok: false, mensaje: 'La cédula es obligatoria.' };
  if (cedula.length < 6 || cedula.length > 10) {
    return { ok: false, mensaje: 'La cédula debe tener entre 6 y 10 dígitos.' };
  }
  return { ok: true, valor: cedula };
}

function validarCorreo_(valor, etiqueta) {
  var correo = String(valor || '').trim().toLowerCase();
  var patron = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/;
  if (!correo) return { ok: false, mensaje: 'El correo ' + (etiqueta || '') + ' es obligatorio.' };
  if (!patron.test(correo)) return { ok: false, mensaje: 'El correo "' + valor + '" no es válido.' };
  return { ok: true, valor: correo };
}

function validarTexto_(valor, etiqueta, minimo) {
  var texto = limpiar_(valor);
  var min = minimo || 2;
  if (texto.length < min) {
    return { ok: false, mensaje: 'El campo "' + etiqueta + '" es obligatorio (mínimo ' + min + ' caracteres).' };
  }
  return { ok: true, valor: texto };
}

/** Valida el payload completo de Empresa. */
function validarEmpresa_(datos) {
  var errores = [];
  var salida = {};

  var nit = validarNit_(datos.nit);
  nit.ok ? (salida.nit = nit.valor, salida.dv = nit.dv) : errores.push(nit.mensaje);

  var nombre = validarTexto_(datos.nombre, 'Nombre de la empresa', 3);
  nombre.ok ? (salida.nombre = nombre.valor) : errores.push(nombre.mensaje);

  var correo = validarCorreo_(datos.correo, 'de la empresa');
  correo.ok ? (salida.correo = correo.valor) : errores.push(correo.mensaje);

  var contacto = validarTexto_(datos.contacto, 'Contacto', 3);
  contacto.ok ? (salida.contacto = contacto.valor) : errores.push(contacto.mensaje);

  return { ok: errores.length === 0, errores: errores, datos: salida };
}

/** Valida el payload completo de Persona. */
function validarPersona_(datos) {
  var errores = [];
  var salida = {};

  var nombres = validarTexto_(datos.nombres, 'Nombres', 2);
  nombres.ok ? (salida.nombres = nombres.valor) : errores.push(nombres.mensaje);

  var apellidos = validarTexto_(datos.apellidos, 'Apellidos', 2);
  apellidos.ok ? (salida.apellidos = apellidos.valor) : errores.push(apellidos.mensaje);

  var cedula = validarCedula_(datos.cedula);
  cedula.ok ? (salida.cedula = cedula.valor) : errores.push(cedula.mensaje);

  var correo = validarCorreo_(datos.correo, 'de la persona');
  correo.ok ? (salida.correo = correo.valor) : errores.push(correo.mensaje);

  var nit = validarNit_(datos.nitEmpresa);
  nit.ok ? (salida.nitEmpresa = nit.valor) : errores.push('Empresa: ' + nit.mensaje);

  return { ok: errores.length === 0, errores: errores, datos: salida };
}

/** Identificador legible: EMP-2026-0007 / PER-2026-0031 */
function generarId_(prefijo, nombreHoja) {
  var anio = new Date().getFullYear();
  var consecutivo = leerFilas_(nombreHoja).length + 1;
  return prefijo + '-' + anio + '-' + ('0000' + consecutivo).slice(-4);
}

function generarToken_() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 24);
}
