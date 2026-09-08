/**
 * Capa de acceso al Google Sheet. Ninguna otra parte del código
 * debe llamar a SpreadsheetApp directamente.
 */

function libro_() {
  return CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

/** Devuelve la hoja pedida, creándola con encabezados si no existe. */
function hoja_(nombre) {
  var ss = libro_();
  if (!ss) {
    throw new Error('No hay Sheet asociado. Configure CONFIG.SPREADSHEET_ID.');
  }
  var sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    var encabezados = CONFIG.ENCABEZADOS[nombre] || [];
    if (encabezados.length) {
      sh.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
      sh.getRange(1, 1, 1, encabezados.length)
        .setFontWeight('bold')
        .setBackground('#00A758')
        .setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, encabezados.length);
    }
  }
  return sh;
}

/** Crea todas las hojas del modelo. Ejecutar una vez tras instalar. */
function inicializarLibro() {
  Object.keys(CONFIG.HOJAS).forEach(function (k) {
    hoja_(CONFIG.HOJAS[k]);
  });
  registrarLog_('INFO', 'inicializarLibro', 'Hojas verificadas');
  return 'Hojas creadas/verificadas correctamente.';
}

/** Lee una hoja completa como arreglo de objetos usando la fila 1 como llaves. */
function leerFilas_(nombreHoja) {
  var sh = hoja_(nombreHoja);
  var ultimaFila = sh.getLastRow();
  if (ultimaFila < 2) return [];
  var ancho = sh.getLastColumn();
  var datos = sh.getRange(1, 1, ultimaFila, ancho).getValues();
  var llaves = datos.shift();
  return datos.map(function (fila, i) {
    var obj = { _fila: i + 2 };
    llaves.forEach(function (llave, j) { obj[llave] = fila[j]; });
    return obj;
  });
}

/** Agrega una fila respetando el orden de los encabezados configurados. */
function agregarFila_(nombreHoja, objeto) {
  var sh = hoja_(nombreHoja);
  var encabezados = CONFIG.ENCABEZADOS[nombreHoja];
  var fila = encabezados.map(function (col) {
    return objeto[col] !== undefined && objeto[col] !== null ? objeto[col] : '';
  });
  sh.appendRow(fila);
  return sh.getLastRow();
}

/** Actualiza una celda por nombre de columna. */
function actualizarCelda_(nombreHoja, numeroFila, nombreColumna, valor) {
  var encabezados = CONFIG.ENCABEZADOS[nombreHoja];
  var indice = encabezados.indexOf(nombreColumna);
  if (indice < 0) return false;
  hoja_(nombreHoja).getRange(numeroFila, indice + 1).setValue(valor);
  return true;
}

/** Busca un registro por su token de diligenciamiento. */
function buscarPorToken_(nombreHoja, token) {
  var filas = leerFilas_(nombreHoja);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i]['Token']) === String(token)) return filas[i];
  }
  return null;
}

/** ¿Ya existe un valor en esa columna? Sirve para evitar duplicados. */
function existeValor_(nombreHoja, nombreColumna, valor) {
  var objetivo = String(valor).trim().toLowerCase();
  return leerFilas_(nombreHoja).some(function (f) {
    return String(f[nombreColumna]).trim().toLowerCase() === objetivo;
  });
}

/** Lista de empresas para el selector del formulario de personas. */
function listarEmpresas() {
  return leerFilas_(CONFIG.HOJAS.EMPRESAS).map(function (e) {
    return { nit: String(e['NIT (sin DV)']), nombre: String(e['Nombre empresa']) };
  }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
}

function registrarLog_(nivel, origen, detalle) {
  try {
    agregarFila_(CONFIG.HOJAS.LOG, {
      'Fecha': new Date(),
      'Nivel': nivel,
      'Origen': origen,
      'Detalle': typeof detalle === 'string' ? detalle : JSON.stringify(detalle)
    });
  } catch (e) {
    console.error('No se pudo escribir el log: ' + e.message);
  }
}
