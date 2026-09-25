/* Creación y edición tienen la regla inversa sobre el NIT: para crear no
   puede existir, para corregir tiene que existir. Sin esto, toda solicitud
   de edición se rechazaría por duplicada. */
const fs = require('fs');

const CONFIG = {
  TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'],
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES' },
  ENCABEZADOS: { EMPRESAS: ['ID','Fecha','Tipo de solicitud','NIT','DV','Nombre empresa','Correo','Diligenciado por'],
                 ERRORES: ['Fecha','Detalle'] },
  ID_HOJA_HOLCIM: '', NOTIFICAR_A: []
};

/* Hoja simulada con una empresa ya registrada */
const filas = [CONFIG.ENCABEZADOS.EMPRESAS.slice(),
               ['EMP-2026-0001','ayer','Solicitud de creación','900617448',1,'PRENSA','viejo@empresa.com','']];
const hoja = {
  getLastRow: () => filas.length, getLastColumn: () => filas[0].length,
  appendRow: f => filas.push(f),
  getRange: (f,c,nf,nc) => ({ getValues: () => filas.slice(f-1, f-1+nf).map(x => x.slice(c-1, c-1+nc)),
    setValues(){return this;}, setFontWeight(){return this;}, setBackground(){return this;},
    setFontColor(){return this;}, setValue(){return this;} }),
  setFrozenRows(){}, autoResizeColumns(){},
  getName: () => 'EMPRESAS', getSheetId: () => 'EMPRESAS', getParent: () => libro
};
const libro = { getId: () => 'A', getName: () => 'x', getUrl: () => 'x',
                getSheetByName: n => n === 'EMPRESAS' ? hoja : null, insertSheet: () => hoja };
const SpreadsheetApp = { getActive: () => libro, openById: () => libro };
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
