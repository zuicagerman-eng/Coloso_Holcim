/**
 * Acceso a la hoja de cálculo. Ninguna otra parte del código llama
 * a SpreadsheetApp directamente.
 */

function libro_() {
  var libro = SpreadsheetApp.getActive();
  if (!libro) {
    throw new Error('El script debe estar ligado a una hoja de cálculo (Extensiones → Apps Script).');
  }
  return libro;
}

/** Devuelve la hoja pedida; la crea con sus encabezados si no existe. */
function hoja_(nombre) {
  var libro = libro_();
  var hoja = libro.getSheetByName(nombre);
  if (hoja) return asegurarEncabezados_(hoja, nombre);

  hoja = libro.insertSheet(nombre);
  var encabezados = CONFIG.ENCABEZADOS[nombre] || [];
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

/**
 * Si la hoja ya existía de una versión anterior, le agrega las columnas
 * que le falten. Así no hay que borrar nada al ampliar el modelo.
 */
function asegurarEncabezados_(hoja, nombre) {
  var esperados = CONFIG.ENCABEZADOS[nombre] || [];
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

/** Crea las tres hojas. Se ejecuta una vez al instalar. */
function prepararHojas() {
  Object.keys(CONFIG.HOJAS).forEach(function (llave) { hoja_(CONFIG.HOJAS[llave]); });
  return 'Hojas creadas o verificadas.';
}

/** Agrega una fila respetando el orden de los encabezados. */
function agregarFila_(nombreHoja, fila) {
  var hoja = hoja_(nombreHoja);
  var valores = CONFIG.ENCABEZADOS[nombreHoja].map(function (columna) {
    return fila[columna] !== undefined && fila[columna] !== null ? fila[columna] : '';
  });
  hoja.appendRow(valores);
  return hoja.getLastRow();
}

/** Lee una columna completa como texto. Sirve para buscar duplicados. */
function columna_(nombreHoja, nombreColumna) {
  var hoja = hoja_(nombreHoja);
  var indice = CONFIG.ENCABEZADOS[nombreHoja].indexOf(nombreColumna);
  if (indice < 0 || hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, indice + 1, hoja.getLastRow() - 1, 1)
    .getValues()
    .map(function (f) { return String(f[0]).trim(); });
}

function existe_(nombreHoja, nombreColumna, valor) {
  var objetivo = String(valor).trim();
  return columna_(nombreHoja, nombreColumna).indexOf(objetivo) >= 0;
}

/** Consecutivo por año: EMP-2026-0007 */
function siguienteId_(prefijo, nombreHoja) {
  var hoja = hoja_(nombreHoja);
  var cuantas = Math.max(0, hoja.getLastRow() - 1);
  return prefijo + '-' + new Date().getFullYear() + '-' + ('0000' + (cuantas + 1)).slice(-4);
}

/** Empresas registradas, para la lista desplegable del formulario. */
function empresasRegistradas_() {
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);
  if (hoja.getLastRow() < 2) return [];
  var encabezados = CONFIG.ENCABEZADOS.EMPRESAS;
  var colNit = encabezados.indexOf('NIT');
  var colNombre = encabezados.indexOf('Nombre empresa');
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, encabezados.length)
    .getValues()
    .map(function (fila) {
      return { nit: String(fila[colNit]).trim(), nombre: String(fila[colNombre]).trim() };
    })
    .filter(function (e) { return e.nit && e.nombre; })
    .sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
}

function nombreDeEmpresa_(nit) {
  var encontrada = empresasRegistradas_().filter(function (e) { return e.nit === String(nit); })[0];
  return encontrada ? encontrada.nombre : '';
}

function anotarError_(detalle) {
  try {
    agregarFila_(CONFIG.HOJAS.ERRORES, { 'Fecha': new Date(), 'Detalle': String(detalle) });
  } catch (e) {
    console.error(detalle);
  }
}
