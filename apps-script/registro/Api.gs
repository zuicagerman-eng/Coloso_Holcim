/**
 * Servicio de REGISTRO: recibe los datos y los guarda en la hoja.
 *
 * No lo abre ninguna persona: lo llama el servicio del FORMULARIO, que es
 * el que atiende al proveedor. Por eso se publica con "Ejecutar como: Yo"
 * —así escribe con los permisos del dueño y nadie más necesita acceso a la
 * hoja— y con acceso "Cualquier usuario", porque quien lo llama es otro
 * script, no un navegador con sesión. Su dirección no se publica en ningún
 * lado; si algún día hace falta cerrarla, está CONFIG.TOKEN.
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
      case 'avisar':
        return avisarDeRegistro_(cuerpo.datos || {}, cuerpo.id || '');
      case 'reportar':
        return reportarProblema_(cuerpo.datos || {});
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
    /* La regla depende del tipo de solicitud, y es la inversa en cada uno:
       para crear, el NIT no puede existir; para corregir, tiene que existir,
       o no habría nada que corregir. Sin esto, toda solicitud de edición
       sería rechazada por duplicada. */
    var yaEstaba = existe_(CONFIG.HOJAS.EMPRESAS, 'NIT', d.nit);

    if (d.tipoSolicitud === 'Solicitud de creación' && yaEstaba) {
      return { ok: false, errores: [
        'El NIT ' + d.nit + ' ya está registrado. Si viene a corregir sus datos, ' +
        'elija arriba "Solicitud de edición".'
      ] };
    }
    if (d.tipoSolicitud === 'Solicitud de edición' && !yaEstaba) {
      return { ok: false, errores: [
        'El NIT ' + d.nit + ' no está registrado, así que no hay nada que corregir. ' +
        'Si es una empresa nueva, elija arriba "Solicitud de creación".'
      ] };
    }

    var id = siguienteId_('EMP', CONFIG.HOJAS.EMPRESAS);
    agregarFila_(CONFIG.HOJAS.EMPRESAS, {
      'ID': id,
      'Fecha': new Date(),
      'Tipo de solicitud': d.tipoSolicitud,
      'NIT': d.nit,
      'DV': d.dv,
      'Nombre empresa': d.nombreEmpresa,
      'Correo': d.correoEmpresa,
      'Diligenciado por': d.correoRegistra
    });

    /* El correo NO se manda aquí. Enviarlo toma uno a tres segundos y la
       persona los estaría esperando frente a la pantalla para algo que ya
       quedó guardado. La página confirma de inmediato y pide el aviso
       aparte, sin esperarlo. */

    return {
      ok: true,
      id: id,
      mensaje: (d.tipoSolicitud === 'Solicitud de edición'
        ? 'Solicitud de corrección recibida con el radicado '
        : 'Empresa registrada con el radicado ') + id + '.'
    };
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

/**
 * Manda el aviso de un registro que ya quedó guardado. Lo pide la página
 * después de confirmarle a la persona, así que nadie espera por esto.
 */
function avisarDeRegistro_(datos, id) {
  var revision = depurarEmpresa_(datos);
  if (!revision.ok) return { ok: false, errores: revision.errores };
  var d = revision.datos;

  avisar_(d.tipoSolicitud, d.nombreEmpresa, id, [
    ['Tipo de solicitud', d.tipoSolicitud],
    ['NIT', d.nit + '  ·  DV ' + d.dv],
    ['Razón social', d.nombreEmpresa],
    ['Correo principal', d.correoEmpresa],
    ['Diligenciado por', d.correoRegistra || 'no identificado']
  ], d.correoRegistra);

  /* Y su constancia al proveedor, al correo que él escribió. Va después
     del aviso interno: si el correo del proveedor rebota, el equipo ya
     quedó enterado igual. */
  acuseAlProveedor_(d, id);

  return { ok: true };
}

/**
 * Reporte de un problema con el formulario. Va solo a quien administra
 * esto, no a la lista de avisos: es un asunto técnico, no un registro.
 */
function reportarProblema_(datos) {
  var mensaje = limpiar_(datos.mensaje);
  if (mensaje.length < 10) {
    return { ok: false, errores: ['Cuéntenos un poco más de lo que pasó (mínimo 10 caracteres).'] };
  }
  var quien = limpiar_(datos.correo).toLowerCase();
  if (quien && !esCorreo_(quien)) {
    return { ok: false, errores: ['Ese correo no tiene un formato válido.'] };
  }

  var destino = String(CONFIG.CORREO_SOPORTE || '').trim();
  if (!destino) return { ok: false, errores: ['No hay un correo de soporte configurado.'] };

  try {
    MailApp.sendEmail(destino, '[Formulario de proveedores] Problema reportado', '', {
      name: CONFIG.NOMBRE_REMITENTE,
      replyTo: quien || undefined,
      htmlBody:
        '<p style="font-family:Arial,sans-serif;">Alguien reportó un problema desde el ' +
        'formulario de registro de proveedores.</p>' +
        '<p style="font-family:Arial,sans-serif;"><b>Quién:</b> ' +
        (quien ? escaparHtml_(quien) : 'no dejó correo') + '</p>' +
        '<div style="font-family:Arial,sans-serif;white-space:pre-wrap;background:#F7F9FC;' +
        'border-left:3px solid #00457C;padding:12px 14px;">' + escaparHtml_(mensaje) + '</div>'
    });
    return { ok: true, mensaje: 'Gracias. Ya avisamos al equipo.' };
  } catch (error) {
    anotarError_('Reporte no enviado: ' + error.message);
    return { ok: false, errores: ['No se pudo enviar el reporte. Intente más tarde.'] };
  }
}

/** Prueba manual desde el editor, sin pasar por el formulario. */
function pruebaDeEscritura() {
  prepararHojas();
  var resultado = guardarEmpresa_({
    tipoSolicitud: 'Solicitud de creación',
    nit: '900123456',
    nombreEmpresa: 'Empresa de prueba S.A.S.',
    correoEmpresa: 'contacto@empresadeprueba.com',
    correoRegistra: 'quien.diligencia@empresadeprueba.com'
  });
  console.log(JSON.stringify(resultado));
  return resultado;
}

/* ====================================================================
   PRUEBA DE VERDAD, SIN MOLESTAR A NADIE

   Hace el recorrido completo —guarda la fila, manda el aviso y manda la
   constancia— pero los dos correos salen SOLO a CONFIG.CORREO_SOPORTE.
   Nadie más recibe nada: ni la lista de avisos ni ningún proveedor.

   La fila SE ESCRIBE y se queda en la hoja: de eso se trata, de verla
   dentro de la tabla con su fórmula y su chip. Se borra a mano cuando ya
   no sirva —se reconoce por el nombre—, o con `borrarFilaDePrueba` si se
   prefiere que la quite el script.
   ==================================================================== */

var MARCA_DE_PRUEBA = 'PRUEBA DEL SISTEMA — BORRAR';

function pruebaCompleta() {
  var destino = String(CONFIG.CORREO_SOPORTE || '').trim();
  if (!destino) return 'Falta CORREO_SOPORTE en Config.gs: sin eso no sé a quién mandarle la prueba.';

  /* Un NIT que no se repite: los segundos del reloj. Así la prueba se
     puede repetir sin chocar con la regla de "ese NIT ya está registrado". */
  var nit = String(Math.floor(new Date().getTime() / 1000)).slice(-9);
  var datos = {
    tipoSolicitud: 'Solicitud de creación',
    nit: nit,
    nombreEmpresa: MARCA_DE_PRUEBA,
    correoEmpresa: destino,      /* la constancia del "proveedor" también llega aquí */
    correoRegistra: ''
  };

  /* Mientras dura la prueba, la lista de avisos es una sola dirección.
     Se devuelve como estaba pase lo que pase. */
  var listaReal = CONFIG.NOTIFICAR_A;
  var ocultaReal = CONFIG.CON_COPIA_OCULTA;
  CONFIG.NOTIFICAR_A = [destino];
  CONFIG.CON_COPIA_OCULTA = [];

  var guardado;
  try {
    guardado = guardarEmpresa_(datos);
    if (!guardado.ok) return 'No se pudo registrar la prueba: ' + (guardado.errores || []).join(' ');
    avisarDeRegistro_(datos, guardado.id);
  } finally {
    CONFIG.NOTIFICAR_A = listaReal;
    CONFIG.CON_COPIA_OCULTA = ocultaReal;
  }

  var informe = informeDePrueba_(guardado.id, destino, listaReal);
  console.log(informe);
  return informe;
}

/** Los de la lista de avisos que NO recibieron la prueba. */
function quedaronFuera_(listaReal, destino) {
  return (listaReal || []).filter(function (c) {
    return c && String(c).toLowerCase() !== String(destino).toLowerCase();
  }).join(', ');
}

function informeDePrueba_(id, destino, listaReal) {
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);
  var fila = hoja.getLastRow();
  var encabezados = encabezadosDe_(hoja);

  var lineas = [
    'PRUEBA COMPLETA — versión ' + (CONFIG.VERSION || '(sin marcar)'),
    '',
    'Radicado:  ' + id + '   (fila ' + fila + ' de la hoja)',
    'Correos:   los dos salieron SOLO a ' + destino,
    '             · el aviso al equipo',
    '             · la constancia, como si usted fuera el proveedor',
    'NO recibió nada: ' + (quedaronFuera_(listaReal, destino) || 'nadie más, la lista era solo usted'),
    ''
  ];

  /* Qué le quedó a la fila en las columnas que no llena el formulario */
  var propias = ['ID', 'Fecha', 'Tipo de solicitud', 'NIT', 'DV', 'Nombre empresa', 'Correo'];
  lineas.push('Columnas de la tabla en esa fila:');
  encabezados.forEach(function (columna, i) {
    var llave = String(columna).trim();
    if (!llave || propias.indexOf(llave) >= 0) return;
    var celda = hoja.getRange(fila, i + 1);
    var tiene = [];
    if (celda.getFormula()) tiene.push('fórmula');
    if (celda.getDataValidation && celda.getDataValidation()) tiene.push('lista');
    if (String(celda.getDisplayValue()).trim()) tiene.push('muestra "' + celda.getDisplayValue() + '"');
    lineas.push('  ' + llave + ': ' + (tiene.length ? tiene.join(', ') : 'vacía, sin fórmula ni lista'));
  });

  lineas.push('');
  lineas.push('Ahora abra la hoja y mire la fila ' + fila + ': tiene que verse DENTRO');
  lineas.push('de la tabla, con sus chips de colores como las de arriba.');
  lineas.push('');
  lineas.push('La fila queda escrita: bórrela usted cuando termine de mirarla.');
  lineas.push('Se reconoce por el nombre ' + MARCA_DE_PRUEBA + '.');
  lineas.push('(Si prefiere que la quite el script: borrarFilaDePrueba. En la hoja');
  lineas.push('CORREOS quedan además los dos renglones del envío, con ese nombre.)');
  return lineas.join('\n');
}

/** Quita la fila que dejó `pruebaCompleta`. No toca ninguna otra. */
function borrarFilaDePrueba() {
  var hoja = hoja_(CONFIG.HOJAS.EMPRESAS);
  if (hoja.getLastRow() < 2) return 'La hoja no tiene filas de datos.';

  var encabezados = encabezadosDe_(hoja);
  var columnaNombre = encabezados.indexOf('Nombre empresa') + 1;
  var columnaId = encabezados.indexOf('ID') + 1;
  if (!columnaNombre) return 'No encuentro la columna "Nombre empresa".';

  /* De abajo hacia arriba: la de prueba es la última que se registró. */
  for (var fila = hoja.getLastRow(); fila >= 2; fila--) {
    var nombre = String(hoja.getRange(fila, columnaNombre).getValue()).trim().toUpperCase();
    if (nombre !== MARCA_DE_PRUEBA.toUpperCase()) continue;
    var id = columnaId ? String(hoja.getRange(fila, columnaId).getValue()).trim() : '';
    hoja.deleteRow(fila);
    return 'Borré la fila ' + fila + ' (' + id + ', ' + MARCA_DE_PRUEBA + '). ' +
           'Las demás quedaron como estaban.';
  }
  return 'No encontré ninguna fila de prueba. Si ve una, es que le cambiaron el ' +
         'nombre: bórrela a mano.';
}
