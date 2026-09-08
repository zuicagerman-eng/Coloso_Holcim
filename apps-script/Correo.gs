/**
 * Aviso por correo: cada registro nuevo llega a CONFIG.NOTIFICAR_A.
 *
 * El mensaje se arma aquí mismo, sin archivo de plantilla aparte, para que
 * el proyecto tenga un archivo menos que mantener.
 */
function avisar_(titulo, sujeto, id, filas) {
  var destinatarios = (CONFIG.NOTIFICAR_A || []).filter(function (c) { return !!c; });
  if (!destinatarios.length) return;

  try {
    var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(),
                                     "d 'de' MMMM 'de' yyyy, h:mm a");

    var opciones = {
      htmlBody: cuerpoDelAviso_(titulo, sujeto, id, filas, fecha),
      name: CONFIG.NOMBRE_REMITENTE
    };
    if ((CONFIG.CON_COPIA_OCULTA || []).length) {
      opciones.bcc = CONFIG.CON_COPIA_OCULTA.join(',');
    }

    MailApp.sendEmail(
      destinatarios.join(','),
      titulo + ': ' + sujeto,
      textoPlano_(titulo, sujeto, id, filas),
      opciones
    );
  } catch (error) {
    // Un fallo del correo nunca debe tumbar un registro que ya se guardó.
    anotarError_('Aviso no enviado (' + id + '): ' + error.message);
  }
}

function cuerpoDelAviso_(titulo, sujeto, id, filas, fecha) {
  var enlace = libro_().getUrl();

  var celdas = filas.map(function (f) {
    return '<tr>' +
      '<td style="padding:10px 12px;background:#F7F9FC;border:1px solid #DCE3EB;' +
      'color:#59697A;width:42%;">' + escaparHtml_(f[0]) + '</td>' +
      '<td style="padding:10px 12px;border:1px solid #DCE3EB;color:#0F2438;"><b>' +
      escaparHtml_(f[1]) + '</b></td></tr>';
  }).join('');

  return '' +
  '<div style="margin:0;padding:24px 12px;background:#F1F4F8;font-family:Arial,Helvetica,sans-serif;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" ' +
           'style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:8px;' +
           'overflow:hidden;border:1px solid #DCE3EB;">' +
      '<tr><td style="height:3px;background:#00A94F;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '<tr><td style="background:#00457C;padding:20px 24px;">' +
        '<div style="color:#FFFFFF;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Holcim</div>' +
        '<div style="color:#FFFFFF;font-size:20px;font-weight:bold;margin-top:4px;">' +
          escaparHtml_(titulo) + '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:24px;">' +
        '<p style="margin:0 0 4px;color:#0F2438;font-size:16px;"><b>' + escaparHtml_(sujeto) + '</b></p>' +
        '<p style="margin:0 0 20px;color:#59697A;font-size:13px;">' +
          'Radicado <b style="color:#00457C;">' + escaparHtml_(id) + '</b> · ' +
          escaparHtml_(fecha) +
        '</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" ' +
               'style="border-collapse:collapse;font-size:14px;">' + celdas + '</table>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">' +
          '<tr><td style="background:#00457C;border-radius:5px;">' +
            '<a href="' + enlace + '" style="display:inline-block;padding:13px 26px;' +
               'color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;">' +
               'Abrir la base de datos</a>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
      '<tr><td style="background:#F7F9FC;padding:16px 24px;border-top:1px solid #DCE3EB;' +
                    'color:#9AA8B6;font-size:12px;">' +
        'Aviso automático del registro de empresas y personas. No responda a este correo.' +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

function textoPlano_(titulo, sujeto, id, filas) {
  var lineas = [titulo + ': ' + sujeto, 'Radicado: ' + id, ''];
  filas.forEach(function (f) { lineas.push(f[0] + ': ' + f[1]); });
  return lineas.join('\n');
}

function escaparHtml_(texto) {
  return String(texto).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/** Prueba: manda el aviso a los correos configurados, sin tocar la hoja. */
function pruebaDeCorreo() {
  avisar_('Nueva empresa registrada', 'EMPRESA DE PRUEBA S.A.S.', 'EMP-PRUEBA-0000', [
    ['NIT', '900123456  ·  DV 8'],
    ['Empresa', 'EMPRESA DE PRUEBA S.A.S.'],
    ['Correo', 'contacto@empresadeprueba.com'],
    ['Teléfono', '+573000000000']
  ]);
  return 'Aviso enviado a: ' + CONFIG.NOTIFICAR_A.join(', ');
}
