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

/** Encabezados de la hoja, en memoria: se leen una vez por ejecución. */
var _encabezados = {};

/**
 * Llave del caché. Lleva el libro además de la hoja: el id de hoja solo
 * es único dentro de un libro, y aquí se trabaja con dos —el propio y el
 * de Holcim—, que pueden tener hojas con el mismo id y distintas columnas.
 */
function llaveDeHoja_(hoja) {
  var libro = hoja.getParent ? hoja.getParent().getId() : '';
  var propia = hoja.getSheetId ? hoja.getSheetId() : hoja.getName();
  return libro + '/' + propia;
}

function encabezadosDe_(hoja) {
  var llave = llaveDeHoja_(hoja);
  if (!_encabezados[llave]) {
    var ancho = Math.max(hoja.getLastColumn(), 1);
    _encabezados[llave] = hoja.getRange(1, 1, 1, ancho).getValues()[0]
      .map(function (c) { return String(c).trim(); });
  }
  return _encabezados[llave];
}

/**
 * Si la hoja ya existía de una versión anterior, le agrega las columnas
 * que le falten. Así no hay que borrar nada al ampliar el modelo.
 */
function asegurarEncabezados_(hoja, nombre) {
  var esperados = CONFIG.ENCABEZADOS[nombre] || [];
  if (!esperados.length) return hoja;

  var actuales = encabezadosDe_(hoja);
  var ancho = actuales.length;
  var faltantes = esperados.filter(function (c) { return actuales.indexOf(c) < 0; });
  if (!faltantes.length) return hoja;

  hoja.getRange(1, ancho + 1, 1, faltantes.length)
    .setValues([faltantes])
    .setFontWeight('bold')
    .setBackground('#00457C')
    .setFontColor('#FFFFFF');
  delete _encabezados[llaveDeHoja_(hoja)];  /* cambiaron: hay que releerlos */
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
  /* hoja_ acaba de leer los encabezados para verificarlos; se reutilizan
     en vez de volver a pedirlos. Cada lectura es un viaje a la hoja. */
  var destino = escribirFilaNueva_(hoja, encabezadosDe_(hoja), fila);

  /* La misma fila va a la hoja de Holcim, si está configurada. Las hojas
     internas se excluyen: copiarlas llamaría de nuevo a esta función y se
     mordería la cola. */
  if (!esHojaInterna_(nombreHoja)) copiarEnHolcim_(nombreHoja, fila);

  return destino;
}

function esHojaInterna_(nombreHoja) {
  return nombreHoja === CONFIG.HOJAS.ERRORES || nombreHoja === CONFIG.HOJAS.CORREOS;
}

/**
 * Escribe la fila justo debajo de la última y le deja lo que el formulario
 * no escribe —fórmulas, listas desplegables, formato— igual que en la fila
 * de arriba.
 *
 * Es lo que hace falta desde que la hoja es una TABLA con columnas propias
 * de Holcim: "Plazo para creación" es una fórmula y "Estado de solicitud"
 * una lista. Escribir solo los datos del formulario dejaba esas dos celdas
 * en blanco y la fila nueva se veía rota, fuera de la tabla.
 */
function escribirFilaNueva_(hoja, encabezados, fila) {
  var fuente = hoja.getLastRow();      /* última fila con algo: la anterior */
  var destino = fuente + 1;

  hoja.getRange(destino, 1, 1, encabezados.length)
      .setValues([enOrden_(encabezados, fila)]);

  heredarDeLaFilaAnterior_(hoja, encabezados, fila, fuente, destino);
  return destino;
}

function heredarDeLaFilaAnterior_(hoja, encabezados, fila, fuente, destino) {
  /* fuente 1 es el encabezado: la hoja está recién creada y no hay de dónde
     copiar. La primera fila de datos no hereda nada, y está bien. */
  if (fuente < 2) return;

  var ancho = encabezados.length;
  hoja.getRange(fuente, 1, 1, ancho).copyTo(
    hoja.getRange(destino, 1, 1, ancho), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

  encabezados.forEach(function (columna, i) {
    var llave = String(columna).trim();
    /* Las columnas que llena el formulario ya quedaron escritas arriba:
       copiarles nada más encima les borraría el dato. */
    if (fila[llave] !== undefined && fila[llave] !== null) return;

    var desde = hoja.getRange(fuente, i + 1);
    var hasta = hoja.getRange(destino, i + 1);
    /* La lista desplegable, para que la celda se pueda elegir igual que
       en las filas de arriba. */
    desde.copyTo(hasta, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
    /* Y la fórmula, si la columna es calculada. copyTo corre las
       referencias solo: lo que en la fila 3 mira B3, en la 4 mira B4.
       Si la celda de arriba tiene un valor escrito a mano —el estado de
       la solicitud, por ejemplo— NO se copia: esa la llena su equipo. */
    if (desde.getFormula()) {
      desde.copyTo(hasta, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }
  });
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
function enOrden_(encabezados, fila) {
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
    escribirFilaNueva_(hoja, encabezadosDe_(hoja), fila);
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
    'Constancia al proveedor:    ' + (CONFIG.ACUSE_AL_PROVEEDOR === false ? 'apagada' : 'activa'),
    ''
  ];

  /* Qué va a heredar la próxima fila de la última que hay. Es la forma de
     ver, sin registrar nada, si las columnas de la tabla —la fórmula del
     plazo, la lista del estado— van a quedar puestas. */
  var ultima = hoja.getLastRow();
  if (ultima >= 2) {
    var encabezados = encabezadosDe_(hoja);
    var propias = CONFIG.ENCABEZADOS.EMPRESAS || [];
    var heredadas = [];
    encabezados.forEach(function (columna, i) {
      var llave = String(columna).trim();
      if (!llave) return;
      var celda = hoja.getRange(ultima, i + 1);
      var tiene = [];
      if (celda.getFormula()) tiene.push('fórmula');
      if (celda.getDataValidation && celda.getDataValidation()) tiene.push('lista');
      if (tiene.length) heredadas.push('  ' + llave + ': ' + tiene.join(' y '));
    });
    lineas.push('La próxima fila va a heredar de la fila ' + ultima + ':');
    lineas = lineas.concat(heredadas.length ? heredadas : ['  (nada: esa fila no tiene fórmulas ni listas)']);
    lineas.push('');
  }

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

  var filas = hoja.getRange(1, 1, hoja.getLastRow(), hoja.getLastColumn()).getValues();
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

/**
 * Deja constancia de cada correo que se manda. Sirve para responder, sin
 * adivinar, la pregunta de siempre: ¿al proveedor le llegó su correo?
 *
 * "Enviado" quiere decir que Google lo aceptó y lo despachó. Si después
 * rebota —una dirección mal escrita— eso ya no vuelve aquí; llega al buzón
 * de la cuenta que ejecuta el script.
 */
function anotarCorreo_(radicado, tipo, para, estado, detalle) {
  try {
    agregarFila_(CONFIG.HOJAS.CORREOS, {
      'Fecha': new Date(),
      'Radicado': String(radicado || ''),
      'Tipo': String(tipo || ''),
      'Para': String(para || ''),
      'Estado': String(estado || ''),
      'Detalle': String(detalle || '')
    });
  } catch (e) {
    console.error('No se pudo anotar el correo: ' + e.message);
  }
}

/** Busca una empresa por su radicado. Devuelve null si no está. */
function empresaPorRadicado_(radicado) {
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);
  if (hoja.getLastRow() < 2) return null;

  var filas = hoja.getRange(1, 1, hoja.getLastRow(), hoja.getLastColumn()).getValues();
  var encabezados = filas.shift().map(function (c) { return String(c).trim(); });
  var col = function (nombre) { return encabezados.indexOf(nombre); };

  var buscado = String(radicado).trim().toUpperCase();
  var fila = filas.filter(function (f) {
    return String(f[col('ID')]).trim().toUpperCase() === buscado;
  })[0];
  if (!fila) return null;

  var dato = function (nombre) {
    var i = col(nombre);
    return i < 0 ? '' : String(fila[i]).trim();
  };
  return {
    id: dato('ID'),
    tipoSolicitud: dato('Tipo de solicitud'),
    nit: dato('NIT'),
    dv: dato('DV'),
    nombreEmpresa: dato('Nombre empresa'),
    correoEmpresa: dato('Correo')
  };
}

function anotarError_(detalle) {
  try {
    agregarFila_(CONFIG.HOJAS.ERRORES, { 'Fecha': new Date(), 'Detalle': String(detalle) });
  } catch (e) {
    console.error(detalle);
  }
}
