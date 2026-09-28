/* El radicado es lo único que tiene la empresa para preguntar por su
   solicitud, así que no se puede repetir. Contando filas sí se repetía:
   bastaba borrar una para que el siguiente registro reusara un número ya
   entregado. Ahora sale del número más alto que haya escrito. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

const COLUMNAS = ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Tipo de solicitud'];
const CONFIG = {
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES', CORREOS: 'CORREOS' },
  ENCABEZADOS: { EMPRESAS: COLUMNAS, ERRORES: ['Fecha','Detalle'],
                 CORREOS: ['Fecha','Radicado','Tipo','Para','Estado','Detalle'] },
  ID_HOJA_HOLCIM: ''
};
const libro = libroFalso('A', { EMPRESAS: COLUMNAS });
const hoja = libro.hojas.EMPRESAS;
const SpreadsheetApp = { getActive: () => libro, openById: () => libro, CopyPasteType };
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Hoja.gs', 'utf8'));

const anio = new Date().getFullYear();
const poner = (fila, id) => hoja.getRange(fila, 1).setValue(id);

console.log('Hoja vacía           →', siguienteId_('EMP', 'EMPRESAS'));

poner(2, 'EMP-' + anio + '-0003');
poner(3, 'EMP-' + anio + '-0004');
console.log('Con 0003 y 0004      →', siguienteId_('EMP', 'EMPRESAS'), '← sigue por 0005');

/* El caso que falló de verdad: dos filas, pero numeradas 3 y 4 porque
   antes se borraron otras. Contando filas habría dado 0003 otra vez. */
console.log('  ¿repite un radicado ya entregado?',
  siguienteId_('EMP', 'EMPRESAS') === 'EMP-' + anio + '-0003' ? 'SÍ — mal' : 'no');

/* Si se borra la última, su número vuelve a quedar libre. Es lo que se
   quiere: la fila que se borra es la de una prueba o la de un error, y su
   radicado no quedó en manos de nadie. Lo que no puede pasar —y es lo que
   pasaba— es repetir el radicado de una fila que SIGUE en la hoja. */
hoja.deleteRow(3);
console.log('Se borra la de 0004  →', siguienteId_('EMP', 'EMPRESAS'),
            '← ese número queda libre otra vez');
console.log('  pero nunca choca con una fila viva:',
  columna_('EMPRESAS', 'ID').indexOf(siguienteId_('EMP', 'EMPRESAS')) < 0);

poner(3, 'EMP-' + anio + '-0012');
poner(4, 'algo escrito a mano');
poner(5, 'EMP-2019-0099');
console.log('Con basura de por medio y otro año →', siguienteId_('EMP', 'EMPRESAS'));
