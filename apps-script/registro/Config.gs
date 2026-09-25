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
    'german.zuica@holcim.com'
  ],

  /** Copia oculta, si alguien más debe quedar enterado sin figurar. */
  CON_COPIA_OCULTA: [],

  /**
   * ► COPIA EN OTRA HOJA ◄
   *
   * DEJE ESTO VACÍO salvo que exista una SEGUNDA hoja, distinta de esta,
   * donde quiera una copia de cada registro.
   *
   * NO ponga aquí el identificador de la hoja donde vive este script: la
   * fila se escribiría dos veces, con el mismo radicado y el mismo
   * segundo. El código ya no lo permite, pero mejor ni intentarlo.
   *
   * Cuando sí haya otra hoja, pegue su identificador —el trozo que va
   * entre /d/ y /edit en su dirección— y compártala con permiso de
   * EDITOR con la cuenta que ejecuta este script.
   */
  ID_HOJA_HOLCIM: '',

  /** Nombre que aparece como remitente del aviso. */
  NOMBRE_REMITENTE: 'Registros Holcim',

  /**
   * Enlace que abre el botón del correo de aviso. Vacío = la dirección
   * de la hoja donde vive el script. Se llena para llevar a una pestaña
   * concreta, o a otra hoja.
   */
  URL_BASE_DATOS: 'https://docs.google.com/spreadsheets/d/1FGByxCw4R-D7_15Y1NjmrttilkQO-tF1AHYF0YgR-I4/edit?gid=388689330#gid=388689330',

  /** Opciones del primer campo del formulario. */
  TIPOS_DE_SOLICITUD: ['Solicitud de creación', 'Solicitud de edición'],

  /* ------------------------------------------------------------------
     De aquí para abajo no hay nada que ajustar en el uso normal.
     ------------------------------------------------------------------ */

  /**
   * Opcional. Vacío = no se pide clave, que es como está funcionando.
   * Si algún día quiere cerrar esta entrada, escriba aquí cualquier
   * texto y el mismo en el Config.gs del formulario.
   */
  TOKEN: '',

  HOJAS: {
    EMPRESAS: 'EMPRESAS',
    PERSONAS: 'PERSONAS',
    ERRORES: 'ERRORES'
  },

  ENCABEZADOS: {
    EMPRESAS: [
      'ID', 'Fecha', 'Tipo de solicitud', 'NIT', 'DV', 'Nombre empresa',
      'Correo', 'Diligenciado por'
    ],
    PERSONAS: [
      'ID', 'Fecha', 'Nombres', 'Primer apellido', 'Segundo apellido',
      'Nombre completo', 'Cédula', 'Correo', 'NIT empresa', 'Nombre empresa'
    ],
    ERRORES: ['Fecha', 'Detalle']
  }
};
