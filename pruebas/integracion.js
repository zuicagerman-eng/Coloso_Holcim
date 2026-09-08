/* Prueba de integración: reproduce lo que arma el formulario y se lo pasa
   a la validación del servidor. Esto es lo que nunca probé junto. */
const fs = require('fs');
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/Validaciones.gs','utf8'));

// Copia exacta de la normalización del formulario (vista/index.html, enviar())
const soloDigitos = v => String(v||'').replace(/[^0-9]/g,'');
const limpiar = v => String(v||'').trim().replace(/\s+/g,' ');
const INDICATIVO = '+57';
function comoLoEnviaElFormulario(c) {
  return {
    nit: soloDigitos(c.nit),
    nombreEmpresa: limpiar(c.nombreEmpresa).toUpperCase(),
    correoEmpresa: limpiar(c.correoEmpresa).toLowerCase(),
    contacto: INDICATIVO + soloDigitos(c.contacto)
  };
}

const escrito = { nit:'848848338', nombreEmpresa:'Prueba 1', correoEmpresa:'prueba1@gmail.com', contacto:'1234567890' };
const enviado = comoLoEnviaElFormulario(escrito);
console.log('Tu caso — lo que viaja al servidor:');
console.log('  ' + JSON.stringify(enviado));
const r = depurarEmpresa_(enviado);
console.log('  servidor → ' + (r.ok ? 'ACEPTADO' : 'RECHAZADO'));
if (r.ok) console.log('  se guarda → ' + JSON.stringify(r.datos));
else r.errores.forEach(e => console.log('    - ' + e));

console.log('\nOtros teléfonos:');
[['3154421180','normal'],['315 442 1180','con espacios'],['12345','corto (5)'],['12345678901','de 11']]
  .forEach(([tel, etiqueta]) => {
    const p = depurarEmpresa_(comoLoEnviaElFormulario({...escrito, contacto: tel}));
    console.log('  ' + etiqueta.padEnd(16) + '→ ' + (p.ok ? 'acepta   ' + p.datos.telefono : 'rechaza'));
  });

console.log('\nDV de 848848338 = ' + calcularDV_('848848338') + '  (el formulario mostró 0)');
