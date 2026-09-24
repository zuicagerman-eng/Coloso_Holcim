/**
 * Configuración del FORMULARIO (servicio de cara al proveedor).
 *
 * Este servicio solo hace dos cosas: entregar la página y averiguar con
 * qué cuenta de Google entró la persona. No toca la hoja de cálculo ni
 * envía correos: de eso se encarga el servicio REGISTRO, al que le pasa
 * los datos. Por eso los permisos que se le piden al proveedor son
 * mínimos: ver su correo y conectarse a un servicio externo.
 */
var CONFIG = {

  /**
   * ► DIRECCIÓN DEL SERVICIO DE REGISTRO ◄
   * Es la URL que termina en /exec del OTRO proyecto (el que está ligado
   * a la hoja de cálculo), publicado con "Ejecutar como: Yo" y acceso
   * "Cualquier usuario".
   */
  URL_SERVICIO: '',

  /**
   * ► CLAVE COMPARTIDA ◄
   * Debe ser idéntica a la de Config.gs del servicio de registro. Es lo
   * que evita que alguien que descubra aquella URL escriba en la hoja
   * sin pasar por aquí.
   */
  TOKEN: 'CAMBIE-ESTA-CLAVE'
};
