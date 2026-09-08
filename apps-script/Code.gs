/**
 * Punto de entrada de la Web App y casos de uso.
 * Registro de Empresas y Personas — Holcim.
 */

/** Router de la Web App. */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var vista = params.vista === 'complemento' ? 'ui/complemento' : 'ui/index';

  var plantilla = HtmlService.createTemplateFromFile(vista);
  plantilla.nombreApp = CONFIG.NOMBRE_APP;
  plantilla.areas = CONFIG.AREAS;
  plantilla.parametros = params;

  if (vista === 'ui/complemento') {
    plantilla.contexto = contextoComplemento_(params.tipo, params.token);
  }

  return plantilla.evaluate()
    .setTitle(CONFIG.NOMBRE_APP + ' — Holcim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Permite incluir CSS/JS parciales dentro de las plantillas HTML. */
function incluir(nombreArchivo) {
  return HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
}

/* ------------------------------------------------------------------ *
 * Casos de uso llamados desde el cliente (google.script.run)
 * ------------------------------------------------------------------ */

/**
 * Registra una empresa: valida, evita duplicados por NIT,
 * escribe en el Sheet y notifica a los dos correos.
 */
function registrarEmpresa(datos) {
  var candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);

    var validacion = validarEmpresa_(datos);
    if (!validacion.ok) {
      return { ok: false, errores: validacion.errores };
    }
    var d = validacion.datos;

    if (existeValor_(CONFIG.HOJAS.EMPRESAS, 'NIT (sin DV)', d.nit)) {
      return { ok: false, errores: ['Ya existe una empresa registrada con el NIT ' + d.nit + '.'] };
    }

    var id = generarId_('EMP', CONFIG.HOJAS.EMPRESAS);
    var token = generarToken_();
    var ahora = new Date();

    agregarFila_(CONFIG.HOJAS.EMPRESAS, {
      'ID': id,
      'Fecha registro': ahora,
      'NIT (sin DV)': d.nit,
      'DV calculado': d.dv,
      'Nombre empresa': d.nombre,
      'Correo': d.correo,
      'Contacto': d.contacto,
      'Estado': CONFIG.ESTADOS.NUEVO,
      'Registrado por': usuarioActual_(),
      'Token': token
    });

    notificarRegistro_('empresa', {
      id: id,
      token: token,
      titulo: d.nombre,
      correo: d.correo,
      filas: [
        { etiqueta: 'NIT (sin dígito de verificación)', valor: d.nit + '  (DV: ' + d.dv + ')' },
        { etiqueta: 'Nombre', valor: d.nombre },
        { etiqueta: 'Correo', valor: d.correo },
        { etiqueta: 'Contacto', valor: d.contacto },
        { etiqueta: 'Registrado por', valor: usuarioActual_() }
      ]
    });

    registrarLog_('INFO', 'registrarEmpresa', id + ' / NIT ' + d.nit);
    return { ok: true, id: id, mensaje: 'Empresa registrada con el radicado ' + id + '.' };

  } catch (error) {
    registrarLog_('ERROR', 'registrarEmpresa', error.message);
    return { ok: false, errores: ['Error del servidor: ' + error.message] };
  } finally {
    try { candado.releaseLock(); } catch (e) {}
  }
}

/**
 * Registra una persona asociada a una empresa existente
 * y notifica a los dos correos.
 */
function registrarPersona(datos) {
  var candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);

    var validacion = validarPersona_(datos);
    if (!validacion.ok) {
      return { ok: false, errores: validacion.errores };
    }
    var d = validacion.datos;

    var empresa = leerFilas_(CONFIG.HOJAS.EMPRESAS).filter(function (e) {
      return String(e['NIT (sin DV)']) === d.nitEmpresa;
    })[0];
    if (!empresa) {
      return {
        ok: false,
        errores: ['La empresa con NIT ' + d.nitEmpresa + ' no está registrada. Registre primero la empresa.']
      };
    }

    if (existeValor_(CONFIG.HOJAS.PERSONAS, 'Cédula', d.cedula)) {
      return { ok: false, errores: ['Ya existe una persona registrada con la cédula ' + d.cedula + '.'] };
    }

    var id = generarId_('PER', CONFIG.HOJAS.PERSONAS);
    var token = generarToken_();
    var nombreEmpresa = String(empresa['Nombre empresa']);

    agregarFila_(CONFIG.HOJAS.PERSONAS, {
      'ID': id,
      'Fecha registro': new Date(),
      'Nombres': d.nombres,
      'Apellidos': d.apellidos,
      'Cédula': d.cedula,
      'Correo': d.correo,
      'NIT empresa': d.nitEmpresa,
      'Nombre empresa': nombreEmpresa,
      'Estado': CONFIG.ESTADOS.NUEVO,
      'Registrado por': usuarioActual_(),
      'Token': token
    });

    notificarRegistro_('persona', {
      id: id,
      token: token,
      titulo: d.nombres + ' ' + d.apellidos,
      correo: d.correo,
      filas: [
        { etiqueta: 'Nombres', valor: d.nombres },
        { etiqueta: 'Apellidos', valor: d.apellidos },
        { etiqueta: 'Cédula', valor: d.cedula },
        { etiqueta: 'Correo', valor: d.correo },
        { etiqueta: 'Empresa', valor: nombreEmpresa + ' (NIT ' + d.nitEmpresa + ')' },
        { etiqueta: 'Registrado por', valor: usuarioActual_() }
      ]
    });

    registrarLog_('INFO', 'registrarPersona', id + ' / cédula ' + d.cedula);
    return { ok: true, id: id, mensaje: 'Persona registrada con el radicado ' + id + '.' };

  } catch (error) {
    registrarLog_('ERROR', 'registrarPersona', error.message);
    return { ok: false, errores: ['Error del servidor: ' + error.message] };
  } finally {
    try { candado.releaseLock(); } catch (e) {}
  }
}

/** Datos que ve el área al abrir el enlace del correo. */
function contextoComplemento_(tipo, token) {
  if (!token) return { ok: false, mensaje: 'El enlace no tiene token.' };
  var nombreHoja = tipo === 'persona' ? CONFIG.HOJAS.PERSONAS : CONFIG.HOJAS.EMPRESAS;
  var registro = buscarPorToken_(nombreHoja, token);
  if (!registro) return { ok: false, mensaje: 'El enlace no corresponde a ningún registro vigente.' };

  var resumen = tipo === 'persona'
    ? [
        { etiqueta: 'Nombres y apellidos', valor: registro['Nombres'] + ' ' + registro['Apellidos'] },
        { etiqueta: 'Cédula', valor: registro['Cédula'] },
        { etiqueta: 'Correo', valor: registro['Correo'] },
        { etiqueta: 'Empresa', valor: registro['Nombre empresa'] }
      ]
    : [
        { etiqueta: 'Empresa', valor: registro['Nombre empresa'] },
        { etiqueta: 'NIT (sin DV)', valor: registro['NIT (sin DV)'] },
        { etiqueta: 'Correo', valor: registro['Correo'] },
        { etiqueta: 'Contacto', valor: registro['Contacto'] }
      ];

  return {
    ok: true,
    tipo: tipo === 'persona' ? 'persona' : 'empresa',
    id: registro['ID'],
    estado: registro['Estado'],
    token: token,
    resumen: resumen
  };
}

/** Guarda lo diligenciado por un área de Holcim. */
function guardarComplemento(datos) {
  var candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);

    var contexto = contextoComplemento_(datos.tipo, datos.token);
    if (!contexto.ok) return { ok: false, errores: [contexto.mensaje] };

    var errores = [];
    if (CONFIG.AREAS.indexOf(datos.area) < 0) errores.push('Seleccione un área válida.');
    var resultado = datos.resultado === 'Rechazado' ? 'Rechazado' : 'Aprobado';
    if (resultado === 'Rechazado' && limpiar_(datos.observaciones).length < 10) {
      errores.push('Para rechazar debe escribir una observación (mínimo 10 caracteres).');
    }
    if (errores.length) return { ok: false, errores: errores };

    var complemento = {
      idRegistro: contexto.id,
      area: datos.area,
      responsable: limpiar_(datos.responsable),
      observaciones: limpiar_(datos.observaciones),
      resultado: resultado
    };

    agregarFila_(CONFIG.HOJAS.COMPLEMENTOS, {
      'Fecha': new Date(),
      'Tipo registro': contexto.tipo,
      'ID registro': contexto.id,
      'Área': complemento.area,
      'Diligenciado por': usuarioActual_(),
      'Responsable asignado': complemento.responsable,
      'Observaciones': complemento.observaciones,
      'Resultado': complemento.resultado
    });

    actualizarEstado_(contexto.tipo, contexto.id);
    notificarComplemento_(complemento);

    registrarLog_('INFO', 'guardarComplemento', contexto.id + ' / ' + complemento.area);
    return { ok: true, mensaje: 'Información registrada para ' + contexto.id + '.' };

  } catch (error) {
    registrarLog_('ERROR', 'guardarComplemento', error.message);
    return { ok: false, errores: ['Error del servidor: ' + error.message] };
  } finally {
    try { candado.releaseLock(); } catch (e) {}
  }
}

/** El registro queda Completo cuando todas las áreas diligenciaron. */
function actualizarEstado_(tipo, idRegistro) {
  var nombreHoja = tipo === 'persona' ? CONFIG.HOJAS.PERSONAS : CONFIG.HOJAS.EMPRESAS;
  var areasDiligenciadas = {};
  leerFilas_(CONFIG.HOJAS.COMPLEMENTOS).forEach(function (c) {
    if (String(c['ID registro']) === String(idRegistro)) {
      areasDiligenciadas[String(c['Área'])] = true;
    }
  });
  var faltantes = CONFIG.AREAS.filter(function (a) { return !areasDiligenciadas[a]; });
  var estado = faltantes.length === 0 ? CONFIG.ESTADOS.COMPLETO : CONFIG.ESTADOS.EN_PROCESO;

  var fila = leerFilas_(nombreHoja).filter(function (r) {
    return String(r['ID']) === String(idRegistro);
  })[0];
  if (fila) actualizarCelda_(nombreHoja, fila._fila, 'Estado', estado);
}

function usuarioActual_() {
  try {
    return Session.getActiveUser().getEmail() || 'anónimo';
  } catch (e) {
    return 'anónimo';
  }
}

/** Menú en la hoja de cálculo para administrar la solución. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Registro Holcim')
    .addItem('Crear/verificar hojas', 'inicializarLibro')
    .addItem('Enviar correo de prueba', 'pruebaCorreo')
    .addToUi();
}

function pruebaCorreo() {
  notificarRegistro_('empresa', {
    id: 'EMP-PRUEBA-0000',
    token: 'prueba',
    titulo: 'Empresa de prueba S.A.S.',
    correo: '',
    filas: [
      { etiqueta: 'NIT (sin dígito de verificación)', valor: '900123456  (DV: ' + calcularDV_('900123456') + ')' },
      { etiqueta: 'Nombre', valor: 'Empresa de prueba S.A.S.' },
      { etiqueta: 'Correo', valor: 'contacto@empresaprueba.com' },
      { etiqueta: 'Contacto', valor: 'Ana Gómez — 300 000 0000' }
    ]
  });
}
