/* Creación y edición tienen la regla inversa sobre el NIT: para crear no
   puede existir, para corregir tiene que existir. Sin esto, toda solicitud
   de edición se rechazaría por duplicada. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

const CONFIG = {
  TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'],
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES' },
  ENCABEZADOS: { EMPRESAS: ['ID','Fecha','Tipo de solicitud','NIT','DV','Nombre empresa','Correo','Diligenciado por'],
                 ERRORES: ['Fecha','Detalle'] },
  ID_HOJA_HOLCIM: '', NOTIFICAR_A: []
};
CONFIG.HOJAS.CORREOS = 'CORREOS';
CONFIG.ENCABEZADOS.CORREOS = ['Fecha','Radicado','Tipo','Para','Estado','Detalle'];

/* Hoja simulada con una empresa ya registrada */
const libro = libroFalso('A', { EMPRESAS: CONFIG.ENCABEZADOS.EMPRESAS });
const hoja = libro.hojas.EMPRESAS;
hoja.getRange(2, 1, 1, CONFIG.ENCABEZADOS.EMPRESAS.length).setValues([
  ['EMP-2026-0001','ayer','Solicitud de creación','900617448',1,'PRENSA','viejo@empresa.com','']
]);
const SpreadsheetApp = { getActive: () => libro, openById: () => libro, CopyPasteType };
const LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
const ContentService = { createTextOutput: t => ({ setMimeType: () => t }), MimeType: { JSON: 1 } };
const HtmlService = {};
const avisar_ = () => {};

/* Un solo eval en el ámbito del módulo: dentro de un forEach las funciones
   quedarían encerradas en la llamada y no se verían aquí. */
eval(['registro/Validaciones.gs','registro/Hoja.gs','registro/Api.gs']
  .map(f => fs.readFileSync('/home/user/Coloso_Holcim/apps-script/' + f, 'utf8'))
  .join('\n'));

const base = { nit:'900617448', nombreEmpresa:'Prensa', correoEmpresa:'nuevo@empresa.com', correoRegistra:'' };
const nueva = { ...base, nit:'860002964', nombreEmpresa:'Otra empresa' };

const casos = [
  ['CREACIÓN de un NIT que ya existe', { ...base,  tipoSolicitud:'Solicitud de creación' }],
  ['CREACIÓN de un NIT nuevo',         { ...nueva, tipoSolicitud:'Solicitud de creación' }],
  ['EDICIÓN de un NIT que existe',     { ...base,  tipoSolicitud:'Solicitud de edición' }],
  ['EDICIÓN de un NIT que no existe',  { ...nueva, nit:'999999999', tipoSolicitud:'Solicitud de edición' }]
];
casos.forEach(([etiqueta, datos]) => {
  const r = guardarEmpresa_(datos);
  console.log(etiqueta.padEnd(36) + '→ ' + (r.ok ? 'ACEPTA · ' + r.mensaje : 'rechaza: ' + r.errores[0]));
});

console.log('\nLa lista que ve el formulario (última versión de cada NIT):');
empresasRegistradas_().forEach(e => console.log('  ' + e.nombre + ' · ' + e.nit + ' · ' + e.correo));
