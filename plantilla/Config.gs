/**
 * Lo único que se edita de esta plantilla.
 * El resto —Publicar.gs, puerta.html— no se toca.
 */
var CONFIG = {

  /** Sale en la pestaña del navegador y en la pantalla de la clave. */
  TITULO: 'Reinducción — Holcim',

  /**
   * ► CLAVES DE ACCESO ◄
   * Lista vacía = no se pide clave. Es lo correcto si la aplicación se
   * publicó restringida a "Cualquier usuario de Holcim" (nivel N0): ahí
   * quien verifica es Google, y pedir clave además sería estorbar.
   *
   * Con una o más claves, la página NO se entrega hasta que se escriba
   * una válida. Se usa cuando quien tiene que verla no tiene cuenta de
   * Holcim: contratistas, personal nuevo, aprendices, terceros.
   *
   *   'LA-CLAVE': 'a quién se le entregó'
   *
   * Una por grupo o por convocatoria, no una sola para todos: así se
   * retira la de uno sin dejar por fuera a los demás. Para armar una,
   * ejecute `nuevaClave` desde el editor.
   */
  CLAVES: {
    // 'HOLCIM-2026-PLANTA-A': 'Contratistas planta A',
    // 'HOLCIM-2026-NUEVOS':   'Ingreso de personal, marzo',
  },

  /**
   * ► REGISTRO DE QUIÉN ABRIÓ ◄  (opcional)
   * Identificador de una hoja de cálculo de Holcim donde anotar cada
   * apertura: fecha, correo de quien entró —si tiene sesión de Holcim— y
   * con qué clave. Para una reinducción es la constancia de quién la vio.
   *
   *   docs.google.com/spreadsheets/d/[ESTO ES EL IDENTIFICADOR]/edit
   *
   * Esa hoja debe estar compartida COMO EDITOR con la cuenta que ejecuta
   * el script. Vacío = no se anota nada.
   */
  REGISTRAR_EN: ''
};
