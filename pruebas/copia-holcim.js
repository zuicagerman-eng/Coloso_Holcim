/* Doble de SpreadsheetApp con dos libros: el personal y el de Holcim. */
const fs = require('fs');
function libroFalso(nombre) {
  const hojas = {};
  return {
    nombre, hojas,
    getName: () => nombre,
    getUrl: () => 'https://docs.google.com/…/' + nombre,
    getSheetByName: n => hojas[n] || null,
    insertSheet: n => (hojas[n] = {
      filas: [],
      getLastRow(){ return this.filas.length; },
      getLastColumn(){ return this.filas.length ? this.filas[0].length : 0; },
      appendRow(f){ this.filas.push(f); },
      getRange(){ const h=this; return { getValues:()=>[h.filas[0]||[]],
        setValues(v){ if (h.filas.length) h.filas[0]=v[0]; else h.filas.push(v[0]); return this; },
        setFontWeight(){return this;}, setBackground(){return this;}, setFontColor(){return this;}, setValue(){return this;} }; },
      setFrozenRows(){}, autoResizeColumns(){}
    })
  };
}
const personal = libroFalso('Registro (personal)');
const holcim   = libroFalso('Registro (HOLCIM)');
let romperCopia = false;

const CONFIG = {
  ID_HOJA_HOLCIM: 'ID-DE-HOLCIM',
  HOJAS: { EMPRESAS:'EMPRESAS', PERSONAS:'PERSONAS', ERRORES:'ERRORES' },
  ENCABEZADOS: {
    EMPRESAS: ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Teléfono'],
    PERSONAS: ['ID','Fecha','Nombres','Primer apellido','Segundo apellido','Nombre completo','Cédula','Correo','NIT empresa','Nombre empresa'],
    ERRORES:  ['Fecha','Detalle']
  }
};
const SpreadsheetApp = {
  getActive: () => personal,
  openById: id => { if (romperCopia) throw new Error('no tienes permiso sobre ese archivo'); return holcim; }
};
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/Hoja.gs','utf8'));

agregarFila_('EMPRESAS', {'ID':'EMP-2026-0001','NIT':'848848338','Nombre empresa':'PRUEBA 1','Correo':'p@g.com','Teléfono':'+571234567890','DV':0,'Fecha':'hoy'});
console.log('EMPRESAS en personal:', personal.hojas.EMPRESAS.filas.length - 1, 'fila(s) de datos');
console.log('EMPRESAS en Holcim :', holcim.hojas.EMPRESAS.filas.length - 1, 'fila(s) de datos');
console.log('  contenido idéntico:', JSON.stringify(personal.hojas.EMPRESAS.filas[1]) === JSON.stringify(holcim.hojas.EMPRESAS.filas[1]));

console.log('\n--- si Holcim niega el acceso ---');
romperCopia = true;
agregarFila_('EMPRESAS', {'ID':'EMP-2026-0002','NIT':'900123456','Nombre empresa':'PRUEBA 2','Correo':'q@g.com','Teléfono':'+573001112233','DV':8,'Fecha':'hoy'});
console.log('  el registro principal se guardó igual:', personal.hojas.EMPRESAS.filas.length - 1, 'filas');
console.log('  quedó anotado en ERRORES:', personal.hojas.ERRORES.filas.length - 1, 'vez');
console.log('  detalle:', personal.hojas.ERRORES.filas[1][1]);
console.log('  ERRORES NO se copió a Holcim (sin recursión):', !holcim.hojas.ERRORES);
