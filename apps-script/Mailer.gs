/**
 * Notificaciones por correo. Un solo punto de salida para todo el proyecto.
 */

/**
 * Notifica a los DOS correos configurados que hay un registro nuevo,
 * con el enlace para que las otras áreas de Holcim lo diligencien.
 */
function notificarRegistro_(tipo, registro) {
  var destinatarios = CONFIG.NOTIFICAR_A.filter(function (c) { return !!c; });
  if (!destinatarios.length) {
    registrarLog_('WARN', 'notificarRegistro_', 'No hay destinatarios configurados');
    return false;
  }

  var esEmpresa = tipo === 'empresa';
  var titulo = esEmpresa ? 'Nueva empresa registrada' : 'Nueva persona registrada';
  var asunto = '[' + CONFIG.NOMBRE_APP + '] ' + titulo + ': ' + registro.titulo +
               ' (' + registro.id + ')';

  var plantilla = HtmlService.createTemplateFromFile('mail/notificacion');
  plantilla.titulo = titulo;
  plantilla.registro = registro;
  plantilla.filas = registro.filas;
  plantilla.enlace = enlaceComplemento_(tipo, registro.token);
  plantilla.areas = CONFIG.AREAS;
  plantilla.nombreApp = CONFIG.NOMBRE_APP;
  var cuerpo = plantilla.evaluate().getContent();

  var opciones = {
    htmlBody: cuerpo,
    name: CONFIG.NOMBRE_REMITENTE
  };
  if (CONFIG.CON_COPIA_OCULTA && CONFIG.CON_COPIA_OCULTA.length) {
    opciones.bcc = CONFIG.CON_COPIA_OCULTA.join(',');
  }

  MailApp.sendEmail(destinatarios.join(','), asunto, textoPlano_(registro, titulo), opciones);
  registrarLog_('INFO', 'notificarRegistro_',
    'Notificados ' + destinatarios.join(', ') + ' por ' + registro.id);

  if (CONFIG.ACUSE_AL_REGISTRADO && registro.correo) {
    enviarAcuse_(registro, titulo);
  }
  return true;
}

/** Acuse de recibo al correo registrado. */
function enviarAcuse_(registro, titulo) {
  try {
    var cuerpo = '<p>Hola,</p><p>Recibimos su registro en <b>' + CONFIG.NOMBRE_APP +
      '</b> con el radicado <b>' + registro.id + '</b>.</p>' +
      '<p>Las áreas de Holcim continuarán con el proceso y se comunicarán con usted.</p>' +
      '<p style="color:#6B7280;font-size:12px">Este es un mensaje automático, por favor no responda.</p>';
    MailApp.sendEmail(registro.correo, 'Radicado ' + registro.id + ' — ' + titulo, '', {
      htmlBody: cuerpo,
      name: CONFIG.NOMBRE_REMITENTE
    });
  } catch (e) {
    registrarLog_('WARN', 'enviarAcuse_', e.message);
  }
}

/** Avisa a los dos correos cuando un área completa su parte. */
function notificarComplemento_(complemento) {
  var destinatarios = CONFIG.NOTIFICAR_A.filter(function (c) { return !!c; });
  if (!destinatarios.length) return false;
  var asunto = '[' + CONFIG.NOMBRE_APP + '] ' + complemento.area +
               ' diligenció ' + complemento.idRegistro;
  var cuerpo = '<p>El área <b>' + complemento.area + '</b> diligenció el registro <b>' +
    complemento.idRegistro + '</b>.</p>' +
    '<p><b>Responsable asignado:</b> ' + (complemento.responsable || '—') + '<br>' +
    '<b>Resultado:</b> ' + complemento.resultado + '</p>' +
    '<p><b>Observaciones:</b><br>' + (complemento.observaciones || '—') + '</p>';
  MailApp.sendEmail(destinatarios.join(','), asunto, '', {
    htmlBody: cuerpo,
    name: CONFIG.NOMBRE_REMITENTE
  });
  return true;
}

function enlaceComplemento_(tipo, token) {
  var base = urlWebApp_();
  if (!base) return '';
  return base + '?vista=complemento&tipo=' + encodeURIComponent(tipo) +
         '&token=' + encodeURIComponent(token);
}

function textoPlano_(registro, titulo) {
  var lineas = [titulo, 'Radicado: ' + registro.id, ''];
  registro.filas.forEach(function (f) { lineas.push(f.etiqueta + ': ' + f.valor); });
  return lineas.join('\n');
}
