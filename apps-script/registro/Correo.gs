/**
 * Aviso por correo: cada registro nuevo llega a CONFIG.NOTIFICAR_A.
 *
 * El mensaje se arma aquí mismo, sin archivo de plantilla aparte, para que
 * el proyecto tenga un archivo menos que mantener.
 */
function avisar_(titulo, sujeto, id, filas, copiaA) {
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
    /* Copia visible para quien diligenció, como constancia de lo que envió.
       Si ya está entre los destinatarios no se repite. */
    if (copiaA && destinatarios.indexOf(copiaA) < 0) opciones.cc = copiaA;

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
  var enlace = String(CONFIG.URL_BASE_DATOS || '').trim() || libro_().getUrl();

  var celdas = filas.map(function (f) {
    return '<tr>' +
      '<td style="padding:10px 12px;background:#F7F9FC;border:1px solid #DCE3EB;' +
      'color:#59697A;width:42%;">' + escaparHtml_(f[0]) + '</td>' +
      /* word-break: un correo largo ensanchaba la tabla y el mensaje se
         salía de la pantalla del celular. */
      '<td style="padding:10px 12px;border:1px solid #DCE3EB;color:#0F2438;' +
      'word-break:break-word;"><b>' + escaparHtml_(f[1]) + '</b></td></tr>';
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
        /* El proveedor recibe este mismo correo en copia, y el botón no es
           para él: se rotula para que no lo intente. */
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">' +
          '<tr><td style="background:#00457C;border-radius:5px;">' +
            '<a href="' + enlace + '" style="display:inline-block;padding:13px 26px;' +
               'color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;">' +
               'Abrir la base de datos</a>' +
          '</td></tr>' +
        '</table>' +
        '<p style="margin:10px 0 0;color:#8A98A6;font-size:12px;line-height:1.5;">' +
          'Solo para el equipo de Holcim.<br>' +
          'Si usted recibió este correo <b style="color:#59697A;">en copia</b>, no necesita ' +
          'abrir ese enlace: su registro ya quedó guardado y este mensaje es su constancia.' +
        '</p>' +
      '</td></tr>' +
      '<tr><td style="background:#F7F9FC;padding:16px 24px;border-top:1px solid #DCE3EB;' +
                    'color:#9AA8B6;font-size:12px;">' +
        'Aviso automático del registro de empresas y personas. No responda a este correo.' +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

/**
 * Constancia para el proveedor, al correo que él mismo escribió.
 *
 * Va aparte del aviso interno a propósito: ese lleva el enlace a la base
 * de datos, que no es asunto suyo. Aquí solo está lo que registró, su
 * radicado y qué sigue.
 */
function acuseAlProveedor_(datos, id) {
  if (CONFIG.ACUSE_AL_PROVEEDOR === false) return;

  var destino = String(datos.correoEmpresa || '').trim();
  if (!destino) return;

  var esEdicion = datos.tipoSolicitud === 'Solicitud de edición';
  var titulo = esEdicion ? 'Solicitud de corrección recibida' : 'Registro recibido';

  try {
    var fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(),
                                     "d 'de' MMMM 'de' yyyy, h:mm a");

    var filas = [
      ['Tipo de solicitud', datos.tipoSolicitud],
      ['NIT', datos.nit + '  ·  DV ' + datos.dv],
      ['Razón social', datos.nombreEmpresa],
      ['Correo principal', datos.correoEmpresa]
    ];

    MailApp.sendEmail(destino, titulo + ': ' + datos.nombreEmpresa,
      textoPlano_(titulo, datos.nombreEmpresa, id, filas) + '\n\n' + queSigue_(esEdicion),
      {
        name: CONFIG.NOMBRE_REMITENTE,
        htmlBody: cuerpoDelAcuse_(titulo, id, filas, fecha, esEdicion)
      });
  } catch (error) {
    /* Igual que el aviso: el registro ya está guardado y no se cae por
       un correo que no salió. Queda anotado para poder reenviarlo. */
    anotarError_('Acuse al proveedor no enviado (' + id + ' → ' + destino + '): ' + error.message);
  }
}

function queSigue_(esEdicion) {
  return String((esEdicion ? CONFIG.TEXTO_QUE_SIGUE_EDICION : CONFIG.TEXTO_QUE_SIGUE) || '').trim();
}

function cuerpoDelAcuse_(titulo, id, filas, fecha, esEdicion) {
  var celdas = filas.map(function (f) {
    return '<tr>' +
      '<td style="padding:10px 12px;background:#F7F9FC;border:1px solid #DCE3EB;' +
      'color:#59697A;width:42%;">' + escaparHtml_(f[0]) + '</td>' +
      /* word-break: un correo largo ensanchaba la tabla y el mensaje se
         salía de la pantalla del celular. */
      '<td style="padding:10px 12px;border:1px solid #DCE3EB;color:#0F2438;' +
      'word-break:break-word;"><b>' + escaparHtml_(f[1]) + '</b></td></tr>';
  }).join('');

  var saludo = esEdicion
    ? 'Recibimos su solicitud de corrección. Estos son los datos que nos envió:'
    : 'Su empresa quedó registrada con éxito. Estos son los datos que nos envió:';

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
        '<p style="margin:0 0 16px;color:#0F2438;font-size:15px;line-height:1.55;">' +
          escaparHtml_(saludo) + '</p>' +
        '<p style="margin:0 0 20px;color:#59697A;font-size:13px;">' +
          'Radicado <b style="color:#00457C;">' + escaparHtml_(id) + '</b> · ' +
          escaparHtml_(fecha) +
        '</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" ' +
               'style="border-collapse:collapse;font-size:14px;">' + celdas + '</table>' +
        '<div style="margin-top:22px;padding:14px 16px;background:#F3FAF5;' +
                    'border-left:3px solid #00A94F;">' +
          '<p style="margin:0 0 6px;color:#0F2438;font-size:14px;"><b>¿Qué sigue?</b></p>' +
          '<p style="margin:0;color:#3C4C5C;font-size:14px;line-height:1.6;">' +
            escaparHtml_(queSigue_(esEdicion)) + '</p>' +
        '</div>' +
        '<p style="margin:18px 0 0;color:#8A98A6;font-size:12px;line-height:1.5;">' +
          'Guarde este correo: el radicado <b style="color:#59697A;">' + escaparHtml_(id) +
          '</b> identifica su solicitud si necesita preguntar por ella.' +
        '</p>' +
      '</td></tr>' +
      '<tr><td style="background:#F7F9FC;padding:16px 24px;border-top:1px solid #DCE3EB;' +
                    'color:#9AA8B6;font-size:12px;">' +
        'Constancia automática del registro de proveedores de Holcim. ' +
        'No responda a este correo.' +
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
  var quien = 'quien.diligencia@empresadeprueba.com';
  avisar_('Solicitud de creación', 'EMPRESA DE PRUEBA S.A.S.', 'EMP-PRUEBA-0000', [
    ['Tipo de solicitud', 'Solicitud de creación'],
    ['NIT', '900123456  ·  DV 8'],
    ['Razón social', 'EMPRESA DE PRUEBA S.A.S.'],
    ['Correo principal', 'contacto@empresadeprueba.com'],
    ['Diligenciado por', quien]
  ], quien);
  return 'Aviso enviado a: ' + CONFIG.NOTIFICAR_A.join(', ') + ' — con copia a ' + quien;
}

/** Prueba: manda al correo que se le indique la constancia del proveedor. */
function pruebaDeAcuse(correo) {
  var destino = correo || CONFIG.CORREO_SOPORTE;
  acuseAlProveedor_({
    tipoSolicitud: 'Solicitud de creación',
    nit: '900123456', dv: 8,
    nombreEmpresa: 'EMPRESA DE PRUEBA S.A.S.',
    correoEmpresa: destino
  }, 'EMP-PRUEBA-0000');
  return 'Constancia de prueba enviada a: ' + destino;
}
