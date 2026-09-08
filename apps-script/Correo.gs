/**
 * Aviso por correo. Mientras CONFIG.NOTIFICAR_A esté vacío no se envía
 * nada: el registro solo se guarda en la hoja.
 */
function avisar_(titulo, sujeto, id, filas) {
  var destinatarios = (CONFIG.NOTIFICAR_A || []).filter(function (c) { return !!c; });
  if (!destinatarios.length) return;

  try {
    var plantilla = HtmlService.createTemplateFromFile('mail/notificacion');
    plantilla.titulo = titulo;
    plantilla.sujeto = sujeto;
    plantilla.id = id;
    plantilla.filas = filas;
    plantilla.enlaceHoja = libro_().getUrl();
    plantilla.fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "d 'de' MMMM, h:mm a");

    MailApp.sendEmail(destinatarios.join(','), titulo + ': ' + sujeto, textoPlano_(titulo, sujeto, id, filas), {
      htmlBody: plantilla.evaluate().getContent(),
      name: CONFIG.NOMBRE_REMITENTE
    });
  } catch (error) {
    // Que un fallo del correo nunca tumbe un registro ya guardado.
    anotarError_('Aviso no enviado (' + id + '): ' + error.message);
  }
}

function textoPlano_(titulo, sujeto, id, filas) {
  var lineas = [titulo + ': ' + sujeto, 'Radicado: ' + id, ''];
  filas.forEach(function (f) { lineas.push(f[0] + ': ' + f[1]); });
  return lineas.join('\n');
}
