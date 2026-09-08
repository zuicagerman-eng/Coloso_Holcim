/**
 * Servicio web que recibe los registros del formulario y los guarda
 * en la hoja de cálculo.
 *
 * Se publica con: Implementar → Nueva implementación → Aplicación web.
 * La URL que entrega Google (termina en /exec) es la que se pega en
 * vista/index.html, en API.url.
 */

/** Verificación rápida: abrir la URL en el navegador debe mostrar este JSON. */
function doGet() {
  return responder_({
    ok: true,
    servicio: 'Registro de Empresas y Personas — Holcim',
    listo: true
  });
}

/** Todas las operaciones entran por aquí. */
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

  try {
    switch (cuerpo.accion) {
      case 'empresas':
        return responder_({ ok: true, empresas: empresasRegistradas_() });
      case 'registrarEmpresa':
        return responder_(guardarEmpresa_(cuerpo.datos || {}));
      case 'registrarPersona':
        return responder_(guardarPersona_(cuerpo.datos || {}));
      default:
        return responder_({ ok: false, errores: ['Acción no reconocida: ' + cuerpo.accion] });
    }
  } catch (error) {
    anotarError_(error.stack || error.message);
    return responder_({ ok: false, errores: ['Error del servidor. Intente de nuevo.'] });
  }
}

function responder_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ *
 * Registro de empresa
 * ------------------------------------------------------------------ */
function guardarEmpresa_(entrada) {
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
      'Teléfono': d.telefono
    });

    avisar_('Nueva empresa registrada', d.nombreEmpresa, id, [
      ['NIT', d.nit + '  ·  DV ' + d.dv],
      ['Empresa', d.nombreEmpresa],
      ['Correo', d.correoEmpresa],
      ['Teléfono', d.telefono]
    ]);

    return { ok: true, id: id, mensaje: 'Empresa registrada con el radicado ' + id + '.' };
  } finally {
    candado.releaseLock();
  }
}

/* ------------------------------------------------------------------ *
 * Registro de persona
 * ------------------------------------------------------------------ */
function guardarPersona_(entrada) {
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
      'Nombre empresa': nombreEmpresa
    });

    avisar_('Nueva persona registrada', d.nombreCompleto, id, [
      ['Nombre completo', d.nombreCompleto],
      ['Cédula', d.cedula],
      ['Correo', d.correoPersona],
      ['Empresa', nombreEmpresa + '  ·  NIT ' + d.nitEmpresa]
    ]);

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
