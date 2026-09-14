/**
 * Reporte de vencimientos por planta, publicado como aplicación web.
 *
 * Cada planta recibe un enlace propio. Al abrirlo, el navegador muestra el
 * tablero con los datos de esa planta y de ninguna otra: el filtrado ocurre
 * aquí, en el servidor, así que el HTML que llega al navegador no contiene
 * información de las demás plantas.
 *
 * Este archivo SOLO LEE la matriz. No escribe, no borra y no modifica nada.
 *
 * Puesta en marcha: ver LEEME.md
 */

// ════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════

/** Mientras esté en false, enviarEnlacesSemanales() no manda ningún correo. */
const ENVIAR_CORREOS = false;

/** Destinatarios por planta. La llave es el nombre EXACTO de la división. */
const CORREOS_PLANTA = {
  "AF-NOBSA":           "carlos.vargash@holcim.com, maria.diazp@holcim.com, leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "AF-TELEPORT":        "juan.narvaezsalazar@holcim.com, german.zuica@holcim.com",
  "CJ-NOBSA":           "leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "HC-BARRANCABERMEJA": "leidys.blanco@holcim.com, german.zuica@holcim.com",
  "HC-BELLO":           "mayra.ramirez@holcim.com, wilson.toledo@holcim.com, edwin.yepes@holcim.com, leidy.perez2@holcim.com, juan.sanchez6@holcim.com, german.zuica@holcim.com",
  "HC-CALI":            "mayra.ramirez@holcim.com, german.zuica@holcim.com",
  "HC-CHIA":            "w.otalora@holcim.com, sara.garzon.ext@holcim.com, german.zuica@holcim.com",
  "HC-MEDELLIN":        "wilson.toledo@holcim.com, german.zuica@holcim.com",
  "HC-MONDOÑEDO":       "paula.catano@holcim.com, marisol.miranda@holcim.com, german.zuica@holcim.com",
  "HC-NOBSA CEMENTO":   "leidy.rodriguez@holcim.com, carlos.vargash@holcim.com, maria.diazp@holcim.com, german.zuica@holcim.com",
  "HC-NOBSA CONCRETO":  "leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "HC-PALMIRA":         "mayra.ramirez@holcim.com, german.zuica@holcim.com",
  "HC-PUENTE ARANDA":   "german.zuica@holcim.com, wilson.toledo@holcim.com, edwin.nastacuas@holcim.com, yineth.barrera@holcim.com",
  "HC-SIBATE":          "edwin.nastacuas@holcim.com, wilson.toledo@holcim.com, miller.mahecharueda@holcim.com, german.zuica@holcim.com",
  "HC-TELEPORT":        "juan.narvaezsalazar@holcim.com, german.zuica@holcim.com",
  "HC-TQC":             "lizeth.novoa@holcim.com, german.zuica@holcim.com"
};

/**
 * Logotipo. Suba el archivo a su Drive y pegue aquí su ID: es el trozo de la
 * URL entre /d/ y /view.
 *
 *   https://drive.google.com/file/d/AQUI_VA_EL_ID/view
 *
 * Debe ser SOLO EL SÍMBOLO (el cuadrado con la H), no el logotipo completo:
 * al lado va la palabra HOLCIM en texto blanco, que sobre el encabezado oscuro
 * se lee y la versión azul del logotipo no.
 *
 * Mientras esté vacío se usa el dibujo que ya trae el HTML.
 */
const ID_LOGO = "1T-gc0mAXvHnSUZxUxayVzA-tQxhQ96bN";

/**
 * Cuánto del ancho del logotipo se muestra, en píxeles.
 *
 * Sirve para subir el logotipo COMPLETO y que el reporte enseñe solo el
 * símbolo: la palabra HOLCIM queda recortada, y al lado va la versión en texto
 * blanco, que sobre el encabezado oscuro sí se lee.
 *
 *   26  el símbolo solo, que es casi cuadrado (súbalo completo)
 *    0  el logotipo entero, sin recortar (si ya subió solo el símbolo)
 *
 * Si queda cortado de más o de menos, mueva este número y vuelva a mirar.
 */
const LOGO_ANCHO_PX = 26;

/**
 * A quién NO se saluda en el mensaje de bienvenida, aunque reciba el correo.
 * Va el texto anterior a la arroba.
 */
const NOMBRES_SIN_SALUDO = ["german.zuica"];

/**
 * El nombre se deduce del correo: lo que va antes del primer punto.
 * Aquí se corrigen los que no salen bien — tildes, iniciales, apodos.
 */
const NOMBRES_ESPECIALES = {
  "maria.diazp": "María",
  "w.otalora":   "Otálora"
};

/**
 * A dónde llegan las solicitudes de capacitación que se piden desde el reporte.
 * Mientras diga CAMBIAR no se envía nada y el botón avisa.
 */
const CORREO_SOLICITUDES = "CAMBIAR@holcim.com";

/**
 * Qué capacitaciones se pueden solicitar desde el reporte.
 *
 * "alto_riesgo" son alturas, izajes, espacios confinados y conducción
 * defensiva. Añada "normativa" si también quiere las legales (LOTO, SGSST,
 * permisos, brigada, trabajo en caliente), o "interna" para todas.
 */
const GRUPOS_CON_SOLICITUD = ["alto_riesgo"];

/**
 * Capacitaciones que la persona puede hacer por su cuenta, en línea.
 *
 * En estas no hay jornada que programar: en la fila aparece un botón que lleva
 * directo al curso, y si además se solicitan, el enlace viaja en el correo.
 *
 * Por curso se indica:
 *   url          a dónde lleva. Sin url el enlace no aparece.
 *   texto        lo que dice el botón.
 *   desdeDias    solo se ofrece si lleva vencida al menos estos días.
 *   hastaDias    solo se ofrece si lleva vencida como mucho estos días.
 *
 * Los dos límites son opcionales y se cuentan en días vencida: 180 son seis
 * meses. Quien nunca la ha hecho ("Sin realizar") cuenta como vencida hace
 * mucho, así que entra en cualquier tramo que empiece en desdeDias.
 *
 * El nombre del curso debe ser el de la matriz, aunque no importan mayúsculas
 * ni espacios de sobra.
 */
const CURSOS_CON_ENLACE = {
  "(Re) Inducción General H&S": {
    url:   "",                  // <-- PENDIENTE: el enlace del curso
    texto: "Hacer ahora"
    // desdeDias: 180,          // descomentar para ofrecerlo solo pasados 6 meses
    // hastaDias: 180           // o al revés: solo dentro de los 6 primeros meses
  }
};

/** El enlace de un curso, si aplica a ese estado. Devuelve "" si no aplica. */
function enlaceDeCurso(curso, diasVencida) {
  const buscado = normalizar(curso);
  for (const clave in CURSOS_CON_ENLACE) {
    if (normalizar(clave) !== buscado) continue;

    const cfg = CURSOS_CON_ENLACE[clave];
    if (!cfg || !cfg.url) return "";
    if (cfg.desdeDias != null && diasVencida < cfg.desdeDias) return "";
    if (cfg.hastaDias != null && diasVencida > cfg.hastaDias) return "";
    return cfg.url;
  }
  return "";
}

/**
 * Qué entra en la tabla del correo semanal.
 *
 * El correo no repite el reporte: destaca lo que exige acción y deja el resto
 * a un clic. Por eso la tabla se limita a las capacitaciones de riesgo y de
 * ley, en la franja de tiempo donde todavía se puede hacer algo.
 */
const CORREO_TABLA = {
  grupos:        ["alto_riesgo", "normativa"],  // el resto se menciona, no se lista
  vencidasDesde: 30,   // vencidas de los últimos 30 días (más atrás ya no es novedad)
  proximosHasta: 60,   // y lo que vence en los próximos 60
  maxFilas:      80    // si son más, se indica cuántas quedan por ver en el reporte
};

/**
 * Cuánto se guarda en caché lo leído de la matriz.
 *
 * Más minutos = abre más rápido, pero una corrección en la matriz tarda más en
 * verse. limpiarCache() lo fuerza cuando hace falta verlo ya.
 */
const CACHE_MINUTOS = 15;

/** Tope de personas por solicitud, para que un envío no se desborde. */
const MAX_POR_SOLICITUD = 60;

/** Geometría de la matriz. Coincide con lo que ya usa el correo actual. */
const CFG = {
  HOJA_MATRIZ:         "Matriz de Capacitaciones H&S",
  FILA_CURSOS:         6,    // fila con el nombre de cada curso
  FILA_TITULOS:        7,    // fila con Aplicabilidad · Fecha de vencimiento · Soporte
  PRIMERA_FILA_DATOS:  8,
  PRIMERA_COL_CURSO:   10,   // columna J
  CURSOS_ESPERADOS:    62,   // solo para avisar si el número cambia
  VENTANA_DIAS:        60,   // hasta dónde mirar hacia adelante
  ZONA:                "GMT-5"
};

/**
 * Incluir a quien nunca ha hecho el curso (la celda dice PENDIENTE en vez de
 * traer fecha). Van al final de la lista, en gris, con su propia sección.
 */
const INCLUIR_PENDIENTES = true;

/**
 * Los pendientes no tienen fecha, pero el tablero ordena y agrupa por días.
 * Este número los deja siempre de últimos sin alterar ningún conteo: queda
 * fuera de "vence en 7 días", de "en 30" y de "ya vencida".
 */
const DIAS_PENDIENTE = 99999;

/** Cursos que no entran al reporte. Se comparan normalizados, sin espacios. */
const CURSOS_OMITIR = [
  "Operador de equipos para elevación de personas (manlift)",
  "Polipasto < 5 Toneladas",
  "Aparejador/señalero",
  "Puente grua / Polipasto"
];

/**
 * Categoría y grupo de cada curso.
 * Tomado del HTML original para conservar exactamente su clasificación.
 * Un curso que no esté aquí cae en "Interna / formación" y se reporta en probar().
 */
const CATEGORIA_CURSO = {
  "(Re) Inducción General H&S":                                                              ["Interna / formación",       "interna"],
  "Aislamiento y Bloqueo de Energía para todos":                                             ["Energías peligrosas (LOTO)", "normativa"],
  "Bienestar y Limpieza":                                                                    ["Interna / formación",       "interna"],
  "Curso 50 horas o actualización 20 horas SGSST":                                           ["SGSST",                     "normativa"],
  "Emisor de Permiso":                                                                       ["Permisos de trabajo",       "normativa"],
  "Manejo Defensivo NSC Edicion 5":                                                          ["Conducción defensiva",      "alto_riesgo"],
  "Manejo de cargas e Higiene Postural":                                                     ["Interna / formación",       "interna"],
  "Operador de equipos para elevación de personas (manlift)":                                ["Izajes",                    "alto_riesgo"],
  "Prevencion y control de los riesgos derivados del uso de la silice cristalina respirable": ["Interna / formación",      "interna"],
  "Prevención de lesiones o DME - Reporte temprano de síntomas":                             ["Interna / formación",       "interna"],
  "Programa de evaluación y control de vibraciones":                                         ["Interna / formación",       "interna"],
  "Reentrenamiento Brigadista Clase I Resolución 0256":                                      ["Brigada de emergencia",     "normativa"],
  "Reentrenamiento Trabajo en alturas":                                                      ["Alturas",                   "alto_riesgo"],
  "Sistema globalmente armonizado":                                                          ["Interna / formación",       "interna"],
  "Supervisor de izaje":                                                                     ["Izajes",                    "alto_riesgo"],
  "Titular de candado":                                                                      ["Energías peligrosas (LOTO)", "normativa"],
  "Trabajador autorizado de trabajo en caliente":                                            ["Trabajo en caliente",       "normativa"],
  "Trabajo seguro con computador":                                                           ["Interna / formación",       "interna"],

  // ─── Cursos que no aparecían en el HTML original ────────────────────────
  // La clasificación de estos la propuse yo siguiendo el mismo criterio.
  // Revíselos y corrija los que no correspondan.
  "Emisor de Permiso de Trabajo en Caliente":                                                ["Trabajo en caliente",       "normativa"],
  "Centinela de Fuego para trabajos en caliente":                                            ["Trabajo en caliente",       "normativa"],
  "Entrenamiento Brigadista Clase I Resolución 0256":                                        ["Brigada de emergencia",     "normativa"],
  "Uso DEA / Soporte Vital Básico":                                                          ["Brigada de emergencia",     "normativa"],
  "Reglas basicas y habitos seguros de conduccion en vias internas":                         ["Conducción defensiva",      "alto_riesgo"],
  "Montaje y Desmontaje de Andamios":                                                        ["Alturas",                   "alto_riesgo"],
  "Trabajador autorizado / Ayudante de seguridad Trabajo en alturas":                        ["Alturas",                   "alto_riesgo"],
  "Trabajo cerca al agua":                                                                   ["Alturas",                   "alto_riesgo"],
  "Trabajador Entrante en espacios confinados":                                              ["Espacios confinados",       "alto_riesgo"],
  "Vigía de Seguridad para Trabajos en Espacios Confinados":                                 ["Espacios confinados",       "alto_riesgo"],
  "Supervisor / Emisor de permisos de espacios confinados (debe contar previamente con curso de entrante y vigía de EC)": ["Espacios confinados", "alto_riesgo"]
};

const CATEGORIA_POR_DEFECTO = ["Interna / formación", "interna"];


// ════════════════════════════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════════════════════════════

/**
 * Texto comparable: sin espacio duro, sin espacios de sobra, en mayúscula.
 * El espacio duro ( ) viene de Sheets y rompe las comparaciones sin que se vea.
 */
function normalizar(valor) {
  return String(valor == null ? "" : valor)
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Los nombres de curso en la fila 6 traen espacios al inicio; hay que limpiarlos. */
function limpiarCurso(valor) {
  return String(valor == null ? "" : valor).replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

function urgenciaPorDias(dias) {
  if (dias < 0)   return "vencida";
  if (dias <= 7)  return "critica";
  if (dias <= 15) return "alta";
  if (dias <= 30) return "media";
  return "baja";
}

function categoriaDe(curso) {
  if (Object.prototype.hasOwnProperty.call(CATEGORIA_CURSO, curso)) return CATEGORIA_CURSO[curso];
  // Segundo intento, ignorando mayúsculas y espacios
  const buscado = normalizar(curso);
  for (const clave in CATEGORIA_CURSO) {
    if (normalizar(clave) === buscado) return CATEGORIA_CURSO[clave];
  }
  return null;
}

/** Índice de plantas válidas, ya normalizadas, para resolver el nombre que llega. */
function indicePlantas() {
  const indice = {};
  for (const planta in CORREOS_PLANTA) indice[normalizar(planta)] = planta;
  return indice;
}


// ════════════════════════════════════════════════════════════════════
//  LECTURA DE LA MATRIZ
// ════════════════════════════════════════════════════════════════════

/**
 * Ubica el bloque de columnas de cada curso.
 *
 * Los cursos NO se cuentan de tres en tres: se recorre la fila de nombres y,
 * dentro del tramo de cada curso, se busca su columna de fecha por el título.
 * Contar posiciones fijas parecía funcionar, pero dos de los 62 cursos no caían
 * donde les tocaba y sus fechas se leían del bloque vecino.
 *
 * Devuelve [{curso, fecha, ancho}, ...] solo con los bloques que tienen fecha.
 */
function detectarBloques(nombres, titulos) {
  const inicios = [];
  for (let i = 0; i < nombres.length; i++) {
    if (limpiarCurso(nombres[i])) inicios.push(i);
  }

  const bloques = [];
  for (let n = 0; n < inicios.length; n++) {
    const ini = inicios[n];
    const fin = (n + 1 < inicios.length) ? inicios[n + 1] : titulos.length;

    let iFecha = -1;
    for (let j = ini; j < fin; j++) {
      if (normalizar(titulos[j]).indexOf("FECHA") !== -1) { iFecha = j; break; }
    }
    // Un tramo sin columna de fecha no es un curso (suele ser un rótulo suelto)
    if (iFecha === -1) continue;

    bloques.push({ curso: limpiarCurso(nombres[ini]), fecha: iFecha, ancho: fin - ini });
  }
  return bloques;
}

/**
 * Recorre la matriz y devuelve un registro por cada vencimiento dentro de la
 * ventana.
 *
 * Devuelve { registros, avisos }.
 */
function construirRegistros() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.HOJA_MATRIZ);
  if (!hoja) throw new Error("No existe la hoja '" + CFG.HOJA_MATRIZ + "'.");

  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < CFG.PRIMERA_FILA_DATOS) {
    throw new Error("La matriz no tiene datos debajo de la fila " + CFG.PRIMERA_FILA_DATOS + ".");
  }

  const filas       = ultimaFila - CFG.PRIMERA_FILA_DATOS + 1;
  const anchoCursos = hoja.getLastColumn() - CFG.PRIMERA_COL_CURSO + 1;

  const nombresCurso = hoja.getRange(CFG.FILA_CURSOS,  CFG.PRIMERA_COL_CURSO, 1, anchoCursos).getValues()[0];
  const titulosCurso = hoja.getRange(CFG.FILA_TITULOS, CFG.PRIMERA_COL_CURSO, 1, anchoCursos).getValues()[0];
  const personas     = hoja.getRange(CFG.PRIMERA_FILA_DATOS, 1, filas, 7).getValues();
  const vencimientos = hoja.getRange(CFG.PRIMERA_FILA_DATOS, CFG.PRIMERA_COL_CURSO, filas, anchoCursos).getValues();

  const bloques = detectarBloques(nombresCurso, titulosCurso);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const plantas   = indicePlantas();
  const omitir    = CURSOS_OMITIR.map(normalizar);
  const registros = [];
  const avisos    = {
    personasActivas:   0,
    plantasSinCorreo:  {},
    cursosSinCategoria: {},
    cursosDetectados:  bloques.length,
    anchosDeBloque:    {}
  };
  bloques.forEach(function (b) {
    avisos.anchosDeBloque[b.ancho] = (avisos.anchosDeBloque[b.ancho] || 0) + 1;
  });

  for (let f = 0; f < personas.length; f++) {
    const fila    = personas[f];
    const estado  = normalizar(fila[0]);                 // A · STATUS DEL PERSONAL
    const cedula  = fila[3];                             // D · ID
    const plantaB = String(fila[4] == null ? "" : fila[4]).trim();  // E · DIVISIÓN
    const nombre  = fila[5];                             // F · NOMBRE
    const cargo   = fila[6];                             // G · POSICIÓN

    if (estado !== "ACTIVO" || !plantaB || !nombre) continue;
    avisos.personasActivas++;

    const planta = plantas[normalizar(plantaB)];
    if (!planta) {                                       // división sin correo configurado
      avisos.plantasSinCorreo[plantaB] = (avisos.plantasSinCorreo[plantaB] || 0) + 1;
      continue;
    }

    const celdas = vencimientos[f];

    for (let b = 0; b < bloques.length; b++) {
      const curso = bloques[b].curso;
      if (omitir.indexOf(normalizar(curso)) !== -1) continue;

      const valor = celdas[bloques[b].fecha];

      let fecha = null, dias = DIAS_PENDIENTE, urg = "pendiente";

      if (valor instanceof Date && !isNaN(valor)) {
        const vence = new Date(valor);
        vence.setHours(0, 0, 0, 0);
        dias = Math.round((vence - hoy) / 86400000);
        if (dias > CFG.VENTANA_DIAS) continue;      // vence más allá de la ventana
        fecha = Utilities.formatDate(vence, CFG.ZONA, "yyyy-MM-dd");
        urg = urgenciaPorDias(dias);
      } else {
        // Sin fecha. Solo entra si la celda dice PENDIENTE: ahí sí es alguien
        // que nunca ha hecho el curso. "NO APLICA" o "EXCEPTUADO" no cuentan.
        if (!INCLUIR_PENDIENTES) continue;
        if (normalizar(valor) !== "PENDIENTE") continue;
      }

      let categoria = categoriaDe(curso);
      if (!categoria) {
        avisos.cursosSinCategoria[curso] = (avisos.cursosSinCategoria[curso] || 0) + 1;
        categoria = CATEGORIA_POR_DEFECTO;
      }

      // Días que lleva vencida; quien nunca la hizo cuenta como vencida hace mucho
      const diasVencida = (urg === "pendiente") ? DIAS_PENDIENTE : -dias;

      registros.push({
        enlace: enlaceDeCurso(curso, diasVencida),
        planta: planta,
        nombre: String(nombre).trim(),
        id:     String(cedula == null ? "" : cedula).trim(),
        pos:    String(cargo == null ? "" : cargo).trim(),
        curso:  curso,
        cat:    categoria[0],
        grupo:  categoria[1],
        fecha:  fecha,
        dias:   dias,
        urg:    urg
      });
    }
  }

  return { registros: registros, avisos: avisos };
}


// ════════════════════════════════════════════════════════════════════
//  APLICACIÓN WEB
// ════════════════════════════════════════════════════════════════════

/**
 * Punto de entrada del enlace: .../exec?planta=HC-BELLO
 *
 * Solo viajan al navegador los registros de esa planta.
 */
function doGet(e) {
  const pedida = (e && e.parameter && e.parameter.planta) || "";
  const planta = indicePlantas()[normalizar(pedida)];

  if (!planta) {
    return paginaSimple(
      "Enlace incompleto",
      pedida
        ? "No reconozco la planta &laquo;" + pedida.replace(/[<>&]/g, "") + "&raquo;."
        : "Al enlace le falta la planta.",
      "Use el enlace que llega en el correo semanal, sin recortarlo."
    );
  }

  let registros;
  try {
    registros = registrosDePlanta(planta);
  } catch (err) {
    return paginaSimple("No se pudo generar el reporte", String(err.message || err),
                        "Avise a Seguridad y Salud para revisarlo.");
  }

  const plantilla = HtmlService.createTemplateFromFile("reporte");
  plantilla.datosJson     = JSON.stringify(registros);
  plantilla.corteTxt      = Utilities.formatDate(new Date(), CFG.ZONA, "d MMM yyyy · HH:mm");
  plantilla.corteIso      = Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd");
  plantilla.logo          = logoIncrustado();
  plantilla.logoAncho     = LOGO_ANCHO_PX;
  plantilla.saludoJson    = JSON.stringify({ nombres: saludoDePlanta(planta), planta: planta });
  plantilla.gruposSolicitud = JSON.stringify(GRUPOS_CON_SOLICITUD);
  plantilla.plantaInicial = planta;

  return plantilla.evaluate()
    .setTitle("Vencimientos de Capacitaciones · " + planta)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Caché por trozos.
 *
 * Cada entrada admite como mucho 100 KB, y los registros de una planta grande
 * pasan de eso con holgura. Guardarlos de una pieza no fallaba: simplemente no
 * se guardaban, y esas plantas releían la matriz entera en cada visita. Aquí se
 * parten y se vuelven a unir al leer.
 */
const CACHE_TROZO = 90000;
const CACHE_MAX_TROZOS = 40;

function claveDeCache(planta) {
  return "rep_v2_" + Utilities.base64EncodeWebSafe(planta);
}

function cacheGuardar(clave, texto) {
  const trozos = [];
  for (let i = 0; i < texto.length; i += CACHE_TROZO) {
    trozos.push(texto.slice(i, i + CACHE_TROZO));
  }
  if (!trozos.length || trozos.length > CACHE_MAX_TROZOS) return false;

  const mapa = {};
  mapa[clave + "_n"] = String(trozos.length);
  trozos.forEach(function (t, i) { mapa[clave + "_" + i] = t; });

  try {
    CacheService.getScriptCache().putAll(mapa, CACHE_MINUTOS * 60);
    return true;
  } catch (err) {
    return false;
  }
}

function cacheLeer(clave) {
  const cache = CacheService.getScriptCache();
  const n = parseInt(cache.get(clave + "_n"), 10);
  if (!n) return null;

  const claves = [];
  for (let i = 0; i < n; i++) claves.push(clave + "_" + i);
  const partes = cache.getAll(claves);

  let texto = "";
  for (let i = 0; i < n; i++) {
    const t = partes[clave + "_" + i];
    if (t == null) return null;      // expiró un trozo: se recalcula entero
    texto += t;
  }
  return texto;
}

/**
 * Registros de una planta.
 *
 * Cuando hay que releer, se recorre la matriz UNA vez y se guardan las
 * dieciséis plantas de golpe. Antes cada planta pagaba su propia lectura
 * completa, así que la misma matriz se leía dieciséis veces por ciclo.
 */
function registrosDePlanta(planta) {
  const guardado = cacheLeer(claveDeCache(planta));
  if (guardado) {
    try { return JSON.parse(guardado); } catch (err) { /* ilegible: se recalcula */ }
  }

  const todos = construirRegistros().registros;

  const porPlanta = {};
  todos.forEach(function (r) {
    (porPlanta[r.planta] = porPlanta[r.planta] || []).push(r);
  });

  Object.keys(CORREOS_PLANTA).forEach(function (p) {
    cacheGuardar(claveDeCache(p), JSON.stringify(porPlanta[p] || []));
  });

  return porPlanta[planta] || [];
}

/**
 * Deja la caché lista para que nadie espere.
 *
 * Pensada para un activador cada hora: quien abra el enlace encuentra el
 * trabajo hecho en vez de ser quien lo paga.
 */
function calentarCache() {
  const inicio = new Date().getTime();
  limpiarCache();
  const n = registrosDePlanta(Object.keys(CORREOS_PLANTA)[0]).length;
  Logger.log("Caché lista en " + Math.round((new Date().getTime() - inicio) / 1000) +
             " s. La primera planta trae " + n + " registros.");
}

/**
 * El logotipo convertido a texto, para que viaje dentro del HTML.
 *
 * Va incrustado y no como enlace a una imagen: así se ve también en el archivo
 * descargado, sin conexión y al imprimir. Si el archivo no se puede leer, se
 * devuelve vacío y el reporte usa el dibujo que ya trae.
 */
function logoIncrustado() {
  if (!ID_LOGO) return "";

  const cache = CacheService.getScriptCache();
  const guardado = cache.get("logo_v1");
  if (guardado) return guardado;

  try {
    const blob = DriveApp.getFileById(ID_LOGO).getBlob();
    const uri  = "data:" + blob.getContentType() + ";base64," +
                 Utilities.base64Encode(blob.getBytes());

    if (uri.length > 400000) {
      Logger.log("El logo pesa " + Math.round(uri.length / 1024) +
                 " KB. Conviene uno más liviano: basta con 120 px de alto.");
    }
    if (uri.length < 90000) {          // el límite por entrada de caché son 100 KB
      try { cache.put("logo_v1", uri, 21600); } catch (err) { /* sigue sin caché */ }
    }
    return uri;
  } catch (err) {
    Logger.log("No se pudo leer el logo (" + ID_LOGO + "): " + err.message);
    return "";
  }
}

/**
 * Nombre de pila a partir del correo: juan.narvaezsalazar@… -> "Juan".
 *
 * Se quitan los números del final (leidy.perez2) y, cuando el primer trozo es
 * una inicial suelta (w.otalora), se usa el apellido.
 */
function nombreDeCorreo(local) {
  if (NOMBRES_ESPECIALES[local]) return NOMBRES_ESPECIALES[local];

  const trozos = local.split(".");
  let nombre = (trozos[0] || "").replace(/\d+$/, "");

  if (nombre.length <= 2) {
    const apellido = (trozos[1] || "").replace(/\d+$/, "");
    if (apellido.length > 2 && apellido !== "ext") nombre = apellido;
  }
  if (!nombre) return "";
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/** "Paula y Marisol" — los nombres de quienes reciben el reporte de la planta. */
function saludoDePlanta(planta) {
  const nombres = [];

  String(CORREOS_PLANTA[planta] || "").split(",").forEach(function (correo) {
    const local = String(correo).split("@")[0].trim().toLowerCase();
    if (!local) return;
    if (NOMBRES_SIN_SALUDO.indexOf(local) !== -1) return;

    const nombre = nombreDeCorreo(local);
    if (nombre && nombres.indexOf(nombre) === -1) nombres.push(nombre);
  });

  if (!nombres.length) return "";
  if (nombres.length === 1) return nombres[0];
  return nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}

/** Texto seguro para meter en el HTML del correo. */
function escapar(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Envía una solicitud de capacitación. La llama la página con google.script.run.
 *
 * Lo que llega viene del navegador, así que no se toma por bueno: la planta
 * tiene que ser una de las configuradas, las personas se limitan en número y
 * los textos se recortan y se escapan antes de armar el correo.
 *
 * @param {{planta:string, personas:Array, nota:string}} datos
 * @return {string} mensaje para mostrar en pantalla
 */
function enviarSolicitud(datos) {
  if (CORREO_SOLICITUDES.indexOf("CAMBIAR") === 0) {
    throw new Error("Todavía no está configurado a quién se le envían las solicitudes. " +
                    "Avise a Seguridad y Salud.");
  }

  datos = datos || {};
  const planta = indicePlantas()[normalizar(datos.planta)];
  if (!planta) throw new Error("No reconozco la planta de la solicitud.");

  let personas = Array.isArray(datos.personas) ? datos.personas : [];
  if (!personas.length) throw new Error("No hay ninguna capacitación seleccionada.");
  if (personas.length > MAX_POR_SOLICITUD) {
    throw new Error("Son demasiadas de una vez (máximo " + MAX_POR_SOLICITUD + "). " +
                    "Divídalas en varias solicitudes.");
  }

  const recorta = function (v, max) { return String(v == null ? "" : v).trim().slice(0, max); };
  const nota = recorta(datos.nota, 1200);

  // Quién lo pide. Dentro del mismo dominio Google sí lo entrega.
  let solicitante = "";
  try { solicitante = Session.getActiveUser().getEmail() || ""; } catch (err) { solicitante = ""; }

  const filas = personas.map(function (p) {
    return "<tr>" +
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef'>" + escapar(recorta(p.nombre, 120)) + "</td>" +
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef'>" + escapar(recorta(p.id, 30))     + "</td>" +
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef'>" + escapar(recorta(p.pos, 120))   + "</td>" +
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef'>" + escapar(recorta(p.curso, 200)) + "</td>" +
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef;white-space:nowrap'>" +
        escapar(recorta(p.estado, 40)) + "</td>" +
      // El enlace se resuelve aquí, no se toma del navegador
      "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef'>" + (function () {
        const url = enlaceDeCurso(recorta(p.curso, 200), 99999);
        return url ? "<a href='" + escapar(url) + "'>se hace en línea</a>" : "";
      })() + "</td></tr>";
  }).join("");

  const cuerpo =
    "<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f1e2b;line-height:1.6\">" +
    "<p>Cordial saludo.</p>" +
    "<p>Desde el reporte de vencimientos de <b>" + escapar(planta) + "</b> se solicita programar " +
    "las siguientes capacitaciones:</p>" +
    "<table style=\"border-collapse:collapse;font-size:13px;margin:14px 0;width:100%\">" +
    "<thead><tr style=\"background:#1d4370;color:#fff\">" +
    "<th style='padding:8px 10px;text-align:left'>Nombre</th>" +
    "<th style='padding:8px 10px;text-align:left'>Cédula</th>" +
    "<th style='padding:8px 10px;text-align:left'>Cargo</th>" +
    "<th style='padding:8px 10px;text-align:left'>Capacitación</th>" +
    "<th style='padding:8px 10px;text-align:left'>Estado</th>" +
    "<th style='padding:8px 10px;text-align:left'></th>" +
    "</tr></thead><tbody>" + filas + "</tbody></table>" +
    (nota
      ? "<p><b>Observaciones de quien solicita:</b></p>" +
        "<p style=\"background:#eef3f8;border-left:3px solid #1d4370;padding:11px 14px;margin:0 0 14px;" +
        "white-space:pre-wrap\">" + escapar(nota) + "</p>"
      : "") +
    "<p style=\"color:#5d7186;font-size:12.5px\">Solicitud enviada" +
    (solicitante ? " por <b>" + escapar(solicitante) + "</b>" : "") + " el " +
    Utilities.formatDate(new Date(), CFG.ZONA, "d 'de' MMMM 'de' yyyy 'a las' HH:mm") +
    " desde el reporte de capacitaciones.</p></div>";

  const correo = {
    to:       CORREO_SOLICITUDES,
    subject:  "Solicitud de capacitación · " + planta + " · " + personas.length +
              (personas.length === 1 ? " persona" : " personas"),
    htmlBody: cuerpo
  };
  if (solicitante) {
    correo.replyTo = solicitante;      // para que se le pueda contestar directo
    correo.cc      = solicitante;      // y le quede copia de lo que pidió
  }

  MailApp.sendEmail(correo);

  return personas.length === 1
    ? "Solicitud enviada. Le queda copia en su correo."
    : "Solicitud enviada con " + personas.length + " personas. Le queda copia en su correo.";
}

/** Página de aviso, con la misma tipografía sobria del reporte. */
function paginaSimple(titulo, detalle, ayuda) {
  const html =
    '<div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;' +
    'max-width:34rem;margin:4rem auto;padding:0 1.5rem;color:#0f1e2b;line-height:1.6">' +
    '<h1 style="font-size:1.35rem;margin:0 0 .6rem">' + titulo + "</h1>" +
    '<p style="margin:0 0 .5rem">' + detalle + "</p>" +
    '<p style="margin:0;color:#5d7186;font-size:.92rem">' + ayuda + "</p></div>";
  return HtmlService.createHtmlOutput(html).setTitle(titulo);
}


// ════════════════════════════════════════════════════════════════════
//  COMPROBACIÓN — ejecutar esto primero, no envía nada
// ════════════════════════════════════════════════════════════════════

/**
 * Lee la matriz y cuenta lo que saldría, sin enviar correos ni publicar nada.
 * El resultado sale en el registro de ejecución (Ver → Registros).
 */
function probar() {
  const salida = construirRegistros();
  const r = salida.registros;
  const a = salida.avisos;
  const linea = [];

  linea.push("PERSONAS");
  linea.push("  activas en la matriz ....... " + a.personasActivas);
  linea.push("  registros en la ventana .... " + r.length + "  (hasta " + CFG.VENTANA_DIAS + " días)");
  linea.push("");

  const porUrg = {};
  const porPlanta = {};
  r.forEach(function (x) {
    porUrg[x.urg] = (porUrg[x.urg] || 0) + 1;
    porPlanta[x.planta] = (porPlanta[x.planta] || 0) + 1;
  });

  linea.push("URGENCIA");
  ["vencida", "critica", "alta", "media", "baja", "pendiente"].forEach(function (u) {
    linea.push("  " + u + new Array(Math.max(1, 12 - u.length)).join(" ") + (porUrg[u] || 0));
  });
  linea.push("");

  linea.push("POR PLANTA");
  Object.keys(CORREOS_PLANTA).sort().forEach(function (p) {
    const n = porPlanta[p] || 0;
    linea.push("  " + (n === 0 ? "(sin novedades) " : "                ") + p + ": " + n);
  });
  linea.push("");

  linea.push("AVISOS");
  const sinCorreo = Object.keys(a.plantasSinCorreo);
  if (sinCorreo.length) {
    linea.push("  DIVISIONES SIN CORREO CONFIGURADO (sus personas quedan fuera):");
    sinCorreo.sort().forEach(function (p) {
      linea.push("     " + p + " — " + a.plantasSinCorreo[p] + " personas");
    });
  } else {
    linea.push("  todas las divisiones tienen correo configurado");
  }

  const sinCat = Object.keys(a.cursosSinCategoria);
  if (sinCat.length) {
    linea.push("  CURSOS SIN CATEGORÍA (salen como 'Interna / formación'):");
    sinCat.sort().forEach(function (c) { linea.push("     " + c); });
  } else {
    linea.push("  todos los cursos tienen categoría");
  }

  linea.push("  cursos detectados: " + a.cursosDetectados +
             (a.cursosDetectados === CFG.CURSOS_ESPERADOS ? "" : "  <-- CAMBIO, revisar la matriz"));
  const anchos = Object.keys(a.anchosDeBloque).sort();
  linea.push("  columnas por curso: " +
    anchos.map(function (w) { return w + " -> " + a.anchosDeBloque[w] + " cursos"; }).join(" · "));

  linea.push("");
  const url = ScriptApp.getService().getUrl();
  linea.push(url
    ? "ENLACE DE EJEMPLO\n  " + url + "?planta=" + encodeURIComponent("HC-BELLO")
    : "Todavía no hay aplicación web publicada (ver LEEME.md).");

  Logger.log(linea.join("\n"));
  return salida;
}


// ════════════════════════════════════════════════════════════════════
//  CORREO SEMANAL — reemplaza a enviarRecordatoriosCapacitaciones
// ════════════════════════════════════════════════════════════════════

/**
 * Arma el correo semanal de una planta. La usan tanto el envío real como la
 * prueba, para que lo que se revisa sea exactamente lo que sale.
 *
 * @return {{asunto:string, cuerpo:string}}
 */
function armarCorreoDePlanta(planta, registros, enlace, fecha) {
  const tabla = tablaDelCorreo(registros);

    // Lo que no va en la tabla se menciona, para que se sepa que está y dónde verlo
  const aparte = [];
    if (tabla.internas) {
    aparte.push("<b>" + tabla.internas + "</b> de formación interna");
    }
    if (tabla.pendientes) {
    aparte.push("<b>" + tabla.pendientes + "</b> que nunca se han realizado");
    }

  const puntos = tabla.listadas
    ? "<p>Los puntos relevantes de esta semana son las capacitaciones de <b>alto riesgo y legales</b> " +
      "vencidas en el último mes o por vencer en los próximos " + CORREO_TABLA.proximosHasta + " días:</p>" +
      tabla.html
    : "<p>Esta semana <b>no hay capacitaciones de alto riesgo ni legales</b> vencidas en el último mes " +
      "ni por vencer en los próximos " + CORREO_TABLA.proximosHasta + " días.</p>";

    // Las de más atraso no se listan, pero no se callan
  const viejas = tabla.antiguas
    ? "<p style=\"background:#fbe9e7;border-left:3px solid #8f1d16;padding:11px 14px;" +
      "border-radius:0 8px 8px 0;margin:0 0 14px\">Hay además <b style=\"color:#8f1d16\">" +
      tabla.antiguas + "</b> de alto riesgo o legales con <b>más de " + CORREO_TABLA.vencidasDesde +
      " días vencidas</b>. No se listan aquí para no alargar el correo: se consultan en el reporte.</p>"
    : "";

  const cola = aparte.length
    ? "<p>Aparte de lo anterior, la planta tiene " + aparte.join(" y ") +
      ". Todo eso se consulta en el reporte.</p>"
    : "";

  const cuerpo =
    "<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f1e2b;line-height:1.6\">" +
    "<p>Buen día.</p>" +
    "<p>De parte de <b>Capacitaciones H&amp;S</b> enviamos el informe semanal de las capacitaciones de la " +
    "planta <b>" + escapar(planta) + "</b>, con corte al " + fecha + ".</p>" +
    puntos +
    viejas +
    cola +
    "<p style=\"margin:22px 0 10px\">Para más información sobre las capacitaciones internas, " +
    "o para solicitar las que estén pendientes, entre al siguiente enlace:</p>" +
    "<p style=\"margin:0 0 22px\">" +
    "<a href=\"" + enlace + "\" style=\"background:#1d4370;color:#fff;text-decoration:none;" +
    "padding:12px 22px;border-radius:8px;display:inline-block;font-weight:700\">Ver el reporte de " +
    escapar(planta) + "</a></p>" +
    "<p style=\"color:#5d7186;font-size:12.5px\">El enlace muestra siempre los datos del momento en que se abre " +
    "y solo funciona con su cuenta de Holcim. Se adjunta el Excel para quien necesite trabajar los datos.</p>" +
    "</div>";


  return {
    asunto: "Informe semanal de capacitaciones · " + planta,
    cuerpo: cuerpo
  };
}

/**
 * Manda a cada planta su enlace, con el Excel adjunto para quien necesite
 * trabajar los datos. Sustituye el PDF por el enlace al tablero.
 *
 * No hace nada mientras ENVIAR_CORREOS sea false.
 */
function enviarEnlacesSemanales() {
  const url = ScriptApp.getService().getUrl();
  if (!url) throw new Error("No hay aplicación web publicada. Publíquela antes (ver LEEME.md).");

  const todos = construirRegistros().registros;
  const fecha = Utilities.formatDate(new Date(), CFG.ZONA, "d 'de' MMMM 'de' yyyy");

  const porPlanta = {};
  todos.forEach(function (r) {
    (porPlanta[r.planta] = porPlanta[r.planta] || []).push(r);
  });

  // La matriz ya está leída: se deja la caché lista antes de mandar los correos.
  // Es el momento en que más falta hace, porque en cuanto salgan van a entrar
  // todos a la vez y nadie debería ser quien pague la primera lectura.
  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    cacheGuardar(claveDeCache(planta), JSON.stringify(porPlanta[planta] || []));
  });

  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    const registros = porPlanta[planta] || [];
    const enlace    = url + "?planta=" + encodeURIComponent(planta);

    const armado = armarCorreoDePlanta(planta, registros, enlace, fecha);

    const adjuntos = [excelDePlanta(planta, registros)];

    if (!ENVIAR_CORREOS) {
      Logger.log("[PRUEBA] " + planta + "  " + registros.length + " registros\n          " + enlace);
      return;
    }

    MailApp.sendEmail({
      to:          CORREOS_PLANTA[planta],
      subject:     armado.asunto,
      htmlBody:    armado.cuerpo,
      attachments: adjuntos
    });
  });

  Logger.log(ENVIAR_CORREOS ? "Correos enviados." : "Prueba terminada: no se envió nada.");
}

/**
 * La tabla del correo semanal y las cuentas que la acompañan.
 *
 * Devuelve { html, listadas, restantes, internas, pendientes }.
 */
function tablaDelCorreo(registros) {
  const enFranja = registros.filter(function (r) {
    if (r.urg === "pendiente") return false;                       // sin fecha, van aparte
    if (CORREO_TABLA.grupos.indexOf(r.grupo) === -1) return false;
    return r.dias >= -CORREO_TABLA.vencidasDesde &&
           r.dias <=  CORREO_TABLA.proximosHasta;
  }).sort(function (a, b) { return a.dias - b.dias; });            // lo más vencido primero

  const muestra   = enFranja.slice(0, CORREO_TABLA.maxFilas);
  const restantes = enFranja.length - muestra.length;

  const internas   = registros.filter(function (r) {
    return r.urg !== "pendiente" && CORREO_TABLA.grupos.indexOf(r.grupo) === -1;
  }).length;
  const pendientes = registros.filter(function (r) { return r.urg === "pendiente"; }).length;

  // Las de riesgo o de ley con más atraso del que abarca la tabla. No se listan
  // para no alargar el correo, pero se dice cuántas son y dónde verlas.
  const antiguas = registros.filter(function (r) {
    return r.urg !== "pendiente" &&
           CORREO_TABLA.grupos.indexOf(r.grupo) !== -1 &&
           r.dias < -CORREO_TABLA.vencidasDesde;
  }).length;

  const cuentas = { listadas: muestra.length, restantes: restantes, antiguas: antiguas,
                    internas: internas, pendientes: pendientes };

  if (!muestra.length) {
    cuentas.html = "";
    return cuentas;
  }

  const filas = muestra.map(function (r) {
    const vencida = r.dias < 0;
    const estado  = vencida      ? "Vencida hace " + Math.abs(r.dias) + " días"
                  : r.dias === 0 ? "Vence hoy"
                  : "Vence en " + r.dias + " días";
    const color   = vencida ? "#8f1d16" : r.dias <= 7 ? "#d92f28" : r.dias <= 15 ? "#e07a0c" : "#5d7186";
    const celda   = "padding:8px 10px;border-bottom:1px solid #e2e8ef;font-size:12.5px";

    return "<tr>" +
      "<td style='" + celda + "'>" + escapar(r.nombre) + "<br>" +
        "<span style='color:#5d7186;font-size:11.5px'>CC " + escapar(r.id) + " &middot; " + escapar(r.pos) + "</span></td>" +
      "<td style='" + celda + "'>" + escapar(r.curso) + "<br>" +
        "<span style='color:#5d7186;font-size:11.5px'>" + escapar(r.cat) + "</span></td>" +
      "<td style='" + celda + ";white-space:nowrap'>" + (r.fecha ? escapar(r.fecha) : "&mdash;") + "</td>" +
      "<td style='" + celda + ";white-space:nowrap;color:" + color + ";font-weight:700'>" + estado + "</td>" +
      "</tr>";
  }).join("");

  const html =
    "<table style=\"border-collapse:collapse;width:100%;margin:16px 0\">" +
    "<thead><tr style=\"background:#1d4370;color:#fff\">" +
    "<th style='padding:9px 10px;text-align:left;font-size:12px'>Persona</th>" +
    "<th style='padding:9px 10px;text-align:left;font-size:12px'>Capacitación</th>" +
    "<th style='padding:9px 10px;text-align:left;font-size:12px'>Vence</th>" +
    "<th style='padding:9px 10px;text-align:left;font-size:12px'>Estado</th>" +
    "</tr></thead><tbody>" + filas + "</tbody></table>" +
    (restantes
      ? "<p style=\"font-size:12.5px;color:#5d7186;margin:-6px 0 14px\">Y " + restantes +
        " más en el reporte.</p>"
      : "");

  cuentas.html = html;
  return cuentas;
}

/** Planta que se usa al probar el correo. */
const PLANTA_DE_PRUEBA = "HC-MONDOÑEDO";

/**
 * Manda a su propio correo el informe de PLANTA_DE_PRUEBA, igual que saldría el
 * martes: mismo asunto, mismo cuerpo, misma tabla y el mismo Excel adjunto.
 *
 * No toca la lista de destinatarios, no depende de ENVIAR_CORREOS y no altera
 * el activador. Sirve para revisar antes de soltarlo.
 */
function probarCorreo() {
  const url = ScriptApp.getService().getUrl();
  if (!url) throw new Error("Publique la aplicación web antes de probar el correo.");

  const planta = indicePlantas()[normalizar(PLANTA_DE_PRUEBA)];
  if (!planta) throw new Error("PLANTA_DE_PRUEBA no coincide con ninguna de CORREOS_PLANTA.");

  const registros = construirRegistros().registros
    .filter(function (r) { return r.planta === planta; });

  const enlace = url + "?planta=" + encodeURIComponent(planta);
  const fecha  = Utilities.formatDate(new Date(), CFG.ZONA, "d 'de' MMMM 'de' yyyy");
  const armado = armarCorreoDePlanta(planta, registros, enlace, fecha);

  const yo = Session.getEffectiveUser().getEmail();

  MailApp.sendEmail({
    to:          yo,
    subject:     "[PRUEBA] " + armado.asunto,
    htmlBody:    "<p style=\"background:#fbf3dc;border-left:3px solid #bd9000;padding:10px 14px;" +
                 "border-radius:0 8px 8px 0;font-family:system-ui,Arial,sans-serif;font-size:13px\">" +
                 "Esto es una prueba. El martes sale igual, pero a los destinatarios de la planta.</p>" +
                 armado.cuerpo,
    attachments: [excelDePlanta(planta, registros)]
  });

  Logger.log("Enviado a " + yo + "\n  planta: " + planta +
             "\n  registros: " + registros.length +
             "\n  enlace: " + enlace);
  return "Enviado a " + yo;
}

/**
 * Mide cuánto tarda cada pieza en abrirse, con la caché vacía y con la caché
 * lista. Sirve para saber si una optimización sirvió de algo, en vez de ir a
 * ojo. El resultado sale en el registro de ejecución.
 */
function medirVelocidad() {
  const planta = indicePlantas()[normalizar(PLANTA_DE_PRUEBA)] || Object.keys(CORREOS_PLANTA)[0];
  const ahora  = function () { return new Date().getTime(); };
  let t;

  limpiarCache();

  t = ahora();
  const nFrio  = registrosDePlanta(planta).length;
  const msFrio = ahora() - t;

  t = ahora();
  const nCaliente  = registrosDePlanta(planta).length;
  const msCaliente = ahora() - t;

  t = ahora();
  const bytesLogo = logoIncrustado().length;
  const msLogo    = ahora() - t;

  Logger.log([
    "VELOCIDAD · " + planta,
    "",
    "  caché vacía ....... " + (msFrio / 1000).toFixed(1) + " s   (lee la matriz y guarda las 16 plantas)",
    "  caché lista ....... " + (msCaliente / 1000).toFixed(1) + " s   <- lo que espera la gente",
    "  logotipo .......... " + (msLogo / 1000).toFixed(1) + " s   (" + Math.round(bytesLogo / 1024) + " KB)",
    "",
    "  registros de la planta: " + nCaliente + (nFrio === nCaliente ? "" : "  (!! frío " + nFrio + ")"),
    "",
    "Si 'caché lista' sigue alto, el peso está en el tamaño de la planta, no en",
    "la lectura. Si 'caché vacía' es lo alto, conviene el activador que la deja",
    "lista cada hora: así nadie es quien la paga."
  ].join("\n"));
}

/** Excel (.xlsx) con los registros de una planta. */
function excelDePlanta(planta, registros) {
  const libro = SpreadsheetApp.create("TMP_" + planta + "_" + new Date().getTime());
  try {
    const hoja = libro.getActiveSheet();
    hoja.setName("Reporte");

    const titulos = ["Capacitación", "Categoría", "Cédula", "Nombre", "Cargo", "Vencimiento", "Días", "Urgencia"];
    hoja.getRange(1, 1, 1, titulos.length).setValues([titulos])
        .setFontWeight("bold").setBackground("#D9D9D9");

    if (registros.length) {
      const filas = registros.map(function (r) {
        return [r.curso, r.cat, r.id, r.nombre, r.pos, r.fecha, r.dias, r.urg];
      });
      hoja.getRange(2, 1, filas.length, titulos.length).setValues(filas);
    }
    hoja.autoResizeColumns(1, titulos.length);
    SpreadsheetApp.flush();

    const respuesta = UrlFetchApp.fetch(
      "https://docs.google.com/spreadsheets/d/" + libro.getId() + "/export?format=xlsx",
      { headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() } }
    );
    return respuesta.getBlob().setName("Capacitaciones_" + planta + ".xlsx");
  } finally {
    // El finally importa: si algo falla arriba, la hoja temporal se borra igual
    // en vez de quedarse acumulando basura en Drive.
    DriveApp.getFileById(libro.getId()).setTrashed(true);
  }
}


// ════════════════════════════════════════════════════════════════════
//  DESCARGA SUELTA — una foto del reporte, con todas las plantas
// ════════════════════════════════════════════════════════════════════

/**
 * Vacía la caché para que el siguiente que abra un enlace vea la matriz tal
 * como está ahora mismo.
 *
 * Hace falta solo cuando se acaba de corregir la matriz y se quiere comprobar
 * el cambio de inmediato: sin esto hay que esperar a que la caché expire, unos
 * diez minutos.
 */
function limpiarCache() {
  const claves = [];
  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    const base = claveDeCache(planta);
    claves.push(base + "_n");
    for (let i = 0; i < CACHE_MAX_TROZOS; i++) claves.push(base + "_" + i);
  });
  claves.push("logo_v1");
  CacheService.getScriptCache().removeAll(claves);
  Logger.log("Caché vacía. El próximo que abra un enlace leerá la matriz de nuevo.");
}

/**
 * Genera el reporte completo como archivo HTML y lo guarda en el Drive.
 *
 * A diferencia del enlace, este archivo lleva los datos dentro: es una foto del
 * momento en que se ejecuta y no se actualiza sola. Sirve para revisar, guardar
 * un corte o mandarlo a alguien de fuera; para el uso diario está el enlace.
 *
 * La URL del archivo queda en el registro de ejecución.
 *
 * @param {boolean} sinPendientes  true para dejar fuera a quien nunca ha hecho
 *                                 el curso, que es la mayor parte del volumen.
 */
function descargarHtmlCompleto(sinPendientes) {
  let registros = construirRegistros().registros;

  if (sinPendientes) {
    registros = registros.filter(function (r) { return r.urg !== "pendiente"; });
  }

  const plantilla = HtmlService.createTemplateFromFile("reporte");
  plantilla.datosJson     = JSON.stringify(registros);
  plantilla.corteTxt      = Utilities.formatDate(new Date(), CFG.ZONA, "d MMM yyyy · HH:mm");
  plantilla.corteIso      = Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd");
  plantilla.logo          = logoIncrustado();
  plantilla.logoAncho     = LOGO_ANCHO_PX;
  plantilla.saludoJson    = JSON.stringify({ nombres: "", planta: "" });   // sin saludo: son todas
  plantilla.gruposSolicitud = JSON.stringify([]);   // el archivo suelto no puede enviar
  plantilla.plantaInicial = "__ALL__";

  const contenido = plantilla.evaluate().getContent();
  const nombre = "Vencimientos_todas_las_plantas_" +
                 Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd_HHmm") +
                 (sinPendientes ? "_sin_pendientes" : "") + ".html";

  const archivo = DriveApp.createFile(nombre, contenido, MimeType.HTML);

  Logger.log([
    "Archivo generado en su Drive",
    "  nombre ...... " + nombre,
    "  registros ... " + registros.length,
    "  tamaño ...... " + Math.round(contenido.length / 1024) + " KB",
    "",
    "Descárguelo desde:",
    "  " + archivo.getUrl(),
    "",
    "Drive no muestra los HTML: use el botón de descarga y ábralo desde su equipo."
  ].join("\n"));

  return archivo.getUrl();
}

/** Lo mismo, pero dejando fuera a los pendientes. Pesa mucho menos. */
function descargarHtmlSinPendientes() {
  return descargarHtmlCompleto(true);
}
