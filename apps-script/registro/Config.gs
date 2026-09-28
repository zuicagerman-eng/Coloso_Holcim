/**
 * Configuración del registro de Empresas y Personas — Holcim.
 * Es el único archivo que se edita en el día a día.
 */
var CONFIG = {

  /**
   * ► VERSIÓN ◄
   * La imprime `diagnostico`. Si al ejecutarlo no sale esta misma fecha,
   * lo que está corriendo es la versión anterior: se guardó con Ctrl+S
   * pero faltó Administrar implementaciones → ✏️ → Versión: Nueva.
   */
  VERSION: '2026-09-28 · 8',

  /**
   * ► CORREOS QUE RECIBEN EL AVISO ◄
   * Cada vez que alguien registre una empresa o una persona, llega un
   * correo a estas direcciones diciendo quién lo hizo y qué registró.
   * Ponga uno o varios, separados por coma. Vacío = no se envía nada.
   */
  NOTIFICAR_A: [
    'german.zuica@holcim.com',
    'juan.narvaezsalazar@holcim.com'
  ],

  /**
   * ► REPORTES DE PROBLEMAS ◄
   * El botón "Reportar un problema" del formulario escribe solo aquí.
   * Es un asunto técnico, no un registro: no va a la lista de avisos.
   */
  CORREO_SOPORTE: 'german.zuica@holcim.com',

  /**
   * ► ACUSE PARA EL PROVEEDOR ◄
   * Al correo que la empresa escribió en el formulario le llega su propia
   * constancia: lo que registró y qué sigue. Es un correo aparte del aviso
   * interno —el del equipo lleva el enlace a la base de datos y ese no es
   * asunto del proveedor—. Ponga false para dejar de enviarlo.
   */
  ACUSE_AL_PROVEEDOR: true,

  /**
   * Qué sigue después de registrarse. Es el texto que el proveedor lee en
   * su constancia; cámbielo cuando cambie el trámite.
   */
  TEXTO_QUE_SIGUE: 'Su gestión de creación será procesada en un plazo de ' +
    'DOS DÍAS HÁBILES. Si todo está en orden, su empresa quedará creada en el ' +
    'sistema de proveedores de Holcim y le llegará, a este mismo correo, la ' +
    'invitación para la capacitación de proveedores.',

  /** Lo mismo, cuando lo que se pidió fue corregir una empresa ya registrada. */
  TEXTO_QUE_SIGUE_EDICION: 'Su solicitud de corrección será procesada en un ' +
    'plazo de DOS DÍAS HÁBILES. Actualizaremos los datos de su empresa en el ' +
    'sistema de proveedores de Holcim y, si hace falta algún soporte, le ' +
    'escribiremos a este mismo correo.',

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

  /**
   * ► ESTADO CON EL QUE NACE CADA SOLICITUD ◄
   * Se escribe en la columna "Estado de solicitud" de cada fila nueva.
   * Tiene que ser una de las opciones de esa lista en la hoja —hoy son
   * "Creada" y "En proceso"—, o la celda quedará marcada como inválida.
   * Vacío = la fila nace en blanco y alguien elige a mano.
   */
  ESTADO_INICIAL: 'En proceso',

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
    ERRORES: 'ERRORES',
    CORREOS: 'CORREOS'
  },

  ENCABEZADOS: {
    /* En el mismo orden que la tabla de Holcim. Las filas se escriben por
       NOMBRE de columna, así que este orden solo manda cuando la hoja se
       crea desde cero; en una hoja que ya existe, el que manda es el suyo.

       Las dos últimas las llena la hoja, no el formulario: "Plazo para
       creación" es una fórmula y "Estado de solicitud" una lista para
       elegir. Cada fila nueva las hereda de la fila de arriba.

       "Diligenciado por" ya no está: con el formulario abierto —sin cuenta
       de Google— siempre salía vacía. Si algún día se vuelve a pedir la
       cuenta, basta con agregar la columna a mano y se llena sola. */
    EMPRESAS: [
      'ID', 'Fecha', 'NIT', 'DV', 'Nombre empresa', 'Correo',
      'Tipo de solicitud', 'Plazo para creación', 'Estado de solicitud'
    ],
    PERSONAS: [
      'ID', 'Fecha', 'Nombres', 'Primer apellido', 'Segundo apellido',
      'Nombre completo', 'Cédula', 'Correo', 'NIT empresa', 'Nombre empresa'
    ],
    ERRORES: ['Fecha', 'Detalle'],
    CORREOS: ['Fecha', 'Radicado', 'Tipo', 'Para', 'Estado', 'Detalle']
  }
};
