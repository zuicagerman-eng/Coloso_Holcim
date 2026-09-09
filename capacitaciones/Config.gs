/**
 * Lo único que se edita del entorno de capacitaciones.
 */
var CONFIG = {

  TITULO: 'Capacitaciones — Holcim',

  /**
   * ► EL LIBRO ◄
   * Identificador de la hoja de cálculo que hace de base de datos, que sale
   * de su dirección:
   *
   *   docs.google.com/spreadsheets/d/[ESTO ES EL IDENTIFICADOR]/edit
   *
   * Créela en la unidad compartida del área, con la cuenta de Holcim.
   * Vacío = usa la hoja a la que esté ligado el script, si lo está.
   */
  ID_LIBRO: '',

  /**
   * ► CLAVES DE ACCESO ◄
   * Vacío = no se pide clave. Correcto si la aplicación se publicó
   * restringida a "Cualquier usuario de Holcim": ahí verifica Google.
   *
   * Con claves, nada se entrega hasta que se escriba una válida. Es lo que
   * deja entrar a contratistas y personal nuevo, que no tienen cuenta.
   * Una por convocatoria o por empresa. `nuevaClave` arma una.
   */
  CLAVES: {
    // 'HOLCIM-2026-CONTRATISTAS': 'Contratistas planta A',
  },

  /** Tamaño máximo de un PDF servido por el script, en megabytes. */
  MAXIMO_PDF_MB: 10
};
