/* Prueba del entorno de capacitaciones: el enrutador, el control de acceso y
   cómo se decide mostrar cada tipo de parte. Apps Script no corre fuera de
   Google, así que se le ponen dobles a Sheets, Drive y HtmlService: lo que se
   prueba es la lógica, que es donde están los errores. */
const fs = require('fs');
const raiz = '/home/user/Coloso_Holcim/capacitaciones/';

/* ---------- Dobles ---------- */
function hojaFalsa(filas) {
  return {
    getLastRow: () => filas.length,
    getLastColumn: () => (filas[0] || []).length,
    getRange: (f, c, nf, nc) => ({
      getValues: () => filas.slice(f - 1, f - 1 + nf).map(r => r.slice(c - 1, c - 1 + nc)),
      setValues() { return this; }, setFontWeight() { return this; },
      setBackground() { return this; }, setFontColor() { return this; }
    }),
    setFrozenRows() {}, autoResizeColumns() {}, appendRow(r) { filas.push(r); }
  };
}
const hojas = {
  CURSOS: hojaFalsa([
    ['ID','Nombre','Descripción','Vigencia (meses)','Dirigido a','Activo'],
    ['CUR-001','Reinducción','La de todos los años',12,'Todos','Sí'],
    ['CUR-002','Alturas','Solo planta',24,'Planta','Sí'],
    ['CUR-003','Curso viejo','Ya no se dicta',12,'Todos','No']
  ]),
  MODULOS: hojaFalsa([
    ['ID','Curso','Orden','Nombre','Tipo','Origen','Minutos'],
    ['MOD-003','CUR-001',3,'Cartilla','PDF','https://drive.google.com/file/d/1PDF_DE_PRUEBA_AAA/view',10],
    ['MOD-001','CUR-001',1,'Presentación','HTML','1HTML_DE_PRUEBA_BBB',20],
    ['MOD-002','CUR-001',2,'Video','VIDEO','https://www.youtube.com/watch?v=ABC123xyz',8],
    ['MOD-004','CUR-001',4,'Encuesta','ENLACE','https://forms.gle/algo',5],
    ['MOD-005','CUR-001',5,'Sin tipo válido','OTRO','x',1],
    ['MOD-006','CUR-002',1,'Video en Drive','VIDEO','1VIDEO_EN_DRIVE_CCC',30]
  ]),
  ASISTENCIAS: hojaFalsa([['Fecha','Curso','Módulo','Cédula','Nombre','Correo','Autorizado a']]),
  ERRORES: hojaFalsa([['Fecha','Detalle']])
};
const SpreadsheetApp = {
  openById: () => ({ getSheetByName: n => hojas[n] || null, getName: () => 'Libro de prueba', getUrl: () => 'https://…' }),
  getActive: () => null
};
const ScriptApp = { getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/AKfy/exec' }) };
const DriveApp = {
  getFileById: id => ({
    getName: () => id + '.archivo',
    getBlob: () => ({
      getDataAsString: () => '<html><body>Contenido de ' + id + '</body></html>',
      getBytes: () => Buffer.alloc(id === 'PESADO' ? 12 * 1024 * 1024 : 2048)
    })
  })
};
const Utilities = { base64Encode: b => Buffer.from(b).toString('base64') };
const Session = { getActiveUser: () => ({ getEmail: () => 'alguien@holcim.com' }) };
function salida(archivo, valores) {
  return { archivo, valores, setTitle() { return this; }, addMetaTag() { return this; },
           setXFrameOptionsMode(m) { this.marco = m; return this; }, getContent: () => '' };
}
const HtmlService = {
  createTemplateFromFile: n => ({ __archivo: n, evaluate() { return salida(this.__archivo, this); } }),
  createHtmlOutputFromFile: n => salida(n, {}),
  createHtmlOutput: c => salida('(crudo)', { contenido: c }),
  XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
};

/* Un solo eval, arriba del todo: si va dentro de un forEach, las funciones
   quedan encerradas en esa vuelta y no se ven desde aquí. */
eval(['Config.gs', 'Acceso.gs', 'Datos.gs', 'Web.gs']
  .map(a => fs.readFileSync(raiz + a, 'utf8')).join('\n'));

CONFIG.ID_LIBRO = 'LIBRO-DE-PRUEBA';

const abrir = parametros => doGet({ parameter: parametros });
const CLAVE = 'HOLCIM-2026-CONTRATISTAS';

console.log('--- Sin claves: entra cualquiera que tenga sesión de Holcim ---');
let r = abrir({});
console.log('  pantalla:', r.archivo, '· cursos activos:', r.valores.cursos.length,
            '(el inactivo no sale)');
console.log('  primer curso:', r.valores.cursos[0].nombre,
            '·', r.valores.cursos[0].partes, 'partes ·', r.valores.cursos[0].minutos, 'min');

console.log('\n--- Con claves: no se entrega nada sin una válida ---');
CONFIG.CLAVES = {}; CONFIG.CLAVES[CLAVE] = 'Contratistas planta A';
console.log('  sin clave      →', abrir({}).archivo);
r = abrir({ clave: 'HOLCIM-INVENTADA' });
console.log('  clave mala     →', r.archivo, '·', JSON.stringify(r.valores.mensaje));
r = abrir({ clave: '  holcim-2026-contratistas ' });
console.log('  clave buena    →', r.archivo, '· entró como:', JSON.stringify(r.valores.quien));
console.log('  contenido sin clave →', abrir({ p: 'crudo', curso: 'CUR-001', modulo: 'MOD-001' }).archivo,
            ' ← ni el material se entrega');

console.log('\n--- El curso, partido en partes y en orden ---');
r = abrir({ p: 'curso', curso: 'CUR-001', clave: CLAVE });
r.valores.partes.forEach(m => console.log('  ' + m.numero + '. ' + m.nombre.padEnd(14) + m.tipo));
console.log('  la parte con tipo inválido no aparece:',
            !r.valores.partes.some(m => m.nombre.indexOf('Sin tipo') === 0));

console.log('\n--- Cómo se muestra cada tipo ---');
[['MOD-001','HTML'],['MOD-003','PDF'],['MOD-002','VIDEO de YouTube'],['MOD-004','ENLACE']].forEach(([id, etiqueta]) => {
  const v = abrir({ p: 'modulo', curso: 'CUR-001', modulo: id, clave: CLAVE }).valores;
  console.log('  ' + etiqueta.padEnd(18) + '→ ' + v.visor.modo + '  ' + v.visor.src.replace(/^https:\/\//, ''));
});
const drive = abrir({ p: 'modulo', curso: 'CUR-002', modulo: 'MOD-006', clave: CLAVE }).valores;
console.log('  VIDEO en Drive    → ' + drive.visor.modo + '  ' + drive.visor.src.replace(/^https:\/\//, ''));
console.log('    avisa: ' + drive.visor.aviso);

console.log('\n--- Navegación ---');
const medio = abrir({ p: 'modulo', curso: 'CUR-001', modulo: 'MOD-002', clave: CLAVE }).valores;
console.log('  parte ' + medio.numero + ' de ' + medio.total +
            ' · anterior:', !!medio.urlAnterior, '· siguiente:', !!medio.urlSiguiente);
const ultimo = abrir({ p: 'modulo', curso: 'CUR-001', modulo: 'MOD-004', clave: CLAVE }).valores;
console.log('  última parte  · siguiente:', !!ultimo.urlSiguiente, '← termina, no cuelga');
console.log('  la clave viaja en los enlaces:', medio.urlSiguiente.indexOf('clave=') > 0);

console.log('\n--- El material se sirve desde el script ---');
const crudo = abrir({ p: 'crudo', curso: 'CUR-001', modulo: 'MOD-001', clave: CLAVE });
console.log('  HTML  →', JSON.stringify(crudo.valores.contenido.slice(0, 45)),
            '· se deja enmarcar:', crudo.marco === 'ALLOWALL');
const pdf = abrir({ p: 'crudo', curso: 'CUR-001', modulo: 'MOD-003', clave: CLAVE });
console.log('  PDF   → incrustado en la página:', pdf.valores.contenido.indexOf('data:application/pdf;base64,') > 0);
CONFIG.MAXIMO_PDF_MB = 0.001;
console.log('  PDF que se pasa del tope →',
            abrir({ p: 'crudo', curso: 'CUR-001', modulo: 'MOD-003', clave: CLAVE })
              .valores.contenido.indexOf('El tope para mostrarlo') > 0 ? 'lo dice, no revienta' : 'FALLA');
CONFIG.MAXIMO_PDF_MB = 10;

console.log('\n--- Lo que no existe ---');
console.log('  curso inventado  →', abrir({ p: 'curso', curso: 'CUR-999', clave: CLAVE }).archivo);
console.log('  curso inactivo   →', abrir({ p: 'curso', curso: 'CUR-003', clave: CLAVE }).archivo);
console.log('  parte inventada  →', abrir({ p: 'modulo', curso: 'CUR-001', modulo: 'MOD-999', clave: CLAVE }).archivo);
