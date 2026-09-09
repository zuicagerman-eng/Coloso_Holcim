/* Prueba de la clave de acceso: el formulario se publica en abierto, así que
   lo único que separa a un proveedor invitado de cualquiera que dé con el
   enlace es este control. Se prueba contra manejar_, que es por donde entran
   las dos vías (la página y la URL). */
const fs = require('fs');
const raiz = '/home/user/Coloso_Holcim/apps-script/';

const CONFIG = {
  CLAVES: {},
  HOJAS: { EMPRESAS:'EMPRESAS', PERSONAS:'PERSONAS', ERRORES:'ERRORES' }
};

/* Dobles de la capa de hoja: aquí no se prueba la escritura, solo quién pasa. */
let guardadas = [];
function agregarFila_(hoja, fila) { guardadas.push(fila); }
function existe_() { return false; }
function siguienteId_(prefijo) { return prefijo + '-2026-0001'; }
function empresasRegistradas_() { return [{ nit:'848848338', nombre:'PRUEBA 1' }]; }
function nombreDeEmpresa_() { return 'PRUEBA 1'; }
function anotarError_(d) { console.log('  ERROR ANOTADO:', d); }
function avisar_() {}
const LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
const ContentService = { MimeType:{ JSON:'json' }, createTextOutput:()=>({ setMimeType:()=>({}) }) };

eval(fs.readFileSync(raiz + 'Validaciones.gs','utf8'));
eval(fs.readFileSync(raiz + 'Api.gs','utf8'));

const EMPRESA = {
  nit:'848848338', nombreEmpresa:'PRUEBA 1',
  correoEmpresa:'prueba1@gmail.com', contacto:'+573154421180'
};
const registrar = clave => manejar_({ accion:'registrarEmpresa', clave, datos: EMPRESA });
const veredicto = r => r.ok ? 'ACEPTADO' : (r.claveInvalida ? 'RECHAZADO por la clave' : 'RECHAZADO: ' + r.errores[0]);

console.log('--- Sin claves en Config: el formulario queda abierto ---');
console.log('  estado          → pideClave:', manejar_({ accion:'estado' }).pideClave);
guardadas = [];
console.log('  registrar sin clave →', veredicto(registrar('')));
console.log('  columna "Autorizado a" →', JSON.stringify(guardadas[0]['Autorizado a']));

console.log('\n--- Con una clave por empresa ---');
CONFIG.CLAVES = {
  'HOLCIM-2026-ANDINA': 'Constructora Andina S.A.S.',
  'HOLCIM-2026-DELTA':  'Montajes Delta Ltda.'
};
console.log('  estado (sin clave) → pideClave:', manejar_({ accion:'estado' }).pideClave,
            ' ← se responde sin exigirla: es lo que la pantalla consulta al abrirse');
console.log('  sin clave        →', veredicto(registrar('')));
console.log('  clave inventada  →', veredicto(registrar('HOLCIM-2026-OTRA')));
console.log('  lista de empresas sin clave →', veredicto(manejar_({ accion:'empresas' })));

guardadas = [];
const r = registrar('  holcim-2026-andina  ');
console.log('  clave buena, escrita en minúsculas y con espacios →', veredicto(r), '·', r.id);
console.log('  columna "Autorizado a" →', JSON.stringify(guardadas[0]['Autorizado a']),
            ' ← cada registro dice con qué clave entró');

const entrada = manejar_({ accion:'entrar', clave:'HOLCIM-2026-DELTA' });
console.log('  entrar con la otra clave →', entrada.ok ? 'abre para ' + entrada.para : 'no abre');

console.log('\n--- Quitar el acceso a uno solo ---');
delete CONFIG.CLAVES['HOLCIM-2026-DELTA'];
console.log('  la clave retirada  →', veredicto(registrar('HOLCIM-2026-DELTA')));
console.log('  la de los demás    →', veredicto(registrar('HOLCIM-2026-ANDINA')));
