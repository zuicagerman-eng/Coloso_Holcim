/**
 * El libro de cálculo. Ninguna otra parte del código llama a
 * SpreadsheetApp ni a DriveApp directamente.
 */

var HOJAS = {
  CURSOS: 'CURSOS',
  MODULOS: 'MODULOS',
  ASISTENCIAS: 'ASISTENCIAS',
  ERRORES: 'ERRORES'
};

var ENCABEZADOS = {
  CURSOS: ['ID', 'Nombre', 'Descripción', 'Vigencia (meses)', 'Dirigido a', 'Activo'],
  MODULOS: ['ID', 'Curso', 'Orden', 'Nombre', 'Tipo', 'Origen', 'Minutos'],
  ASISTENCIAS: ['Fecha', 'Curso', 'Módulo', 'Cédula', 'Nombre', 'Correo', 'Autorizado a'],
  ERRORES: ['Fecha', 'Detalle']
};

/** Los cuatro tipos de módulo que entiende el visor. */
var TIPOS = ['HTML', 'PDF', 'VIDEO', 'ENLACE'];

function libro_() {
  var id = String(CONFIG.ID_LIBRO || '').trim();
  if (id) return SpreadsheetApp.openById(id);
  var activo = SpreadsheetApp.getActive();
  if (!activo) {
    throw new Error('Ponga el identificador del libro en CONFIG.ID_LIBRO.');
  }
  return activo;
}

function hoja_(nombre) {
  var hoja = libro_().getSheetByName(nombre);
  if (hoja) return asegurarEncabezados_(hoja, nombre);

  hoja = libro_().insertSheet(nombre);
  var encabezados = ENCABEZADOS[nombre] || [];
  if (encabezados.length) {
    hoja.getRange(1, 1, 1, encabezados.length)
      .setValues([encabezados])
      .setFontWeight('bold')
      .setBackground('#00457C')
      .setFontColor('#FFFFFF');
    hoja.setFrozenRows(1);
    hoja.autoResizeColumns(1, encabezados.length);
  }
  return hoja;
}

/** Si la hoja venía de una versión anterior, le agrega lo que le falte. */
function asegurarEncabezados_(hoja, nombre) {
  var esperados = ENCABEZADOS[nombre] || [];
  if (!esperados.length) return hoja;

  var ancho = Math.max(hoja.getLastColumn(), 1);
  var actuales = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(String);
  var faltantes = esperados.filter(function (c) { return actuales.indexOf(c) < 0; });
  if (!faltantes.length) return hoja;

  hoja.getRange(1, ancho + 1, 1, faltantes.length)
    .setValues([faltantes])
    .setFontWeight('bold')
    .setBackground('#00457C')
    .setFontColor('#FFFFFF');
  return hoja;
}

/** Todas las filas de una hoja como objetos, según sus encabezados. */
function filas_(nombre) {
  var hoja = hoja_(nombre);
  if (hoja.getLastRow() < 2) return [];
  var encabezados = ENCABEZADOS[nombre];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length)
    .getValues()
    .map(function (fila) {
      var objeto = {};
      encabezados.forEach(function (columna, i) { objeto[columna] = fila[i]; });
      return objeto;
    });
}

function agregarFila_(nombre, fila) {
  var hoja = hoja_(nombre);
  hoja.appendRow(ENCABEZADOS[nombre].map(function (columna) {
    return fila[columna] !== undefined && fila[columna] !== null ? fila[columna] : '';
  }));
  return hoja.getLastRow();
}

function anotarError_(detalle) {
  try {
    agregarFila_(HOJAS.ERRORES, { 'Fecha': new Date(), 'Detalle': String(detalle) });
  } catch (error) {
    console.error(detalle);
  }
}

/* ------------------------------------------------------------------ *
 * Catálogo
 * ------------------------------------------------------------------ */

function esSi_(valor) {
  var v = String(valor).trim().toUpperCase();
  return v === 'SÍ' || v === 'SI' || v === 'TRUE' || v === 'X' || v === '1';
}

/** Los cursos activos, en el orden en que estén en la hoja. */
function cursos_() {
  return filas_(HOJAS.CURSOS)
    .filter(function (c) { return String(c.ID).trim() && esSi_(c.Activo); })
    .map(function (c) {
      return {
        id: String(c.ID).trim(),
        nombre: String(c.Nombre).trim(),
        descripcion: String(c['Descripción']).trim(),
        vigencia: Number(c['Vigencia (meses)']) || 0,
        dirigidoA: String(c['Dirigido a']).trim()
      };
    });
}

function curso_(id) {
  return cursos_().filter(function (c) { return c.id === String(id).trim(); })[0] || null;
}

/** Los módulos de un curso, en orden. Es la segmentación del curso. */
function modulos_(idCurso) {
  return filas_(HOJAS.MODULOS)
    .filter(function (m) { return String(m.Curso).trim() === String(idCurso).trim(); })
    .map(function (m) {
      return {
        id: String(m.ID).trim(),
        curso: String(m.Curso).trim(),
        orden: Number(m.Orden) || 0,
        nombre: String(m.Nombre).trim(),
        tipo: String(m.Tipo).trim().toUpperCase(),
        origen: String(m.Origen).trim(),
        minutos: Number(m.Minutos) || 0
      };
    })
    .filter(function (m) { return m.id && TIPOS.indexOf(m.tipo) >= 0; })
    .sort(function (a, b) { return a.orden - b.orden; });
}

function modulo_(idCurso, idModulo) {
  return modulos_(idCurso).filter(function (m) { return m.id === String(idModulo).trim(); })[0] || null;
}

/* ------------------------------------------------------------------ *
 * Archivos de Drive
 * ------------------------------------------------------------------ */

/**
 * El identificador de un archivo, venga suelto o dentro de una dirección
 * de Drive. Así en la hoja se puede pegar cualquiera de las dos cosas.
 */
function idDeDrive_(origen) {
  var texto = String(origen || '').trim();
  var enRuta = texto.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (enRuta) return enRuta[1];
  var enParametro = texto.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (enParametro) return enParametro[1];
  return texto;
}

/** El identificador de un video de YouTube, si el origen es de YouTube. */
function idDeYouTube_(origen) {
  var texto = String(origen || '').trim();
  var largo = texto.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return largo ? largo[1] : '';
}

/**
 * El contenido de un archivo de Drive, leído con los permisos de quien
 * publicó la aplicación. Por eso un contratista sin cuenta puede ver el
 * material sin que haya que compartir nada de Drive con él.
 */
function archivoDeDrive_(origen) {
  return DriveApp.getFileById(idDeDrive_(origen));
}

/* ------------------------------------------------------------------ *
 * Instalación
 * ------------------------------------------------------------------ */

/**
 * Crea las cuatro pestañas y deja un curso de ejemplo. Ejecútela una vez
 * desde el editor y acepte los permisos.
 */
function prepararLibro() {
  Object.keys(HOJAS).forEach(function (llave) { hoja_(HOJAS[llave]); });

  if (hoja_(HOJAS.CURSOS).getLastRow() < 2) {
    agregarFila_(HOJAS.CURSOS, {
      'ID': 'CUR-001',
      'Nombre': 'Reinducción',
      'Descripción': 'Reinducción anual del personal.',
      'Vigencia (meses)': 12,
      'Dirigido a': 'Todos',
      'Activo': 'Sí'
    });
    agregarFila_(HOJAS.MODULOS, {
      'ID': 'MOD-001',
      'Curso': 'CUR-001',
      'Orden': 1,
      'Nombre': 'Presentación',
      'Tipo': 'HTML',
      'Origen': 'PEGUE AQUÍ EL ENLACE DEL HTML EN DRIVE',
      'Minutos': 20
    });
  }

  var mensaje = 'Libro listo: ' + libro_().getName() + '\n' + libro_().getUrl();
  console.log(mensaje);
  return mensaje;
}
