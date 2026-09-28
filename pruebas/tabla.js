/* La hoja de Holcim ya no es una lista suelta: es una TABLA con dos
   columnas que no salen del formulario —"Plazo para creación", que es una
   fórmula, y "Estado de solicitud", que es una lista para elegir—.

   Escribiendo solo los datos del formulario, la fila nueva quedaba con esas
   dos celdas en blanco: sin fórmula, sin lista, fuera de la tabla. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

const COLUMNAS = ['ID','Fecha','NIT','DV','Nombre empresa','Correo',
                  'Tipo de solicitud','Plazo para creación','Estado de solicitud'];

const CONFIG = {
  HOJAS: { EMPRESAS: 'EMPRESAS', ERRORES: 'ERRORES', CORREOS: 'CORREOS' },
  ENCABEZADOS: { EMPRESAS: COLUMNAS,
                 ERRORES: ['Fecha','Detalle'],
                 CORREOS: ['Fecha','Radicado','Tipo','Para','Estado','Detalle'] },
  ID_HOJA_HOLCIM: ''
};

const libro = libroFalso('A', { EMPRESAS: COLUMNAS });
const SpreadsheetApp = { getActive: () => libro, openById: () => libro, CopyPasteType };
const hoja = libro.hojas.EMPRESAS;

/* La fila que ya existe, como la dejó el jefe: fórmula en H, lista con un
   valor escrito a mano en I. */
hoja.getRange(2, 1, 1, COLUMNAS.length).setValues([
  ['EMP-2026-0003', '25/9/2026 12:56:38', '901010485', 1, 'TECNOMECANICA HR SAS',
   'tecnomecanicamack@gmail.com', 'Solicitud de creación', '', 'Creada']
]);
hoja.getRange(2, 8).setFormula('=SI(B2="", "", SI(I2="Creada", "On time", SI(HOY()-ENTERO(B2)<=2, "On time", "Overdue")))');
hoja.getRange(2, 8).setValidacion('On time / Overdue');
hoja.getRange(2, 9).setValidacion('Creada / Pendiente');
hoja.getRange(2, 9).setFormato('chip verde');

eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Hoja.gs', 'utf8'));

agregarFila_('EMPRESAS', {
  'ID': 'EMP-2026-0005', 'Fecha': '28/9/2026 09:10:00', 'NIT': '890900608', 'DV': 9,
  'Nombre empresa': 'CEMENTOS DEL VALLE S.A.', 'Correo': 'compras@cvalle.com',
  'Tipo de solicitud': 'Solicitud de creación'
});

const nueva = 3;
console.log('La fila nueva quedó pegada a la anterior:', hoja.getLastRow() === nueva);
console.log('Datos del formulario:', hoja.fila(nueva).slice(0, 7).join(' | '));

console.log('\n--- columna H, "Plazo para creación" ---');
const h = hoja.celdaEn(nueva, 8);
console.log('  heredó la fórmula:', !!h.formula);
console.log('  con las referencias corridas a su propia fila:',
  h.formula.indexOf('B3') > 0 && h.formula.indexOf('I3') > 0 && h.formula.indexOf('B2') < 0);
console.log('  ' + h.formula);
console.log('  heredó la lista:', h.validacion === 'On time / Overdue');

console.log('\n--- columna I, "Estado de solicitud" ---');
const i = hoja.celdaEn(nueva, 9);
console.log('  heredó la lista para elegir:', i.validacion === 'Creada / Pendiente');
console.log('  heredó el formato:', i.formato === 'chip verde');
console.log('  pero NO el valor de la fila de arriba:', i.valor === '',
  '← queda en blanco, la llena su equipo');

console.log('\n--- lo que el formulario sí escribe ---');
console.log('  no se lo pisó la herencia:',
  hoja.celdaEn(nueva, 1).valor === 'EMP-2026-0005' &&
  hoja.celdaEn(nueva, 5).valor === 'CEMENTOS DEL VALLE S.A.' &&
  hoja.celdaEn(nueva, 7).valor === 'Solicitud de creación');

console.log('\n--- la segunda fila nueva hereda de la primera ---');
agregarFila_('EMPRESAS', {
  'ID': 'EMP-2026-0006', 'Fecha': '28/9/2026 09:30:00', 'NIT': '860002964', 'DV': 4,
  'Nombre empresa': 'OTRA EMPRESA SAS', 'Correo': 'info@otra.com',
  'Tipo de solicitud': 'Solicitud de edición'
});
console.log('  fórmula en la fila 4:', hoja.celdaEn(4, 8).formula.indexOf('B4') > 0);
console.log('  lista en la fila 4:', hoja.celdaEn(4, 9).validacion === 'Creada / Pendiente');

console.log('\n--- una hoja recién creada, sin fila de la cual copiar ---');
const nuevoLibro = libroFalso('B', {});
const antes = SpreadsheetApp.getActive;
SpreadsheetApp.getActive = () => nuevoLibro;
delete _encabezados[nuevoLibro.getId() + '/EMPRESAS'];
agregarFila_('EMPRESAS', { 'ID': 'EMP-2026-0001', 'Nombre empresa': 'PRIMERA' });
console.log('  no se cae y escribe la primera fila:',
  nuevoLibro.hojas.EMPRESAS.celdaEn(2, 1).valor === 'EMP-2026-0001');
SpreadsheetApp.getActive = antes;
