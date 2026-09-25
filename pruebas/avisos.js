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
  URL_BASE_DATOS: 'https://docs.google.com/spreadsheets/d/XXX/edit'
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
console.log('  un solo correo:', correosEnviados.length === 1);
console.log('  a los dos responsables:', correosEnviados[0].para);
console.log('  el asunto nombra la empresa:', /ACEROS DEL CARIBE SAS/i.test(correosEnviados[0].asunto));

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
