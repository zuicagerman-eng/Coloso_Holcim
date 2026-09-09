/**
 * Publica un archivo HTML como página propia de Holcim.
 *
 * Sirve para cualquier programa del área que sea "una pantalla": una
 * presentación, un instructivo, un tablero, una calculadora. El HTML se pega
 * tal cual en el archivo `pagina`; esto se encarga de servirlo y de decidir
 * quién puede verlo.
 *
 * La diferencia con el registro de empresas: allá la página se entrega
 * siempre y lo que se protege son los datos. Aquí lo que hay que proteger
 * es la página misma, así que **no se entrega hasta que la clave sea
 * válida**. El navegador nunca recibe el contenido de quien no entró.
 */

function doGet(e) {
  var clave = (e && e.parameter && e.parameter.clave) || '';
  var dueno = '';

  if (seExigeClave_()) {
    dueno = duenoDeClave_(clave);
    if (!dueno) {
      return puerta_(clave ? 'La clave no es válida. Revísela o pida una nueva.' : '');
    }
  }

  anotarVisita_(dueno);
  return pagina_();
}

/** La pantalla de verdad. */
function pagina_() {
  return HtmlService.createHtmlOutputFromFile('pagina')
    .setTitle(CONFIG.TITULO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** La pantalla que pide la clave. */
function puerta_(mensaje) {
  var plantilla = HtmlService.createTemplateFromFile('puerta');
  plantilla.titulo = CONFIG.TITULO;
  plantilla.mensaje = mensaje || '';
  plantilla.url = ScriptApp.getService().getUrl();
  return plantilla.evaluate()
    .setTitle(CONFIG.TITULO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ------------------------------------------------------------------ *
 * Claves
 * ------------------------------------------------------------------ */

/** Se teclean a mano: no distinguen mayúsculas ni espacios. */
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
 * Arma una clave para pegar en CONFIG.CLAVES. Ejecútela desde el editor y
 * copie lo que salga en el registro. Sin vocales: no forma palabras y no se
 * confunde el 0 con la O ni el 1 con la I.
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

/* ------------------------------------------------------------------ *
 * Constancia de quién abrió
 * ------------------------------------------------------------------ */

/**
 * Una fila por apertura. Si falla —hoja borrada, permiso revocado— la
 * página se entrega igual: nadie se queda sin ver la reinducción porque
 * el registro esté caído.
 */
function anotarVisita_(dueno) {
  var id = String(CONFIG.REGISTRAR_EN || '').trim();
  if (!id) return;

  try {
    var libro = SpreadsheetApp.openById(id);
    var hoja = libro.getSheetByName('VISITAS');
    if (!hoja) {
      hoja = libro.insertSheet('VISITAS');
      hoja.getRange(1, 1, 1, 4)
        .setValues([['Fecha', 'Correo', 'Autorizado a', 'Página']])
        .setFontWeight('bold')
        .setBackground('#00457C')
        .setFontColor('#FFFFFF');
      hoja.setFrozenRows(1);
    }
    hoja.appendRow([new Date(), correoDeQuienEntra_(), dueno || '', CONFIG.TITULO]);
  } catch (error) {
    console.error('No se pudo anotar la visita: ' + error.message);
  }
}

/** Con sesión de Holcim, Google dice quién es. Anónimo, queda vacío. */
function correoDeQuienEntra_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (error) {
    return '';
  }
}

/** Comprueba el registro sin publicar nada. Ejecútela desde el editor. */
function probarRegistro() {
  if (!String(CONFIG.REGISTRAR_EN || '').trim()) {
    return 'CONFIG.REGISTRAR_EN está vacío: no se está anotando nada.';
  }
  anotarVisita_('PRUEBA DESDE EL EDITOR');
  var mensaje = 'Anotado en: ' + SpreadsheetApp.openById(CONFIG.REGISTRAR_EN).getName();
  console.log(mensaje);
  return mensaje;
}
