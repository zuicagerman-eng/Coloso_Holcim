/**
 * Configuración del registro de Empresas y Personas — Holcim.
 * Es el único archivo que se edita en el día a día.
 */
var CONFIG = {

  /** Los correos que reciben el aviso cada vez que alguien diligencia. */
  NOTIFICAR_A: [
    'area1.holcim@example.com',
    'area2.holcim@example.com'
  ],

  /** Copia oculta opcional (auditoría). */
  CON_COPIA_OCULTA: [],

  /** Acuse de recibo a quien diligenció el formulario. */
  ACUSE_A_QUIEN_DILIGENCIA: false,

  NOMBRE_REMITENTE: 'Registros Holcim',

  /** Restringe los formularios a cuentas del dominio y guarda quién responde. */
  SOLO_DOMINIO_HOLCIM: true,

  FORMULARIOS: {
    EMPRESA: {
      titulo: 'Registro de Empresa — Holcim',
      descripcion: 'Diligencie los datos de la empresa. El NIT se registra SIN dígito de verificación.',
      hoja: 'EMPRESAS'
    },
    PERSONA: {
      titulo: 'Registro de Personas — Holcim',
      descripcion: 'Diligencie los datos de la persona y seleccione la empresa a la que pertenece.',
      hoja: 'PERSONAS'
    }
  },

  /** Textos de las preguntas. Cambiarlos aquí exige volver a ejecutar instalar(). */
  PREGUNTAS: {
    NIT: 'NIT (sin dígito de verificación)',
    NOMBRE_EMPRESA: 'Nombre de la empresa',
    CORREO_EMPRESA: 'Correo de la empresa',
    CONTACTO: 'Contacto (nombre y teléfono)',
    NOMBRES: 'Nombres',
    APELLIDOS: 'Apellidos',
    CEDULA: 'Cédula',
    CORREO_PERSONA: 'Correo de la persona',
    EMPRESA: 'Empresa a la que pertenece'
  }
};
