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

/** Devuelve la hoja pedida del libro principal. */
function hoja_(nombre) {
  return hojaEn_(libro_(), nombre);
}

/** Igual, pero en el libro que se le indique. La crea si no existe. */
function hojaEn_(libro, nombre) {
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

/** Crea las hojas. Se ejecuta una vez al instalar. */
function prepararHojas() {
  Object.keys(CONFIG.HOJAS).forEach(function (llave) { hoja_(CONFIG.HOJAS[llave]); });
  if (hayCopiaConfigurada_()) probarCopiaEnHolcim();
  return 'Hojas creadas o verificadas.';
}

/** Agrega una fila respetando el orden de los encabezados. */
function agregarFila_(nombreHoja, fila) {
  var hoja = hoja_(nombreHoja);
  hoja.appendRow(enOrden_(hoja, nombreHoja, fila));

  /* La misma fila va a la hoja de Holcim, si está configurada.
     El registro de errores se excluye: copiarlo llamaría de nuevo a esta
     función y se mordería la cola. */
  if (nombreHoja !== CONFIG.HOJAS.ERRORES) copiarEnHolcim_(nombreHoja, fila);

  return hoja.getLastRow();
}

/**
 * Arma la fila siguiendo los encabezados QUE TIENE LA HOJA, no los de
 * CONFIG.
 *
 * Es la diferencia entre que el modelo pueda cambiar y que no: si se
 * armara por la lista de CONFIG y esa lista dejara de coincidir con las
 * columnas ya existentes —al quitar un campo, por ejemplo— cada valor
 * caería una columna corrida, y el error solo se vería revisando datos
 * viejos. Por nombre, una columna retirada simplemente queda vacía y una
 * nueva se llena; nada se desordena.
 */
function enOrden_(hoja, nombreHoja, fila) {
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var encabezados = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  return encabezados.map(function (columna) {
    var llave = String(columna).trim();
    return fila[llave] !== undefined && fila[llave] !== null ? fila[llave] : '';
  });
}

/* ------------------------------------------------------------------ *
 * Copia en la hoja de Holcim
 *
 * Cada registro se escribe dos veces: en el libro de este script y en el
 * de Holcim. Si la copia falla, el registro principal ya quedó guardado y
 * el fallo se anota en ERRORES: nadie pierde su trámite por esto.
 * ------------------------------------------------------------------ */

function libroDeHolcim_() {
  var id = String(CONFIG.ID_HOJA_HOLCIM || '').trim();
  if (!id) return null;
  return SpreadsheetApp.openById(id);
}

/**
 * ¿Está configurada una hoja de destino distinta de esta?
 *
 * El seguro del final importa: si ID_HOJA_HOLCIM apunta a esta misma hoja,
 * cada registro se escribiría dos veces en el mismo archivo —una como
 * registro y otra como copia— con el mismo radicado y el mismo segundo.
 */
function hayCopiaConfigurada_() {
  var id = String(CONFIG.ID_HOJA_HOLCIM || '').trim();
  if (!id) return false;
  if (id === libro_().getId()) {
    anotarError_('ID_HOJA_HOLCIM apunta a esta misma hoja. Se omitió la copia ' +
                 'para no duplicar las filas. Déjelo vacío, o ponga el id de otro archivo.');
    return false;
  }
  return true;
}

function copiarEnHolcim_(nombreHoja, fila) {
  if (!hayCopiaConfigurada_()) return;
  try {
    var hoja = hojaEn_(libroDeHolcim_(), nombreHoja);
    hoja.appendRow(enOrden_(hoja, nombreHoja, fila));
  } catch (error) {
    anotarError_('No se pudo copiar a la hoja de Holcim (' + nombreHoja + '): ' + error.message);
  }
}

/**
 * Dice en voz alta cómo está configurado esto. Ejecútela desde el editor
 * cuando algo no cuadre: responde sin tocar ni una fila.
 */
function diagnostico() {
  var libro = libro_();
  var idActivo = libro.getId();
  var idCopia = String(CONFIG.ID_HOJA_HOLCIM || '').trim();
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);

  var lineas = [
    'Hoja donde vive el script: ' + libro.getName(),
    '  su identificador:        ' + idActivo,
    'ID_HOJA_HOLCIM:            ' + (idCopia || '(vacío)'),
    '',
    'Filas de datos en EMPRESAS: ' + Math.max(0, hoja.getLastRow() - 1),
    'Avisos a:                   ' + (CONFIG.NOTIFICAR_A || []).join(', '),
    ''
  ];

  if (!idCopia) {
    lineas.push('CORRECTO: no se copia a ninguna otra hoja, cada registro se');
    lineas.push('escribe una sola vez.');
  } else if (idCopia === idActivo) {
    lineas.push('AQUÍ ESTÁ EL PROBLEMA: ID_HOJA_HOLCIM apunta a esta misma hoja,');
    lineas.push('así que cada registro se escribiría dos veces. Déjelo vacío en');
    lineas.push('Config.gs. Esta versión del código ya lo omite, pero si sigue');
    lineas.push('viendo filas repetidas es que la implementación publicada todavía');
    lineas.push('corre el código viejo: Administrar implementaciones → editar →');
    lineas.push('Versión: Nueva.');
  } else {
    lineas.push('Se copia a otra hoja distinta. Correcto.');
  }

  var texto = lineas.join('\n');
  console.log(texto);
  return texto;
}

/**
 * Comprueba la copia sin registrar nada: abre la hoja de Holcim, crea sus
 * pestañas si faltan y devuelve su nombre. Ejecútela desde el editor.
 */
function probarCopiaEnHolcim() {
  var id = String(CONFIG.ID_HOJA_HOLCIM || '').trim();
  if (!id) return 'CONFIG.ID_HOJA_HOLCIM está vacío: no se está copiando nada.';
  if (id === libro_().getId()) {
    return 'CUIDADO: ID_HOJA_HOLCIM apunta a ESTA MISMA hoja, y por eso cada ' +
           'registro aparecía dos veces. Déjelo vacío, o ponga el id de otro archivo.';
  }
  var libro = libroDeHolcim_();
  hojaEn_(libro, CONFIG.HOJAS.EMPRESAS);
  hojaEn_(libro, CONFIG.HOJAS.PERSONAS);
  var mensaje = 'Conexión correcta con: ' + libro.getName() + '\n' + libro.getUrl();
  console.log(mensaje);
  return mensaje;
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

/**
 * Empresas registradas, para la lista de "Solicitud de edición".
 *
 * Se lee por nombre de columna, igual que se escribe. Y se queda con la
 * ÚLTIMA versión de cada NIT: una empresa corregida varias veces tiene
 * varias filas, y la que vale es la más reciente.
 */
function empresasRegistradas_() {
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);
  if (hoja.getLastRow() < 2) return [];

  var ancho = hoja.getLastColumn();
  var filas = hoja.getRange(1, 1, hoja.getLastRow(), ancho).getValues();
  var encabezados = filas.shift().map(function (c) { return String(c).trim(); });
  var col = function (nombre) { return encabezados.indexOf(nombre); };

  var porNit = {};
  filas.forEach(function (fila) {
    var nit = String(fila[col('NIT')]).trim();
    var nombre = String(fila[col('Nombre empresa')]).trim();
    if (!nit || !nombre) return;
    porNit[nit] = {
      nit: nit,
      nombre: nombre,
      correo: String(fila[col('Correo')]).trim()
    };
  });

  return Object.keys(porNit)
    .map(function (nit) { return porNit[nit]; })
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
