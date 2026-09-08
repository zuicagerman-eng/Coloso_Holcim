/**
 * Lo único que corre en el día a día: cuando alguien diligencia un
 * formulario, avisa por correo a las personas configuradas.
 *
 * Lo dispara el trigger onFormSubmit que crea instalar().
 */
function alEnviarFormulario(e) {
  try {
    var hoja = e.range.getSheet();
    var tipo = hoja.getName() === CONFIG.FORMULARIOS.PERSONA.hoja ? 'PERSONA' : 'EMPRESA';

    var respuestas = normalizarRespuestas_(e.namedValues);
    var quienDiligencio = respuestas['Dirección de correo electrónico'] ||
                          respuestas['Email Address'] || 'no identificado';

    if (tipo === 'EMPRESA') {
      escribirDV_(hoja, e.range.getRow(), respuestas[CONFIG.PREGUNTAS.NIT]);
      actualizarListaEmpresas();
    }

    enviarAviso_(tipo, respuestas, quienDiligencio);

    if (CONFIG.ACUSE_A_QUIEN_DILIGENCIA && quienDiligencio.indexOf('@') > 0) {
      enviarAcuse_(quienDiligencio, tipo);
    }
  } catch (error) {
    console.error('alEnviarFormulario: ' + error.message);
    avisarFalla_(error);
  }
}

/** namedValues llega como { pregunta: [respuesta] }; se aplana a texto. */
function normalizarRespuestas_(namedValues) {
  var plano = {};
  Object.keys(namedValues || {}).forEach(function (pregunta) {
    var valor = namedValues[pregunta];
    plano[pregunta] = Array.isArray(valor) ? valor.join(', ') : String(valor);
  });
  return plano;
}

/** Arma y envía el correo a CONFIG.NOTIFICAR_A. */
function enviarAviso_(tipo, respuestas, quienDiligencio) {
  var destinatarios = CONFIG.NOTIFICAR_A.filter(function (c) { return !!c; });
  if (!destinatarios.length) {
    console.log('No hay destinatarios en CONFIG.NOTIFICAR_A.');
    return;
  }

  var esEmpresa = tipo === 'EMPRESA';
  var titulo = esEmpresa ? 'Nueva empresa registrada' : 'Nueva persona registrada';
  var sujeto = esEmpresa
    ? respuestas[CONFIG.PREGUNTAS.NOMBRE_EMPRESA]
    : (respuestas[CONFIG.PREGUNTAS.NOMBRES] + ' ' + respuestas[CONFIG.PREGUNTAS.APELLIDOS]);

  var filas = Object.keys(respuestas)
    .filter(function (pregunta) { return !/^(Marca temporal|Timestamp)$/i.test(pregunta); })
    .map(function (pregunta) { return { etiqueta: pregunta, valor: respuestas[pregunta] }; });

  var plantilla = HtmlService.createTemplateFromFile('mail/notificacion');
  plantilla.titulo = titulo;
  plantilla.sujeto = sujeto;
  plantilla.filas = filas;
  plantilla.quienDiligencio = quienDiligencio;
  plantilla.enlaceHoja = SpreadsheetApp.getActive().getUrl();
  plantilla.fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "d 'de' MMMM, h:mm a");

  var opciones = {
    htmlBody: plantilla.evaluate().getContent(),
    name: CONFIG.NOMBRE_REMITENTE
  };
  if (CONFIG.CON_COPIA_OCULTA.length) opciones.bcc = CONFIG.CON_COPIA_OCULTA.join(',');

  MailApp.sendEmail(
    destinatarios.join(','),
    titulo + ': ' + sujeto,
    textoPlano_(titulo, sujeto, filas, quienDiligencio),
    opciones
  );
}

function enviarAcuse_(correo, tipo) {
  try {
    MailApp.sendEmail(correo, 'Recibimos su registro — Holcim', '', {
      name: CONFIG.NOMBRE_REMITENTE,
      htmlBody: '<p>Recibimos el formulario de ' + (tipo === 'EMPRESA' ? 'empresa' : 'persona') +
                ' que usted diligenció. Las áreas de Holcim continúan con el proceso.</p>'
    });
  } catch (error) {
    console.log('Acuse no enviado: ' + error.message);
  }
}

/** Si el aviso falla, que no se pierda en silencio. */
function avisarFalla_(error) {
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
      'Falló la notificación del registro Holcim',
      'Se recibió una respuesta pero no se pudo notificar.\n\n' + error.stack);
  } catch (e) {}
}

function textoPlano_(titulo, sujeto, filas, quien) {
  var lineas = [titulo + ': ' + sujeto, 'Diligenciado por: ' + quien, ''];
  filas.forEach(function (f) { lineas.push(f.etiqueta + ': ' + f.valor); });
  return lineas.join('\n');
}

/* ------------------------------------------------------------------ *
 * Utilidades
 * ------------------------------------------------------------------ */

/**
 * Dígito de verificación del NIT (DIAN). El NIT se captura sin DV;
 * esto lo calcula y lo deja en una columna aparte de la hoja.
 */
function calcularDV(nitSinDV) {
  var pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  var digitos = String(nitSinDV || '').replace(/[^0-9]/g, '').split('').reverse();
  var suma = 0;
  for (var i = 0; i < digitos.length; i++) suma += parseInt(digitos[i], 10) * pesos[i];
  var residuo = suma % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}

/** Escribe el DV calculado en la columna "DV" de la hoja EMPRESAS. */
function escribirDV_(hoja, fila, nit) {
  if (!nit) return;
  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var columna = encabezados.indexOf('DV') + 1;
  if (!columna) {
    columna = hoja.getLastColumn() + 1;
    hoja.getRange(1, columna).setValue('DV')
      .setFontWeight('bold').setBackground('#00A758').setFontColor('#FFFFFF');
  }
  hoja.getRange(fila, columna).setValue(calcularDV(nit));
}

/**
 * Alimenta la lista desplegable "Empresa" del formulario de personas
 * con las empresas ya registradas. Se ejecuta sola tras cada empresa nueva.
 */
function actualizarListaEmpresas() {
  var idFormulario = propiedad_('FORM_PERSONA_ID');
  if (!idFormulario) return;

  var hoja = SpreadsheetApp.getActive().getSheetByName(CONFIG.FORMULARIOS.EMPRESA.hoja);
  if (!hoja || hoja.getLastRow() < 2) return;

  var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var colNombre = encabezados.indexOf(CONFIG.PREGUNTAS.NOMBRE_EMPRESA);
  var colNit = encabezados.indexOf(CONFIG.PREGUNTAS.NIT);
  if (colNombre < 0) return;

  var datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
  var vistas = {};
  var opciones = [];
  datos.forEach(function (fila) {
    var nombre = String(fila[colNombre]).trim();
    if (!nombre || vistas[nombre]) return;
    vistas[nombre] = true;
    opciones.push(colNit >= 0 ? nombre + ' — NIT ' + fila[colNit] : nombre);
  });
  if (!opciones.length) return;

  opciones.sort();
  var form = FormApp.openById(idFormulario);
  var items = form.getItems(FormApp.ItemType.LIST);
  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() === CONFIG.PREGUNTAS.EMPRESA) {
      items[i].asListItem().setChoiceValues(opciones);
      return;
    }
  }
}

/** Prueba manual desde el menú: no toca la hoja, solo manda el correo. */
function correoDePrueba() {
  enviarAviso_('EMPRESA', {
    'Dirección de correo electrónico': Session.getEffectiveUser().getEmail(),
    'NIT (sin dígito de verificación)': '900123456',
    'Nombre de la empresa': 'Empresa de Prueba S.A.S.',
    'Correo de la empresa': 'contacto@empresadeprueba.com',
    'Contacto (nombre y teléfono)': 'Persona de prueba — 300 000 0000'
  }, Session.getEffectiveUser().getEmail());
  SpreadsheetApp.getUi().alert('Correo de prueba enviado a: ' + CONFIG.NOTIFICAR_A.join(', '));
}
