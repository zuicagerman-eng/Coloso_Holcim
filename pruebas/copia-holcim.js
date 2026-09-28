/* Dos libros: el personal, donde vive el script, y el de Holcim. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

const COLUMNAS = ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Teléfono'];
const personal = libroFalso('Registro (personal)', { EMPRESAS: COLUMNAS });
const holcim   = libroFalso('Registro (HOLCIM)',   { EMPRESAS: COLUMNAS });
let romperCopia = false;

const CONFIG = {
  ID_HOJA_HOLCIM: 'ID-DE-HOLCIM',
  HOJAS: { EMPRESAS:'EMPRESAS', PERSONAS:'PERSONAS', ERRORES:'ERRORES', CORREOS:'CORREOS' },
  ENCABEZADOS: {
    EMPRESAS: COLUMNAS,
    PERSONAS: ['ID','Fecha','Nombres','Primer apellido','Segundo apellido','Nombre completo','Cédula','Correo','NIT empresa','Nombre empresa'],
    ERRORES:  ['Fecha','Detalle'],
    CORREOS:  ['Fecha','Radicado','Tipo','Para','Estado','Detalle']
  }
};
const SpreadsheetApp = {
  getActive: () => personal,
  openById: id => { if (romperCopia) throw new Error('no tienes permiso sobre ese archivo'); return holcim; },
  CopyPasteType
};
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Hoja.gs','utf8'));

const datos = n => personal.hojas.EMPRESAS.getLastRow() - 1;

agregarFila_('EMPRESAS', {'ID':'EMP-2026-0001','NIT':'848848338','Nombre empresa':'PRUEBA 1','Correo':'p@g.com','Teléfono':'+571234567890','DV':0,'Fecha':'hoy'});
console.log('EMPRESAS en personal:', personal.hojas.EMPRESAS.getLastRow() - 1, 'fila(s) de datos');
console.log('EMPRESAS en Holcim :', holcim.hojas.EMPRESAS.getLastRow() - 1, 'fila(s) de datos');
console.log('  contenido idéntico:',
  JSON.stringify(personal.hojas.EMPRESAS.fila(2)) === JSON.stringify(holcim.hojas.EMPRESAS.fila(2)));

console.log('\n--- si Holcim niega el acceso ---');
romperCopia = true;
agregarFila_('EMPRESAS', {'ID':'EMP-2026-0002','NIT':'900123456','Nombre empresa':'PRUEBA 2','Correo':'q@g.com','Teléfono':'+573001112233','DV':8,'Fecha':'hoy'});
console.log('  el registro principal se guardó igual:', personal.hojas.EMPRESAS.getLastRow() - 1, 'filas');
console.log('  quedó anotado en ERRORES:', personal.hojas.ERRORES.getLastRow() - 1, 'vez');
console.log('  detalle:', personal.hojas.ERRORES.fila(2)[1]);
console.log('  ERRORES NO se copió a Holcim (sin recursión):', !holcim.hojas.ERRORES);
