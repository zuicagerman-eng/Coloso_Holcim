/* El correo salió del camino de guardado: guardar tiene que ser inmediato
   y el aviso viaja después, en una llamada aparte. Aquí se comprueba eso,
   y que el reporte de problemas llegue solo a soporte. */
const fs = require('fs');

const CONFIG = {
  TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'],
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES' },
  ENCABEZADOS: { EMPRESAS: ['ID','Fecha','Tipo de solicitud','NIT','DV','Nombre empresa','Correo','Diligenciado por'],
                 ERRORES: ['Fecha','Detalle'] },
  ID_HOJA_HOLCIM: '',
  NOTIFICAR_A: ['german.zuica@holcim.com', 'juan.narvaezsalazar@holcim.com'],
  CORREO_SOPORTE: 'german.zuica@holcim.com',
  NOMBRE_REMITENTE: 'Registro de proveedores',
  URL_BASE_DATOS: 'https://docs.google.com/spreadsheets/d/XXX/edit',
  ACUSE_AL_PROVEEDOR: true,
  TEXTO_QUE_SIGUE: 'Será creada en el sistema de proveedores y le llegará la invitación a la capacitación.',
  TEXTO_QUE_SIGUE_EDICION: 'Actualizaremos los datos de su empresa.'
};

const filas = [CONFIG.ENCABEZADOS.EMPRESAS.slice()];
const hoja = {
  getLastRow: () => filas.length, getLastColumn: () => filas[0].length,
  appendRow: f => filas.push(f),
  getRange: (f,c,nf,nc) => ({ getValues: () => filas.slice(f-1, f-1+nf).map(x => x.slice(c-1, c-1+nc)),
    setValues(){return this;}, setFontWeight(){return this;}, setBackground(){return this;},
    setFontColor(){return this;}, setValue(){return this;} }),
  setFrozenRows(){}, autoResizeColumns(){},
  getName: () => 'EMPRESAS', getSheetId: () => 'EMPRESAS', getParent: () => libro
};
const libro = { getId: () => 'A', getName: () => 'Registro', getUrl: () => 'https://…',
                getSheetByName: n => n === 'EMPRESAS' ? hoja : null, insertSheet: () => hoja };

const correosEnviados = [];
const SpreadsheetApp = { getActive: () => libro, openById: () => libro };
const LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
const ContentService = { createTextOutput: t => ({ setMimeType: () => t }), MimeType: { JSON: 1 } };
const HtmlService = {};
const MailApp = { sendEmail: (para, asunto, texto, op) => correosEnviados.push({ para, asunto, op: op || {} }) };
const Session = { getScriptTimeZone: () => 'America/Bogota', getActiveUser: () => ({ getEmail: () => '' }) };
const Utilities = { formatDate: () => '1 de enero de 2026, 9:00 a. m.' };

eval(['registro/Validaciones.gs','registro/Hoja.gs','registro/Correo.gs','registro/Api.gs']
  .map(f => fs.readFileSync('/home/user/Coloso_Holcim/apps-script/' + f, 'utf8'))
  .join('\n'));

const datos = { tipoSolicitud: 'Solicitud de creación', nit: '900617448',
                nombreEmpresa: 'Aceros del Caribe SAS', correoEmpresa: 'compras@aceros.com',
                correoRegistra: '' };

console.log('--- guardar ---');
const guardado = guardarEmpresa_(JSON.parse(JSON.stringify(datos)));
console.log('  respuesta:', JSON.stringify(guardado));
console.log('  la fila quedó escrita:', filas.length === 2);
console.log('  guardar NO envía correo:', correosEnviados.length === 0, '← el aviso ya no frena la respuesta');

console.log('\n--- avisar (la llamada que sale después) ---');
const aviso = avisarDeRegistro_(JSON.parse(JSON.stringify(datos)), guardado.id);
console.log('  respuesta:', JSON.stringify(aviso));
console.log('  dos correos: el del equipo y el del proveedor:', correosEnviados.length === 2);
console.log('  a los dos responsables:', correosEnviados[0].para);
console.log('  el asunto nombra la empresa:', /ACEROS DEL CARIBE SAS/i.test(correosEnviados[0].asunto));

console.log('\n--- constancia para el proveedor ---');
const acuse = correosEnviados[1];
console.log('  va al correo que escribió la empresa:', acuse.para === 'compras@aceros.com');
console.log('  dice que quedó registrada:', /quedó registrada con éxito/.test(acuse.op.htmlBody));
console.log('  lleva el radicado:', acuse.asunto.indexOf('ACEROS') >= 0 && acuse.op.htmlBody.indexOf(guardado.id) > 0);
console.log('  repite lo que registró:', ['900617448','ACEROS DEL CARIBE SAS','compras@aceros.com']
  .every(v => acuse.op.htmlBody.indexOf(v) > 0));
console.log('  cuenta qué sigue:', /capacitación/.test(acuse.op.htmlBody));
console.log('  NO lleva el enlace a la base de datos:',
  acuse.op.htmlBody.indexOf(CONFIG.URL_BASE_DATOS) < 0, '← ese es solo del equipo');
console.log('  el del equipo sí lo lleva:', correosEnviados[0].op.htmlBody.indexOf(CONFIG.URL_BASE_DATOS) > 0);

console.log('\n--- constancia cuando es una corrección ---');
correosEnviados.length = 0;
const filas0 = filas.length;
avisarDeRegistro_({ ...datos, tipoSolicitud: 'Solicitud de edición' }, 'EMP-2026-0002');
const acuseEd = correosEnviados[1];
console.log('  habla de corrección, no de empresa nueva:',
  /solicitud de corrección/i.test(acuseEd.asunto) && !/quedó registrada/.test(acuseEd.op.htmlBody));
console.log('  qué sigue es el de edición:', /Actualizaremos los datos/.test(acuseEd.op.htmlBody));

console.log('\n--- si el correo del proveedor rebota ---');
correosEnviados.length = 0;
const original = MailApp.sendEmail;
MailApp.sendEmail = (para, a, t, o) => {
  if (para === 'compras@aceros.com') throw new Error('dirección inválida');
  correosEnviados.push({ para, asunto: a, op: o || {} });
};
const conFallo = avisarDeRegistro_(JSON.parse(JSON.stringify(datos)), 'EMP-2026-0003');
MailApp.sendEmail = original;
console.log('  el aviso al equipo salió igual:', correosEnviados.length === 1);
console.log('  la respuesta sigue siendo ok:', conFallo.ok === true);
console.log('  quedó anotado en ERRORES:', filas.length > filas0);

console.log('\n--- reportar un problema ---');
correosEnviados.length = 0;
const corto = reportarProblema_({ mensaje: 'no sirve', correo: '' });
console.log('  mensaje corto → rechaza:', !corto.ok, '·', (corto.errores || [])[0]);
console.log('  y no envió nada:', correosEnviados.length === 0);

const malCorreo = reportarProblema_({ mensaje: 'Al darle registrar no pasa nada', correo: 'esto-no-es-un-correo' });
console.log('  correo inválido → rechaza:', !malCorreo.ok);

const rep = reportarProblema_({ mensaje: 'Al darle registrar no pasa nada de nada', correo: 'proveedor@empresa.com' });
console.log('  reporte válido → acepta:', rep.ok);
console.log('  destino:', correosEnviados[0].para, '← solo soporte');
console.log('  no va a la lista de avisos:', correosEnviados[0].para.indexOf('juan.narvaezsalazar') < 0);
console.log('  responder le llega a quien reportó:', correosEnviados[0].op.replyTo === 'proveedor@empresa.com');
