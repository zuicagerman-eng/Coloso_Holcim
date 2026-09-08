/**
 * Configuración del registro de Empresas y Personas — Holcim.
 * Es el único archivo que se edita en el día a día.
 */
var CONFIG = {

  /**
   * ► CORREOS QUE RECIBEN EL AVISO ◄
   * Cada vez que alguien registre una empresa o una persona, llega un
   * correo a estas direcciones diciendo quién lo hizo y qué registró.
   * Ponga uno o varios, separados por coma. Vacío = no se envía nada.
   */
  NOTIFICAR_A: [
    'su.correo@holcim.com'
  ],

  /** Copia oculta, si alguien más debe quedar enterado sin figurar. */
  CON_COPIA_OCULTA: [],

  /**
   * ► COPIA EN UNA HOJA DE HOLCIM ◄
   * Cada registro se guarda dos veces: en esta hoja y en la de Holcim.
   * Pegue aquí el identificador de esa hoja, que sale de su dirección:
   *
   *   docs.google.com/spreadsheets/d/[ESTO ES EL IDENTIFICADOR]/edit
   *
   * Requisito: esa hoja debe estar compartida CON PERMISO DE EDICIÓN con
   * la cuenta que ejecuta este script. Vacío = no se copia nada.
   */
  ID_HOJA_HOLCIM: '',

  /** Nombre que aparece como remitente del aviso. */
  NOMBRE_REMITENTE: 'Registros Holcim',

  /* ------------------------------------------------------------------
     De aquí para abajo no hay nada que ajustar en el uso normal.
     ------------------------------------------------------------------ */

  /**
   * Solo aplica si algún día se sirve el formulario POR FUERA de Google,
   * como archivo suelto. En el montaje actual la página la entrega la
   * propia aplicación web, así que esto no se usa. Déjelo como está.
   */
  TOKEN: 'CAMBIE-ESTA-CLAVE',

  HOJAS: {
    EMPRESAS: 'EMPRESAS',
    PERSONAS: 'PERSONAS',
    ERRORES: 'ERRORES'
  },

  ENCABEZADOS: {
    EMPRESAS: [
      'ID', 'Fecha', 'NIT', 'DV', 'Nombre empresa', 'Correo', 'Teléfono'
    ],
    PERSONAS: [
      'ID', 'Fecha', 'Nombres', 'Primer apellido', 'Segundo apellido',
      'Nombre completo', 'Cédula', 'Correo', 'NIT empresa', 'Nombre empresa'
    ],
    ERRORES: ['Fecha', 'Detalle']
  }
};
