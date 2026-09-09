/**
 * Servicio web que recibe los registros del formulario y los guarda
 * en la hoja de cálculo.
 *
 * Se publica con: Implementar → Nueva implementación → Aplicación web.
 * La URL que entrega Google (termina en /exec) es la que se pega en
 * vista/index.html, en API.url.
 */

/**
 * Abrir la URL en el navegador entrega el formulario.
 * Con `?ping=1` responde un JSON, para comprobar que la publicación quedó viva.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.ping) {
    return responder_({
      ok: true,
      servicio: 'Registro de Empresas y Personas — Holcim',
      listo: true,
      pideClave: seExigeClave_()
    });
  }
  return HtmlService.createHtmlOutputFromFile('pagina')
    .setTitle('Registro de Empresas y Personas — Holcim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Entrada desde la propia página (google.script.run).
 * Aquí no se pide token: Google ya verificó que quien llama tiene sesión
 * del dominio, que es una garantía mucho más fuerte.
 */
function atender(cuerpo) {
  return manejar_(cuerpo || {});
}

/**
 * Entrada desde un formulario que vive fuera de Google.
 * Como cualquiera puede llamar esta URL, aquí sí se exige el token.
 */
function doPost(e) {
  var cuerpo;
  try {
    cuerpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return responder_({ ok: false, errores: ['La petición no es JSON válido.'] });
  }
  if (CONFIG.TOKEN && cuerpo.token !== CONFIG.TOKEN) {
    return responder_({ ok: false, errores: ['No autorizado.'] });
  }
  return responder_(manejar_(cuerpo));
}

/**
 * El encaminador, común a las dos entradas.
 *
 * Antes de cualquier cosa se resuelve la clave. La pantalla ya la pide, pero
 * eso es comodidad para quien escribe: cualquiera puede llamar esta URL sin
 * pasar por el formulario, así que lo que decide es este control.
 */
function manejar_(cuerpo) {
  try {
    /* Qué exige el servicio. Se responde sin clave a propósito: es lo que la
       pantalla consulta al abrirse, para saber si debe pedirla. */
    if (cuerpo.accion === 'estado') {
      return { ok: true, pideClave: seExigeClave_() };
    }

    var autorizado = '';
    if (seExigeClave_()) {
      autorizado = duenoDeClave_(cuerpo.clave);
      if (!autorizado) {
        return {
          ok: false,
          claveInvalida: true,
          errores: ['La clave de acceso no es válida. Escriba la que Holcim le entregó con la invitación.']
        };
      }
    }

    switch (cuerpo.accion) {
      case 'entrar':
        return { ok: true, para: autorizado };
      case 'empresas':
        return { ok: true, empresas: empresasRegistradas_() };
      case 'registrarEmpresa':
        return guardarEmpresa_(cuerpo.datos || {}, autorizado);
      case 'registrarPersona':
        return guardarPersona_(cuerpo.datos || {}, autorizado);
      default:
        return { ok: false, errores: ['Acción no reconocida: ' + cuerpo.accion] };
    }
  } catch (error) {
    anotarError_(error.stack || error.message);
    return { ok: false, errores: ['Error del servidor. Intente de nuevo.'] };
  }
}

function responder_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/** El correo de aviso dice con qué clave entró, cuando se está pidiendo. */
function conAutorizado_(filas, autorizado) {
  if (!autorizado) return filas;
  return filas.concat([['Autorizado a', autorizado]]);
}

/* ------------------------------------------------------------------ *
 * Registro de empresa
 * ------------------------------------------------------------------ */
function guardarEmpresa_(entrada, autorizado) {
  var revision = depurarEmpresa_(entrada);
  if (!revision.ok) return { ok: false, errores: revision.errores };
  var d = revision.datos;

  var candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    if (existe_(CONFIG.HOJAS.EMPRESAS, 'NIT', d.nit)) {
      return { ok: false, errores: ['Ya hay una empresa registrada con el NIT ' + d.nit + '.'] };
    }

    var id = siguienteId_('EMP', CONFIG.HOJAS.EMPRESAS);
    agregarFila_(CONFIG.HOJAS.EMPRESAS, {
      'ID': id,
      'Fecha': new Date(),
      'NIT': d.nit,
      'DV': d.dv,
      'Nombre empresa': d.nombreEmpresa,
      'Correo': d.correoEmpresa,
      'Teléfono': d.telefono,
      'Autorizado a': autorizado || ''
    });

    avisar_('Nueva empresa registrada', d.nombreEmpresa, id, conAutorizado_([
      ['NIT', d.nit + '  ·  DV ' + d.dv],
      ['Empresa', d.nombreEmpresa],
      ['Correo', d.correoEmpresa],
      ['Teléfono', d.telefono]
    ], autorizado));

    return { ok: true, id: id, mensaje: 'Empresa registrada con el radicado ' + id + '.' };
  } finally {
    candado.releaseLock();
  }
}

/* ------------------------------------------------------------------ *
 * Registro de persona
 * ------------------------------------------------------------------ */
function guardarPersona_(entrada, autorizado) {
  var revision = depurarPersona_(entrada);
  if (!revision.ok) return { ok: false, errores: revision.errores };
  var d = revision.datos;

  var candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    var nombreEmpresa = nombreDeEmpresa_(d.nitEmpresa);
    if (!nombreEmpresa) {
      return { ok: false, errores: ['La empresa con NIT ' + d.nitEmpresa + ' no está registrada.'] };
    }
    if (existe_(CONFIG.HOJAS.PERSONAS, 'Cédula', d.cedula)) {
      return { ok: false, errores: ['Ya hay una persona registrada con la cédula ' + d.cedula + '.'] };
    }

    var id = siguienteId_('PER', CONFIG.HOJAS.PERSONAS);
    agregarFila_(CONFIG.HOJAS.PERSONAS, {
      'ID': id,
      'Fecha': new Date(),
      'Nombres': d.nombres,
      'Primer apellido': d.apellido1,
      'Segundo apellido': d.apellido2,
      'Nombre completo': d.nombreCompleto,
      'Cédula': d.cedula,
      'Correo': d.correoPersona,
      'NIT empresa': d.nitEmpresa,
      'Nombre empresa': nombreEmpresa,
      'Autorizado a': autorizado || ''
    });

    avisar_('Nueva persona registrada', d.nombreCompleto, id, conAutorizado_([
      ['Nombre completo', d.nombreCompleto],
      ['Cédula', d.cedula],
      ['Correo', d.correoPersona],
      ['Empresa', nombreEmpresa + '  ·  NIT ' + d.nitEmpresa]
    ], autorizado));

    return { ok: true, id: id, mensaje: 'Persona registrada con el radicado ' + id + '.' };
  } finally {
    candado.releaseLock();
  }
}

/** Prueba manual desde el editor, sin pasar por el formulario. */
function pruebaDeEscritura() {
  prepararHojas();
  var resultado = guardarEmpresa_({
    nit: '900123456',
    nombreEmpresa: 'Empresa de prueba S.A.S.',
    correoEmpresa: 'contacto@empresadeprueba.com',
    contacto: '3000000000'
  });
  console.log(JSON.stringify(resultado));
  return resultado;
}
