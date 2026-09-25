/* Comprueba atender() en los dos modos de publicación. */
const fs=require('fs');
let sesion = '';
let recibido = null;
const Session = { getActiveUser: () => ({ getEmail: () => sesion }) };
const CONFIG = { URL_SERVICIO: 'https://ejemplo/exec', TOKEN: '' };
const UrlFetchApp = { fetch: (url, op) => { recibido = JSON.parse(op.payload);
  return { getResponseCode: () => 200, getContentText: () => '{"ok":true,"id":"EMP-2026-0011"}' }; } };
const HtmlService = { createHtmlOutputFromFile: () => ({ setTitle(){return this;}, addMetaTag(){return this;} }) };
const console_ = console;
eval(fs.readFileSync('/home/user/Coloso_Holcim/apps-script/formulario/Codigo.gs','utf8'));

for (const [modo, cuenta] of [['CON cuenta de Google','maria@gmail.com'], ['SIN cuenta (abierto)','']]) {
  sesion = cuenta; recibido = null;
  const r = atender({ accion:'registrarEmpresa', datos:{ tipoSolicitud:'Solicitud de creación', nit:'900617448' } });
  console.log(modo);
  console.log('  respuesta:  ' + JSON.stringify(r));
  console.log('  se registró: ' + JSON.stringify(recibido && recibido.datos));
  console.log('');
}
