/**
 * Servicio del formulario.
 *
 * Se publica con "Ejecutar como: Usuario que accede a la app web" y acceso
 * "Cualquier usuario con una cuenta de Google". Esa combinación es la que
 * permite saber quién está diligenciando: Google solo entrega la identidad
 * cuando el script corre con la autorización de quien entra.
 *
 * Como corre con la cuenta del visitante, este servicio NO puede escribir
 * en la hoja —ni falta que hace—: le reenvía los datos al servicio de
 * registro, que sí corre con la cuenta dueña.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('pagina')
    .setTitle('Registro de empresas proveedoras — Holcim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Correo de quien está viendo la página. La página lo muestra en pantalla. */
function identidad() {
  return { correo: correoDelVisitante_() };
}

function correoDelVisitante_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (error) {
    return '';
  }
}

/**
 * Recibe el formulario y lo reenvía al servicio de registro.
 *
 * El correo de quien diligencia se pone AQUÍ, tomado de la sesión, y pisa
 * cualquier valor que llegue de la página: así nadie puede registrar a
 * nombre de otro manipulando el navegador.
 */
function atender(cuerpo) {
  cuerpo = cuerpo || {};

  var correo = correoDelVisitante_();
  if (!correo) {
    return {
      ok: false,
      errores: ['No pudimos identificar su cuenta de Google. Cierre esta pestaña, ' +
                'vuelva a abrir el enlace e inicie sesión.']
    };
  }

  if (!CONFIG.URL_SERVICIO) {
    return { ok: false, errores: ['Falta configurar URL_SERVICIO en Config.gs.'] };
  }

  cuerpo.datos = cuerpo.datos || {};
  cuerpo.datos.correoRegistra = correo;
  cuerpo.token = CONFIG.TOKEN;

  try {
    var respuesta = UrlFetchApp.fetch(CONFIG.URL_SERVICIO, {
      method: 'post',
      contentType: 'text/plain;charset=utf-8',
      payload: JSON.stringify(cuerpo),
      followRedirects: true,
      muteHttpExceptions: true
    });

    var codigo = respuesta.getResponseCode();
    if (codigo !== 200) {
      console.error('El servicio de registro respondió ' + codigo + ': ' + respuesta.getContentText());
      return { ok: false, errores: ['El servicio de registro respondió ' + codigo + '. Intente de nuevo.'] };
    }
    return JSON.parse(respuesta.getContentText());

  } catch (error) {
    console.error('atender: ' + (error.stack || error.message));
    return { ok: false, errores: ['No se pudo comunicar con el servicio de registro. Intente de nuevo.'] };
  }
}

/** Comprobación desde el editor: ¿está bien enlazado el otro servicio? */
function probarEnlace() {
  if (!CONFIG.URL_SERVICIO) return 'Falta URL_SERVICIO en Config.gs.';
  var r = UrlFetchApp.fetch(CONFIG.URL_SERVICIO + '?ping=1', { muteHttpExceptions: true });
  var mensaje = 'Respuesta ' + r.getResponseCode() + ': ' + r.getContentText().substring(0, 200);
  console.log(mensaje);
  return mensaje;
}
