/**
 * Las pantallas del entorno.
 *
 *   ?p=catalogo                     los cursos
 *   ?p=curso&curso=CUR-001          las partes de un curso
 *   ?p=modulo&curso=…&modulo=…      una parte, con la barra alrededor
 *   ?p=crudo&curso=…&modulo=…       solo el contenido, para el marco
 *
 * Todas pasan por el mismo control de acceso. La clave viaja en los
 * enlaces porque quien entra con clave no tiene sesión de Google.
 */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var clave = p.clave || '';

  try {
    var dueno = '';
    if (seExigeClave_()) {
      dueno = duenoDeClave_(clave);
      if (!dueno) {
        return puerta_(clave ? 'La clave no es válida. Revísela o pida una nueva.' : '');
      }
    }

    switch (p.p || 'catalogo') {
      case 'curso':  return pantallaCurso_(p.curso, clave);
      case 'modulo': return pantallaModulo_(p.curso, p.modulo, clave);
      case 'crudo':  return contenidoCrudo_(p.curso, p.modulo);
      default:       return pantallaCatalogo_(clave, dueno);
    }
  } catch (error) {
    anotarError_(error.stack || error.message);
    return pantallaError_(error.message, clave);
  }
}

/** Pega un archivo dentro de otro. Se usa para los estilos comunes. */
function incluir(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function armar_(archivo, valores) {
  var plantilla = HtmlService.createTemplateFromFile(archivo);
  Object.keys(valores).forEach(function (llave) { plantilla[llave] = valores[llave]; });
  return plantilla.evaluate()
    .setTitle(CONFIG.TITULO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ------------------------------------------------------------------ *
 * Pantallas
 * ------------------------------------------------------------------ */

function puerta_(mensaje) {
  return armar_('puerta', {
    titulo: CONFIG.TITULO,
    mensaje: mensaje || '',
    url: ScriptApp.getService().getUrl()
  });
}

function pantallaCatalogo_(clave, dueno) {
  var lista = cursos_().map(function (c) {
    var partes = modulos_(c.id);
    return {
      nombre: c.nombre,
      descripcion: c.descripcion,
      dirigidoA: c.dirigidoA,
      vigencia: c.vigencia,
      partes: partes.length,
      minutos: partes.reduce(function (suma, m) { return suma + m.minutos; }, 0),
      url: url_({ p: 'curso', curso: c.id }, clave)
    };
  });

  return armar_('catalogo', {
    titulo: CONFIG.TITULO,
    cursos: lista,
    quien: dueno || '',
    urlInicio: url_({}, clave)
  });
}

function pantallaCurso_(idCurso, clave) {
  var c = curso_(idCurso);
  if (!c) return pantallaError_('Ese curso no existe o no está activo.', clave);

  var partes = modulos_(c.id).map(function (m, i) {
    return {
      numero: i + 1,
      nombre: m.nombre,
      tipo: m.tipo,
      minutos: m.minutos,
      url: url_({ p: 'modulo', curso: c.id, modulo: m.id }, clave)
    };
  });

  return armar_('curso', {
    titulo: CONFIG.TITULO,
    curso: c,
    partes: partes,
    urlPrimera: partes.length ? partes[0].url : '',
    urlCatalogo: url_({}, clave)
  });
}

function pantallaModulo_(idCurso, idModulo, clave) {
  var c = curso_(idCurso);
  var partes = c ? modulos_(c.id) : [];
  var indice = -1;
  for (var i = 0; i < partes.length; i++) {
    if (partes[i].id === String(idModulo).trim()) indice = i;
  }
  if (!c || indice < 0) return pantallaError_('Esa parte del curso no existe.', clave);

  var m = partes[indice];
  return armar_('modulo', {
    titulo: CONFIG.TITULO,
    curso: c,
    modulo: m,
    numero: indice + 1,
    total: partes.length,
    visor: visorDe_(m, c.id, clave),
    urlAnterior: indice > 0 ? url_({ p: 'modulo', curso: c.id, modulo: partes[indice - 1].id }, clave) : '',
    urlSiguiente: indice < partes.length - 1 ? url_({ p: 'modulo', curso: c.id, modulo: partes[indice + 1].id }, clave) : '',
    urlCurso: url_({ p: 'curso', curso: c.id }, clave)
  });
}

function pantallaError_(detalle, clave) {
  return armar_('error', {
    titulo: CONFIG.TITULO,
    detalle: detalle || 'Algo no salió bien.',
    urlCatalogo: url_({}, clave)
  });
}

/* ------------------------------------------------------------------ *
 * Cómo se muestra cada tipo de parte
 * ------------------------------------------------------------------ */

/**
 * HTML y PDF los sirve el propio script, leyendo el archivo con los
 * permisos de quien publicó: por eso un contratista sin cuenta los ve sin
 * que haya que compartir nada de Drive con él.
 *
 * El video no: pesa demasiado para pasar por aquí, así que se muestra
 * desde donde esté. Si lo van a ver personas de afuera, tiene que ser de
 * YouTube (oculto) o un archivo de Drive compartido con enlace.
 */
function visorDe_(m, idCurso, clave) {
  if (m.tipo === 'HTML' || m.tipo === 'PDF') {
    return { modo: 'marco', src: url_({ p: 'crudo', curso: idCurso, modulo: m.id }, clave), aviso: '' };
  }

  if (m.tipo === 'VIDEO') {
    var youtube = idDeYouTube_(m.origen);
    if (youtube) {
      return { modo: 'marco', src: 'https://www.youtube.com/embed/' + youtube, aviso: '' };
    }
    return {
      modo: 'marco',
      src: 'https://drive.google.com/file/d/' + idDeDrive_(m.origen) + '/preview',
      aviso: 'Si el video no carga, el archivo de Drive no está compartido con quien lo está viendo.'
    };
  }

  return { modo: 'enlace', src: m.origen, aviso: '' };
}

/** El contenido, sin nada alrededor. Va dentro del marco de la pantalla. */
function contenidoCrudo_(idCurso, idModulo) {
  var m = modulo_(idCurso, idModulo);
  if (!m) return conMarcoPermitido_(HtmlService.createHtmlOutput('<p>No se encontró esa parte.</p>'));

  if (m.tipo === 'HTML') {
    var texto = archivoDeDrive_(m.origen).getBlob().getDataAsString('UTF-8');
    return conMarcoPermitido_(HtmlService.createHtmlOutput(texto));
  }

  if (m.tipo === 'PDF') {
    return conMarcoPermitido_(HtmlService.createHtmlOutput(paginaDePdf_(m)));
  }

  return conMarcoPermitido_(HtmlService.createHtmlOutput('<p>Este tipo no se muestra aquí.</p>'));
}

/** Sin esto, el navegador no deja que la pantalla lo meta en su marco. */
function conMarcoPermitido_(salida) {
  return salida.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * El PDF viaja incrustado en la página. Es lo que permite mostrárselo a
 * alguien que no tiene cuenta de Google; el costo es que todo el archivo
 * pasa por el script, así que hay un tope.
 */
function paginaDePdf_(m) {
  var archivo = archivoDeDrive_(m.origen);
  var blob = archivo.getBlob();
  var megas = blob.getBytes().length / (1024 * 1024);

  if (megas > CONFIG.MAXIMO_PDF_MB) {
    return '<div style="font:15px/1.6 system-ui,sans-serif;padding:32px;text-align:center">' +
           '<p><b>' + archivo.getName() + '</b> pesa ' + megas.toFixed(1) + ' MB.</p>' +
           '<p>El tope para mostrarlo aquí son ' + CONFIG.MAXIMO_PDF_MB + ' MB. ' +
           'Pártalo en varias partes del curso, o cámbielo por HTML.</p></div>';
  }

  return '<html><head><meta charset="utf-8"><style>' +
         'html,body{margin:0;height:100%}embed{width:100%;height:100%;border:0}' +
         '</style></head><body><embed type="application/pdf" src="data:application/pdf;base64,' +
         Utilities.base64Encode(blob.getBytes()) + '"></body></html>';
}
