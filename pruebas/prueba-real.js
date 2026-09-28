/* `pruebaCompleta` hace el recorrido entero contra la hoja de verdad. Lo
   que no puede hacer, ni una vez, es escribirle a la lista de avisos ni a
   un proveedor: la prueba es para ver que todo funciona, no para molestar
   a nadie. Y la fila que deja tiene que poder quitarse sin tocar las otras. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

const COLUMNAS = ['ID','Fecha','NIT','DV','Nombre empresa','Correo',
                  'Tipo de solicitud','Plazo para creación','Estado de solicitud'];

const CONFIG = {
  VERSION: 'prueba',
  TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'],
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES', CORREOS: 'CORREOS' },
  ENCABEZADOS: { EMPRESAS: COLUMNAS, ERRORES: ['Fecha','Detalle'],
                 CORREOS: ['Fecha','Radicado','Tipo','Para','Estado','Detalle'] },
  ID_HOJA_HOLCIM: '',
  NOTIFICAR_A: ['german.zuica@holcim.com', 'juan.narvaezsalazar@holcim.com'],
  CORREO_SOPORTE: 'german.zuica@holcim.com',
  CON_COPIA_OCULTA: [],
  NOMBRE_REMITENTE: 'Registros Holcim',
  ACUSE_AL_PROVEEDOR: true,
  TEXTO_QUE_SIGUE: 'Sigue la revisión.',
  TEXTO_QUE_SIGUE_EDICION: 'Actualizaremos los datos.',
  URL_BASE_DATOS: 'https://docs.google.com/spreadsheets/d/XXX/edit'
};

const libro = libroFalso('A', { EMPRESAS: COLUMNAS });
const hoja = libro.hojas.EMPRESAS;
/* Una empresa de verdad, ya registrada: la prueba no la puede tocar */
hoja.getRange(2, 1, 1, COLUMNAS.length).setValues([
  ['EMP-2026-0003','25/9/2026','901010485',1,'TECNOMECANICA HR SAS',
   'tecnomecanicamack@gmail.com','Solicitud de creación','','Creada']
]);
hoja.getRange(2, 8).setFormula('=SI(B2="","",SI(I2="Creada","On time","Overdue"))');
hoja.getRange(2, 9).setValidacion('Creada / Pendiente');

const correos = [];
const SpreadsheetApp = { getActive: () => libro, openById: () => libro, CopyPasteType };
const LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
const ContentService = { createTextOutput: t => ({ setMimeType: () => t }), MimeType: { JSON: 1 } };
const HtmlService = {};
const MailApp = { sendEmail: (para, asunto, texto, op) => correos.push({ para, asunto, op: op || {} }) };
const Session = { getScriptTimeZone: () => 'America/Bogota', getActiveUser: () => ({ getEmail: () => '' }) };
const Utilities = { formatDate: () => '28 de septiembre de 2026, 8:50 a. m.' };

eval(['registro/Validaciones.gs','registro/Hoja.gs','registro/Correo.gs','registro/Api.gs']
  .map(f => fs.readFileSync('/home/user/Coloso_Holcim/apps-script/' + f, 'utf8'))
  .join('\n'));

const informe = pruebaCompleta();

console.log('--- a quién le llegó ---');
console.log('  correos enviados:', correos.length);
correos.forEach(c => console.log('   →', c.para, '·', c.asunto.slice(0, 40)));
const destinos = correos.map(c => c.para).join(' ');
console.log('  TODO fue a german.zuica:', destinos.split(' ').every(d => d === 'german.zuica@holcim.com'));
console.log('  Juan NO recibió nada:', destinos.indexOf('juan.narvaezsalazar') < 0);
console.log('  ningún proveedor de verdad recibió nada:', destinos.indexOf('tecnomecanicamack') < 0);

console.log('\n--- la lista de avisos quedó como estaba ---');
console.log('  ' + CONFIG.NOTIFICAR_A.join(', '));
console.log('  intacta:', CONFIG.NOTIFICAR_A.length === 2 &&
  CONFIG.NOTIFICAR_A[1] === 'juan.narvaezsalazar@holcim.com');

console.log('\n--- la fila de prueba ---');
console.log('  se escribió:', hoja.getLastRow() === 3);
console.log('  se llama:', hoja.getRange(3, 5).getValue());
console.log('  heredó la fórmula del plazo:', !!hoja.celdaEn(3, 8).formula);
console.log('  heredó la lista del estado:', hoja.celdaEn(3, 9).validacion === 'Creada / Pendiente');

console.log('\n--- el informe le dice qué mirar ---');
console.log(informe.split('\n').filter(l => /Radicado|NO recibió|Plazo|Estado|borrarFilaDePrueba/.test(l))
  .map(l => '  ' + l.trim()).join('\n'));

console.log('\n--- borrarla no toca las demás ---');
console.log('  ' + borrarFilaDePrueba());
console.log('  filas de datos que quedan:', hoja.getLastRow() - 1);
console.log('  la empresa de verdad sigue ahí:', hoja.getRange(2, 1).getValue() === 'EMP-2026-0003');
console.log('  y su fórmula también:', !!hoja.celdaEn(2, 8).formula);
console.log('  ' + borrarFilaDePrueba());
