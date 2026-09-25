/* Comprueba que quitar un campo del modelo no descoloca las filas nuevas
   en una hoja que ya tiene la columna vieja. */
const fs=require('fs');
function libroFalso(id, columnas) {
  const hojas={};
  const crear = n => (hojas[n]={ filas:[columnas.slice()],
    getLastRow(){return this.filas.length;}, getLastColumn(){return this.filas[0].length;},
    appendRow(f){this.filas.push(f);},
    getRange(fila,col,nf,nc){const h=this;return{
      getValues:()=>[h.filas[0].slice(col-1, col-1+nc)],
      setValues(v){ for(let i=0;i<v[0].length;i++) h.filas[0][col-1+i]=v[0][i]; return this;},
      setFontWeight(){return this;},setBackground(){return this;},setFontColor(){return this;},setValue(){return this;}};},
    setFrozenRows(){},autoResizeColumns(){},
    /* Una hoja de verdad sabe quién es y en qué libro vive */
    getName:()=>n, getSheetId:()=>n, getParent:()=>({getId:()=>id})});
  return { getId:()=>id, getName:()=>'x', getUrl:()=>'x', getSheetByName:n=>hojas[n]||null, insertSheet:crear, hojas };
}
// La hoja YA tiene la columna Teléfono, de antes
const libro = libroFalso('A', ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Teléfono','Diligenciado por']);
libro.insertSheet('EMPRESAS');
libro.hojas.EMPRESAS.filas[0] = ['ID','Fecha','NIT','DV','Nombre empresa','Correo','Teléfono','Diligenciado por'];

// Pero el modelo nuevo ya no tiene Teléfono, y sí Tipo de solicitud
const CONFIG={ ID_HOJA_HOLCIM:'', HOJAS:{EMPRESAS:'EMPRESAS',ERRORES:'ERRORES'},
  ENCABEZADOS:{ EMPRESAS:['ID','Fecha','Tipo de solicitud','NIT','DV','Nombre empresa','Correo','Diligenciado por'],
                ERRORES:['Fecha','Detalle'] }};
const SpreadsheetApp={getActive:()=>libro, openById:()=>libro};
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Hoja.gs','utf8'));

agregarFila_('EMPRESAS',{ 'ID':'EMP-2026-0006','Fecha':'hoy','Tipo de solicitud':'Solicitud de creación',
  'NIT':'900123456','DV':8,'Nombre empresa':'PRUEBA','Correo':'a@b.com','Diligenciado por':'yo@g.com' });

const h = libro.hojas.EMPRESAS;
console.log('Encabezados de la hoja:'); console.log('  ' + h.filas[0].join(' | '));
console.log('Fila nueva:');             console.log('  ' + h.filas[1].join(' | '));
const idx = h.filas[0].indexOf('Diligenciado por');
console.log('\n¿El correo quedó en su columna?', h.filas[1][idx] === 'yo@g.com' ? 'SÍ' : 'NO — descolocado');
console.log('¿Se agregó la columna nueva?', h.filas[0].includes('Tipo de solicitud') ? 'SÍ' : 'NO');
console.log('Teléfono (columna vieja):', JSON.stringify(h.filas[1][h.filas[0].indexOf('Teléfono')]), '← vacía, sin estorbar');
