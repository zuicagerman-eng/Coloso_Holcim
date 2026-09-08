/**
 * Configuración del registro de Empresas y Personas — Holcim.
 * Es el único archivo que se edita en el día a día.
 */
var CONFIG = {

  /**
   * Clave compartida entre el formulario y este servicio. Cambie este valor
   * por uno propio y ponga el mismo en vista/index.html (API.token).
   * No es una contraseña de usuario: solo evita que un tercero que descubra
   * la URL escriba en la hoja por accidente o por curiosidad.
   */
  TOKEN: 'CAMBIE-ESTA-CLAVE',

  /**
   * Correos que reciben aviso de cada registro.
   * Vacío = no se envía ningún correo (solo se guarda en la hoja).
   */
  NOTIFICAR_A: [],

  NOMBRE_REMITENTE: 'Registros Holcim',

  HOJAS: {
    EMPRESAS: 'EMPRESAS',
    PERSONAS: 'PERSONAS',
    ERRORES: 'ERRORES'
  },

  ENCABEZADOS: {
    EMPRESAS: [
      'ID', 'Fecha', 'NIT', 'DV', 'Nombre empresa', 'Correo', 'Teléfono',
      'Registrado por'
    ],
    PERSONAS: [
      'ID', 'Fecha', 'Nombres', 'Primer apellido', 'Segundo apellido',
      'Nombre completo', 'Cédula', 'Correo', 'NIT empresa', 'Nombre empresa',
      'Registrado por'
    ],
    ERRORES: ['Fecha', 'Detalle']
  }
};
