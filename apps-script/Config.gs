/**
 * Configuración central del registro de Empresas y Personas — Holcim.
 * Todo lo que cambia entre ambientes (correos, IDs, textos) vive aquí.
 */
var CONFIG = {
  /** ID del Google Sheet. Vacío = usa la hoja contenedora del script. */
  SPREADSHEET_ID: '',

  /** Los dos correos que se notifican en cada registro nuevo. */
  NOTIFICAR_A: [
    'area1.holcim@example.com',
    'area2.holcim@example.com'
  ],

  /** Copia oculta opcional (auditoría). */
  CON_COPIA_OCULTA: [],

  /** Se avisa también a la empresa/persona registrada. */
  ACUSE_AL_REGISTRADO: true,

  NOMBRE_APP: 'Registro de Empresas y Personas',
  NOMBRE_REMITENTE: 'Registros Holcim',

  /** Áreas que pueden diligenciar la información complementaria. */
  AREAS: ['Compras', 'HSE / SSTA', 'Legal', 'Contabilidad', 'Seguridad Física'],

  HOJAS: {
    EMPRESAS: 'EMPRESAS',
    PERSONAS: 'PERSONAS',
    COMPLEMENTOS: 'COMPLEMENTOS',
    LOG: 'LOG'
  },

  ENCABEZADOS: {
    EMPRESAS: [
      'ID', 'Fecha registro', 'NIT (sin DV)', 'DV calculado', 'Nombre empresa',
      'Correo', 'Contacto', 'Estado', 'Registrado por', 'Token'
    ],
    PERSONAS: [
      'ID', 'Fecha registro', 'Nombres', 'Apellidos', 'Cédula', 'Correo',
      'NIT empresa', 'Nombre empresa', 'Estado', 'Registrado por', 'Token'
    ],
    COMPLEMENTOS: [
      'Fecha', 'Tipo registro', 'ID registro', 'Área', 'Diligenciado por',
      'Responsable asignado', 'Observaciones', 'Resultado'
    ],
    LOG: ['Fecha', 'Nivel', 'Origen', 'Detalle']
  },

  ESTADOS: {
    NUEVO: 'Pendiente por áreas',
    EN_PROCESO: 'En diligenciamiento',
    COMPLETO: 'Completo'
  }
};

/** URL pública de la Web App (se resuelve en tiempo de ejecución). */
function urlWebApp_() {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (e) {
    return '';
  }
}
