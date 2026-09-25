/* Prueba de integración: reproduce lo que arma el formulario y se lo pasa
   a la validación del servidor. Es la junta donde nadie mira, y donde ya
   se escondió un error: el teléfono llegaba con el indicativo puesto y el
   servidor contaba 12 dígitos en vez de 10. */
const fs = require('fs');

/* El servidor lee CONFIG, así que hay que dárselo tal como está. */
const CONFIG = { TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'] };
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/registro/Validaciones.gs', 'utf8'));

/* Copia exacta de la normalización del formulario (vista/index.html, enviar()) */
const soloDigitos = v => String(v || '').replace(/[^0-9]/g, '');
const limpiar = v => String(v || '').trim().replace(/\s+/g, ' ');

function comoLoEnviaElFormulario(c) {
  return {
    tipoSolicitud: limpiar(c.tipoSolicitud),
    nit: soloDigitos(c.nit),
    nombreEmpresa: limpiar(c.nombreEmpresa).toUpperCase(),
    correoEmpresa: limpiar(c.correoEmpresa).toLowerCase(),
    /* Este lo pone el servicio del formulario con la sesión, no la página. */
    correoRegistra: limpiar(c.correoRegistra).toLowerCase()
  };
}

const escrito = {
  tipoSolicitud: 'Solicitud de creación',
  nit: '848848338',
  nombreEmpresa: 'Prueba 1',
  correoEmpresa: 'Prueba1@Gmail.com',
  correoRegistra: 'Juan.Perez@Empresa.COM'
};

const enviado = comoLoEnviaElFormulario(escrito);
console.log('Lo que viaja al servidor:');
console.log('  ' + JSON.stringify(enviado));
const r = depurarEmpresa_(enviado);
console.log('  servidor → ' + (r.ok ? 'ACEPTADO' : 'RECHAZADO'));
if (r.ok) console.log('  se guarda → ' + JSON.stringify(r.datos));
else r.errores.forEach(e => console.log('    - ' + e));

console.log('\nPasando por el formulario, casos que deben rechazarse:');
[
  ['sin tipo de solicitud', { tipoSolicitud: '' }],
  ['tipo inventado',        { tipoSolicitud: 'Solicitud de borrado' }],
  ['NIT corto',             { nit: '1234' }],
  ['correo malo',           { correoEmpresa: 'sin-arroba' }]
].forEach(([etiqueta, cambio]) => {
  const p = depurarEmpresa_(comoLoEnviaElFormulario({ ...escrito, ...cambio }));
  console.log('  ' + etiqueta.padEnd(22) + '→ ' + (p.ok ? 'ACEPTA (mal)' : 'rechaza: ' + p.errores[0]));
});

/* Sin pasar por el formulario: alguien llamando la URL directamente. Aquí
   el valor llega crudo, y es el servidor el único que lo puede frenar. */
console.log('\nSaltándose el formulario, con el dato crudo:');
[
  ['NIT con guion',  { ...enviado, nit: '900123456-1' }],
  ['NIT con puntos', { ...enviado, nit: '900.123.456' }],
  ['sin nada',       {}]
].forEach(([etiqueta, cuerpo]) => {
  const p = depurarEmpresa_(cuerpo);
  console.log('  ' + etiqueta.padEnd(22) + '→ ' + (p.ok ? 'ACEPTA (mal)' : 'rechaza: ' + p.errores[0]));
});

console.log('\nSin sesión de Google (nadie identificado):');
const sinQuien = depurarEmpresa_(comoLoEnviaElFormulario({ ...escrito, correoRegistra: '' }));
console.log('  → ' + (sinQuien.ok
  ? 'acepta y lo deja vacío — correcto, no es un dato que el proveedor escriba'
  : 'rechaza: ' + sinQuien.errores.join(' / ')));

console.log('\nDV de 848848338 = ' + calcularDV_('848848338'));
