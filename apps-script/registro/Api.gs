/**
 * Servicio de REGISTRO: recibe los datos y los guarda en la hoja.
 *
 * No lo abre ninguna persona: lo llama el servicio del FORMULARIO, que es
 * el que atiende al proveedor. Por eso se publica con "Ejecutar como: Yo"
 * —así escribe con los permisos del dueño y nadie más necesita acceso a la
 * hoja— y con acceso "Cualquier usuario", porque quien lo llama es otro
 * script, no un navegador con sesión. Lo que lo protege es CONFIG.TOKEN.
 *
 * Su URL (la que termina en /exec) es la que se pega en el Config.gs del
 * formulario, en URL_SERVICIO. No se le comparte a nadie más.
 */

/** Abrir esta URL solo sirve para comprobar que la publicación quedó viva. */
function doGet() {
  return responder_({
    ok: true,
    servicio: 'Registro de empresas — Holcim',
    listo: true,
    nota: 'Este servicio no atiende personas. El formulario es el otro.'
  });
}

/**
 * Única entrada. La llama el servicio del formulario, y también serviría
 * para un formulario alojado fuera de Google. Como cualquiera puede
 * alcanzar esta URL, el token es obligatorio.
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

/** El encaminador, común a las dos entradas. */
function manejar_(cuerpo) {
  try {
    switch (cuerpo.accion) {
      case 'empresas':
        return { ok: true, empresas: empresasRegistradas_() };
      case 'registrarEmpresa':
        return guardarEmpresa_(cuerpo.datos || {});
      case 'registrarPersona':
        return guardarPersona_(cuerpo.datos || {});
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
      'Teléfono': d.telefono,
      'Diligenciado por': d.correoRegistra
    });

    avisar_('Nueva empresa registrada', d.nombreEmpresa, id, [
      ['NIT', d.nit + '  ·  DV ' + d.dv],
      ['Razón social', d.nombreEmpresa],
      ['Correo principal', d.correoEmpresa],
      ['Teléfono', d.telefono],
      ['Diligenciado por', d.correoRegistra]
    ], d.correoRegistra);

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
    contacto: '3000000000',
    correoRegistra: 'quien.diligencia@empresadeprueba.com'
  });
  console.log(JSON.stringify(resultado));
  return resultado;
}
