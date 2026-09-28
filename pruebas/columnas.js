/* Comprueba que quitar un campo del modelo no descoloca las filas nuevas
   en una hoja que ya tiene la columna vieja. */
const fs = require('fs');
const { libroFalso, CopyPasteType } = require('./hoja-falsa.js');

// La hoja YA tiene la columna Teléfono, de antes
const libro = libroFalso('A', {
  EMPRESAS: ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Teléfono','Diligenciado por']
});

// Pero el modelo nuevo ya no tiene Teléfono, y sí Tipo de solicitud
const CONFIG = { ID_HOJA_HOLCIM:'', HOJAS:{EMPRESAS:'EMPRESAS',ERRORES:'ERRORES',CORREOS:'CORREOS'},
  ENCABEZADOS:{ EMPRESAS:['ID','Fecha','Tipo de solicitud','NIT','DV','Nombre empresa','Correo','Diligenciado por'],
                ERRORES:['Fecha','Detalle'], CORREOS:['Fecha','Radicado','Tipo','Para','Estado','Detalle'] }};
const SpreadsheetApp = { getActive:()=>libro, openById:()=>libro, CopyPasteType };
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Hoja.gs','utf8'));

agregarFila_('EMPRESAS',{ 'ID':'EMP-2026-0006','Fecha':'hoy','Tipo de solicitud':'Solicitud de creación',
  'NIT':'900123456','DV':8,'Nombre empresa':'PRUEBA','Correo':'a@b.com','Diligenciado por':'yo@g.com' });

const h = libro.hojas.EMPRESAS;
console.log('Encabezados de la hoja:'); console.log('  ' + h.fila(1).join(' | '));
console.log('Fila nueva:');             console.log('  ' + h.fila(2).join(' | '));
const idx = h.fila(1).indexOf('Diligenciado por');
console.log('\n¿El correo quedó en su columna?', h.fila(2)[idx] === 'yo@g.com' ? 'SÍ' : 'NO — descolocado');
console.log('¿Se agregó la columna nueva?', h.fila(1).includes('Tipo de solicitud') ? 'SÍ' : 'NO');
console.log('Teléfono (columna vieja):', JSON.stringify(h.fila(2)[h.fila(1).indexOf('Teléfono')]), '← vacía, sin estorbar');
