/**
 * Instalación en un solo paso.
 *
 * Ejecute instalar() UNA vez desde el editor de Apps Script:
 *   1. crea los dos Google Forms con sus validaciones,
 *   2. manda sus respuestas a este mismo libro de cálculo,
 *   3. deja activo el disparador que envía el correo de notificación.
 *
 * Al terminar, en el registro de ejecución quedan los enlaces para compartir.
 */
function instalar() {
  var libro = SpreadsheetApp.getActive();
  if (!libro) {
    throw new Error('Ejecute este script desde el editor de la hoja de cálculo (Extensiones → Apps Script).');
  }

  var empresa = crearFormulario_('EMPRESA', libro);
  var persona = crearFormulario_('PERSONA', libro);

  guardarPropiedades_({
    FORM_EMPRESA_ID: empresa.getId(),
    FORM_PERSONA_ID: persona.getId()
  });

  crearDisparador_(libro);
  actualizarListaEmpresas();

  var resumen =
    'Instalación terminada.\n\n' +
    'Formulario de EMPRESA (comparta este enlace):\n  ' + empresa.getPublishedUrl() + '\n\n' +
    'Formulario de PERSONAS (comparta este enlace):\n  ' + persona.getPublishedUrl() + '\n\n' +
    'Las respuestas caen en este libro y se notifican a: ' + CONFIG.NOTIFICAR_A.join(', ');

  console.log(resumen);
  try { SpreadsheetApp.getUi().alert(resumen); } catch (e) {}
  return resumen;
}

/** Crea un formulario con las preguntas y validaciones de su tipo. */
function crearFormulario_(tipo, libro) {
  var conf = CONFIG.FORMULARIOS[tipo];
  var P = CONFIG.PREGUNTAS;

  var form = FormApp.create(conf.titulo)
    .setDescription(conf.descripcion)
    .setCollectEmail(true)
    .setAllowResponseEdits(false)
    .setConfirmationMessage('Registro recibido. Las áreas de Holcim fueron notificadas.');

  if (CONFIG.SOLO_DOMINIO_HOLCIM) {
    try {
      form.setRequireLogin(true);
    } catch (e) {
      console.log('No se pudo restringir al dominio (¿cuenta personal?): ' + e.message);
    }
  }

  if (tipo === 'EMPRESA') {
    preguntaTexto_(form, P.NIT,
      'Solo dígitos, sin el guion ni el dígito de verificación. Ejemplo: 830053105',
      /^\d{8,10}$/, 'Escriba entre 8 y 10 dígitos, sin el dígito de verificación.');
    preguntaTexto_(form, P.NOMBRE_EMPRESA, 'Razón social completa.');
    preguntaCorreo_(form, P.CORREO_EMPRESA);
    preguntaTexto_(form, P.CONTACTO, 'Nombre de la persona de contacto y su teléfono.');
  } else {
    preguntaTexto_(form, P.NOMBRES);
    preguntaTexto_(form, P.APELLIDOS);
    preguntaTexto_(form, P.CEDULA, 'Solo dígitos, sin puntos.',
      /^\d{6,10}$/, 'Escriba entre 6 y 10 dígitos, sin puntos ni espacios.');
    preguntaCorreo_(form, P.CORREO_PERSONA);
    form.addListItem()
      .setTitle(P.EMPRESA)
      .setHelpText('La lista se actualiza sola con las empresas ya registradas.')
      .setRequired(true)
      .setChoiceValues(['(todavía no hay empresas registradas)']);
  }

  form.setDestination(FormApp.DestinationType.SPREADSHEET, libro.getId());
  renombrarHojaDeRespuestas_(libro, conf.hoja);
  return form;
}

function preguntaTexto_(form, titulo, ayuda, patron, mensajeError) {
  var item = form.addTextItem().setTitle(titulo).setRequired(true);
  if (ayuda) item.setHelpText(ayuda);
  if (patron) {
    item.setValidation(
      FormApp.createTextValidation()
        .setHelpText(mensajeError)
        .requireTextMatchesPattern(patron.source)
        .build()
    );
  }
  return item;
}

function preguntaCorreo_(form, titulo) {
  return form.addTextItem()
    .setTitle(titulo)
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('Escriba un correo electrónico válido.')
        .requireTextIsEmail()
        .build()
    );
}

/** La hoja recién creada por Forms se llama "Respuestas de formulario N". */
function renombrarHojaDeRespuestas_(libro, nombreDeseado) {
  SpreadsheetApp.flush();
  var hojas = libro.getSheets();
  for (var i = hojas.length - 1; i >= 0; i--) {
    var nombre = hojas[i].getName();
    if (/^(Respuestas de formulario|Form Responses)/i.test(nombre)) {
      hojas[i].setName(nombreDeseado);
      hojas[i].setFrozenRows(1);
      hojas[i].getRange(1, 1, 1, hojas[i].getLastColumn())
        .setFontWeight('bold').setBackground('#00A758').setFontColor('#FFFFFF');
      return hojas[i];
    }
  }
  return null;
}

/** Un solo disparador para las respuestas de ambos formularios. */
function crearDisparador_(libro) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'alEnviarFormulario') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('alEnviarFormulario')
    .forSpreadsheet(libro)
    .onFormSubmit()
    .create();
}

function guardarPropiedades_(objeto) {
  PropertiesService.getScriptProperties().setProperties(objeto, false);
}

function propiedad_(llave) {
  return PropertiesService.getScriptProperties().getProperty(llave);
}

/** Menú de administración en la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Registro Holcim')
    .addItem('Instalar (crear formularios y aviso)', 'instalar')
    .addItem('Ver enlaces de los formularios', 'verEnlaces')
    .addItem('Actualizar lista de empresas', 'actualizarListaEmpresas')
    .addItem('Enviar correo de prueba', 'correoDePrueba')
    .addToUi();
}

function verEnlaces() {
  var ids = [propiedad_('FORM_EMPRESA_ID'), propiedad_('FORM_PERSONA_ID')];
  if (!ids[0] || !ids[1]) {
    SpreadsheetApp.getUi().alert('Todavía no se ha ejecutado instalar().');
    return;
  }
  var texto = 'Formulario de EMPRESA:\n  ' + FormApp.openById(ids[0]).getPublishedUrl() +
              '\n\nFormulario de PERSONAS:\n  ' + FormApp.openById(ids[1]).getPublishedUrl();
  SpreadsheetApp.getUi().alert(texto);
}
