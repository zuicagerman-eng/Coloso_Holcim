/**
 * Quién puede entrar, y cómo se arman las direcciones internas.
 *
 * Aquí lo que se protege es el contenido, no unos datos: nada se entrega
 * hasta que la clave sea válida. Quien no entró nunca recibió la
 * capacitación.
 */

function normalizarClave_(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, '');
}

function seExigeClave_() {
  return Object.keys(CONFIG.CLAVES || {}).length > 0;
}

/** A quién se le entregó la clave, o cadena vacía si no sirve. */
function duenoDeClave_(clave) {
  var buscada = normalizarClave_(clave);
  if (!buscada) return '';
  var claves = CONFIG.CLAVES || {};
  var hallada = Object.keys(claves).filter(function (c) {
    return normalizarClave_(c) === buscada;
  })[0];
  if (!hallada) return '';
  return String(claves[hallada]).trim() || hallada;
}

/**
 * Arma una clave para pegar en CONFIG.CLAVES. Sin vocales: no forma
 * palabras y no se confunde el 0 con la O ni el 1 con la I.
 */
function nuevaClave() {
  var letras = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
  var partes = [];
  for (var bloque = 0; bloque < 3; bloque++) {
    var trozo = '';
    for (var i = 0; i < 4; i++) {
      trozo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    partes.push(trozo);
  }
  var clave = 'HOLCIM-' + partes.join('-');
  console.log(clave);
  return clave;
}

/**
 * Dirección de una pantalla del entorno, con la clave puesta.
 *
 * La clave viaja en cada enlace porque quien entra con clave no tiene
 * sesión de Google: no hay dónde recordarlo. Es un código de grupo, no
 * la contraseña de una persona.
 */
function url_(parametros, clave) {
  var base = ScriptApp.getService().getUrl();
  var partes = [];
  Object.keys(parametros || {}).forEach(function (llave) {
    if (parametros[llave] !== '' && parametros[llave] !== undefined) {
      partes.push(encodeURIComponent(llave) + '=' + encodeURIComponent(parametros[llave]));
    }
  });
  if (clave) partes.push('clave=' + encodeURIComponent(clave));
  return partes.length ? base + '?' + partes.join('&') : base;
}

/** Quién entró, cuando hay sesión de Holcim. Anónimo devuelve vacío. */
function correoDeQuienEntra_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (error) {
    return '';
  }
}
