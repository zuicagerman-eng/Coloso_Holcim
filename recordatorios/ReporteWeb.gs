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
const ENVIAR_CORREOS = true;

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
const CORREO_SOLICITUDES = "german.zuica@holcim.com";

/**
 * Qué capacitaciones se pueden solicitar desde el reporte.
 *
 * "externa" son las que dicta un proveedor y hay que programar con él.
 * Añada "interna" si también quiere poder solicitar las de formación propia.
 */
const GRUPOS_CON_SOLICITUD = ["externa"];

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
    url:   "https://zuicagerman-eng.github.io/Pagina-html-recapacitaciones-Holcim/index.html",
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
 * a un clic. Por eso la tabla se limita a las externas, que son las que hay que
 * programar con un proveedor, en la franja de tiempo donde aún se puede hacer.
 */
const CORREO_TABLA = {
  grupoArriba: "externa"   // el bloque que encabeza la tabla: lo que hay que programar
};

/**
 * Cuánto se guarda en caché lo leído de la matriz.
 *
 * Más minutos = abre más rápido, pero una corrección en la matriz tarda más en
 * verse. limpiarCache() lo fuerza cuando hace falta verlo ya.
 */
const CACHE_MINUTOS = 15;

/**
 * Minutos que se permite el envío semanal antes de parar por su cuenta.
 *
 * Apps Script corta a los seis. Si corta él, algunas plantas ya recibieron y
 * otras no, y no queda registro de cuáles: al volver a ejecutar se repetirían
 * las primeras. Por eso el envío se apunta planta por planta y se detiene solo
 * antes de llegar al límite; volver a ejecutarlo sigue por donde quedó.
 */
const MINUTOS_MAXIMOS = 5;

/** Tope de personas por solicitud, para que un envío no se desborde. */
const MAX_POR_SOLICITUD = 60;

/** Geometría de la matriz. Coincide con lo que ya usa el correo actual. */
const CFG = {
  HOJA_MATRIZ:         "Matriz de Capacitaciones H&S",
  FILA_CURSOS:         6,    // fila con el nombre de cada curso
  FILA_TITULOS:        7,    // fila con Aplicabilidad · Fecha de vencimiento · Soporte
  FILA_ESTANDAR:       0,    // fila del estándar que agrupa cursos; 0 = buscarla sola
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
 * Categorías que dicta un proveedor externo y hay que programar con él.
 *
 * Todo lo demás cuenta como interno. Va por categoría y no por curso, así que
 * al añadir un nivel nuevo de alturas o de izajes queda clasificado solo.
 */
const CATEGORIAS_EXTERNAS = [
  "Alturas",
  "Izajes",
  "Espacios confinados",
  "Conducción defensiva",
  "Brigada de emergencia"
];

/** "externa" o "interna", a partir de la categoría del curso. */
function grupoDeCategoria(categoria) {
  const buscada = normalizar(categoria);
  for (let i = 0; i < CATEGORIAS_EXTERNAS.length; i++) {
    if (normalizar(CATEGORIAS_EXTERNAS[i]) === buscada) return "externa";
  }
  return "interna";
}

/**
 * Categoría de cada curso.
 * Tomado del HTML original para conservar exactamente su clasificación.
 * Un curso que no esté aquí cae en "Interna / formación" y se reporta en probar().
 */
const CATEGORIA_CURSO = {
  "(Re) Inducción General H&S":                                                              "Interna / formación",
  "Aislamiento y Bloqueo de Energía para todos":                                             "Energías peligrosas (LOTO)",
  "Bienestar y Limpieza":                                                                    "Interna / formación",
  "Curso 50 horas o actualización 20 horas SGSST":                                           "SGSST",
  "Emisor de Permiso":                                                                       "Permisos de trabajo",
  "Manejo Defensivo NSC Edicion 5":                                                          "Conducción defensiva",
  "Manejo de cargas e Higiene Postural":                                                     "Interna / formación",
  "Operador de equipos para elevación de personas (manlift)":                                "Izajes",
  "Prevencion y control de los riesgos derivados del uso de la silice cristalina respirable": "Interna / formación",
  "Prevención de lesiones o DME - Reporte temprano de síntomas":                             "Interna / formación",
  "Programa de evaluación y control de vibraciones":                                         "Interna / formación",
  "Reentrenamiento Brigadista Clase I Resolución 0256":                                      "Brigada de emergencia",
  "Reentrenamiento Trabajo en alturas":                                                      "Alturas",
  "Sistema globalmente armonizado":                                                          "Interna / formación",
  "Supervisor de izaje":                                                                     "Izajes",
  "Titular de candado":                                                                      "Energías peligrosas (LOTO)",
  "Trabajador autorizado de trabajo en caliente":                                            "Trabajo en caliente",
  "Trabajo seguro con computador":                                                           "Interna / formación",

  // ─── Cursos que no aparecían en el HTML original ────────────────────────
  // La clasificación de estos la propuse yo siguiendo el mismo criterio.
  // Revíselos y corrija los que no correspondan.
  "Emisor de Permiso de Trabajo en Caliente":                                                "Trabajo en caliente",
  "Centinela de Fuego para trabajos en caliente":                                            "Trabajo en caliente",
  "Entrenamiento Brigadista Clase I Resolución 0256":                                        "Brigada de emergencia",
  "Uso DEA / Soporte Vital Básico":                                                          "Brigada de emergencia",
  "Reglas basicas y habitos seguros de conduccion en vias internas":                         "Conducción defensiva",
  "Montaje y Desmontaje de Andamios":                                                        "Alturas",
  "Trabajador autorizado / Ayudante de seguridad Trabajo en alturas":                        "Alturas",
  "Trabajo cerca al agua":                                                                   "Alturas",
  "Trabajador Entrante en espacios confinados":                                              "Espacios confinados",
  "Vigía de Seguridad para Trabajos en Espacios Confinados":                                 "Espacios confinados",
  "Supervisor / Emisor de permisos de espacios confinados (debe contar previamente con curso de entrante y vigía de EC)": "Espacios confinados"
};

const CATEGORIA_POR_DEFECTO = "Interna / formación";


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
  let cat = null;
  if (Object.prototype.hasOwnProperty.call(CATEGORIA_CURSO, curso)) {
    cat = CATEGORIA_CURSO[curso];
  } else {
    const buscado = normalizar(curso);          // segundo intento, sin mayúsculas ni espacios
    for (const clave in CATEGORIA_CURSO) {
      if (normalizar(clave) === buscado) { cat = CATEGORIA_CURSO[clave]; break; }
    }
  }
  if (cat == null) return null;
  return [cat, grupoDeCategoria(cat)];
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
 * Devuelve [{curso, inicio, fecha, ancho}, ...] solo con los bloques que tienen
 * fecha. «inicio» hace falta para leer el estándar, que va combinado arriba.
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

    bloques.push({ curso: limpiarCurso(nombres[ini]), inicio: ini, fecha: iFecha, ancho: fin - ini });
  }
  return bloques;
}

/**
 * Arrastra una fila de encabezado hacia la derecha y la reparte por bloque.
 *
 * El estándar va combinado: cubre varios cursos y el texto solo está en la
 * primera columna del tramo, así que las demás llegan vacías. Se copia el
 * último valor visto hasta que aparece otro, igual que se lee en pantalla.
 */
function valoresPorBloque(fila, bloques) {
  const arrastre = [];
  let ultimo = "";
  for (let i = 0; i < fila.length; i++) {
    const v = String(fila[i] == null ? "" : fila[i]).replace(/\s+/g, " ").trim();
    if (v) ultimo = v;
    arrastre[i] = ultimo;
  }
  return bloques.map(function (b) { return arrastre[b.inicio] || ""; });
}

/**
 * El estándar de cada curso, leído de las filas de encabezado.
 *
 * Qué fila es se puede fijar en CFG.FILA_ESTANDAR. Con 0 se busca sola, para
 * que mover una fila en la matriz no obligue a tocar el código: de las filas
 * por encima del nombre del curso se descarta la que rotula toda la matriz de
 * una vez (no agrupa nada), la que trae un valor distinto por curso (esa es el
 * nombre del curso otra vez) y la de puros números (la vigencia en meses); de
 * las que quedan gana la que más códigos de estándar trae (HSE-001, SGI 12…).
 *
 * probar() escribe en el registro qué fila salió elegida y con qué estándares,
 * que es la forma de comprobar que acertó.
 *
 * Devuelve { fila, valores } con valores[i] = estándar del bloque i.
 */
function leerEstandares(encabezados, bloques) {
  const vacio = { fila: 0, valores: [] };
  if (!bloques.length) return vacio;

  if (CFG.FILA_ESTANDAR >= 1 && CFG.FILA_ESTANDAR <= encabezados.length) {
    return { fila: CFG.FILA_ESTANDAR,
             valores: valoresPorBloque(encabezados[CFG.FILA_ESTANDAR - 1], bloques) };
  }

  const candidatas = [];
  for (let r = 0; r < encabezados.length; r++) {
    const fila = r + 1;
    if (fila === CFG.FILA_CURSOS || fila === CFG.FILA_TITULOS) continue;

    const valores   = valoresPorBloque(encabezados[r], bloques);
    const distintos = {};
    let conValor = 0, codigos = 0, numeros = 0;

    valores.forEach(function (v) {
      if (!v) return;
      conValor++;
      distintos[v] = true;
      if (/^[A-ZÁÉÍÓÚÑ]{2,6}[\s._-]*\d{1,3}\b/.test(v)) codigos++;
      if (/^[\d.,\s]+$/.test(v)) numeros++;
    });

    const nDistintos = Object.keys(distintos).length;
    if (nDistintos < 2 || nDistintos >= bloques.length) continue;
    if (numeros > conValor / 2) continue;

    candidatas.push({ fila: fila, valores: valores, conValor: conValor, codigos: codigos });
  }

  candidatas.sort(function (a, b) {
    return (b.codigos - a.codigos) || (b.conValor - a.conValor) || (a.fila - b.fila);
  });
  return candidatas.length ? candidatas[0] : vacio;
}

/**
 * { nombre del curso: estándar } para el tablero.
 *
 * El estándar depende del curso, no de la persona, así que viaja como una
 * tabla de 62 entradas en vez de repetirse en cada registro: el filtro nuevo
 * no le suma peso al enlace. Solo lee las filas de encabezado, que es una
 * lectura mínima al lado de la matriz entera, y aun así se guarda en caché.
 */
function mapaEstandares() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get("est_v1");
  if (guardado) {
    try { return JSON.parse(guardado); } catch (err) { /* ilegible: se relee */ }
  }

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.HOJA_MATRIZ);
  if (!hoja) return {};

  const ancho = hoja.getLastColumn() - CFG.PRIMERA_COL_CURSO + 1;
  const enc   = hoja.getRange(1, CFG.PRIMERA_COL_CURSO, CFG.FILA_TITULOS, ancho).getValues();
  const mapa  = mapaDeEstandares(enc, detectarBloques(enc[CFG.FILA_CURSOS - 1],
                                                      enc[CFG.FILA_TITULOS - 1])).mapa;

  try { cache.put("est_v1", JSON.stringify(mapa), CACHE_MINUTOS * 60); } catch (err) {}
  return mapa;
}

/** { fila, mapa } a partir de los encabezados ya leídos. */
function mapaDeEstandares(encabezados, bloques) {
  const est  = leerEstandares(encabezados, bloques);
  const mapa = {};
  bloques.forEach(function (b, i) {
    if (est.valores[i]) mapa[b.curso] = est.valores[i];
  });
  return { fila: est.fila, mapa: mapa };
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

  // Los encabezados se traen de una sola vez: el estándar está entre ellos y
  // una lectura de siete filas cuesta menos que tres lecturas sueltas.
  const encabezados  = hoja.getRange(1, CFG.PRIMERA_COL_CURSO, CFG.FILA_TITULOS, anchoCursos).getValues();
  const nombresCurso = encabezados[CFG.FILA_CURSOS  - 1];
  const titulosCurso = encabezados[CFG.FILA_TITULOS - 1];
  const personas     = hoja.getRange(CFG.PRIMERA_FILA_DATOS, 1, filas, 7).getValues();
  const vencimientos = hoja.getRange(CFG.PRIMERA_FILA_DATOS, CFG.PRIMERA_COL_CURSO, filas, anchoCursos).getValues();

  const bloques   = detectarBloques(nombresCurso, titulosCurso);
  const estandares = mapaDeEstandares(encabezados, bloques);

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
    anchosDeBloque:    {},
    filaEstandar:      estandares.fila,
    estandares:        estandares.mapa
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
        categoria = [CATEGORIA_POR_DEFECTO, grupoDeCategoria(CATEGORIA_POR_DEFECTO)];
      }

      // El enlace del curso NO se guarda aquí. Iba dentro del registro, y los
      // registros se guardan en caché: al cambiar la URL había que esperar a
      // que la caché venciera para verla. Ahora la tabla de enlaces viaja
      // aparte y el tablero la resuelve al pintar, que además pesa menos.
      registros.push({
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
  plantilla.estandaresJson  = JSON.stringify(mapaEstandares());
  plantilla.resumenJson     = JSON.stringify(resumenDePlantas());
  plantilla.enlacesJson     = JSON.stringify(CURSOS_CON_ENLACE);
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
  return recalcularTodo().porPlanta[planta] || [];
}

/**
 * Lee la matriz una vez y deja las dieciséis plantas en caché.
 *
 * De paso arma el resumen —cuántos vencimientos y cuántos urgentes tiene cada
 * planta—, que es lo que necesita el selector para mostrar las demás plantas
 * sin tener que cargarlas.
 */
function recalcularTodo() {
  const todos = construirRegistros().registros;

  const porPlanta = {};
  todos.forEach(function (r) {
    (porPlanta[r.planta] = porPlanta[r.planta] || []).push(r);
  });

  const resumen = {};
  Object.keys(CORREOS_PLANTA).forEach(function (p) {
    const suyos = porPlanta[p] || [];
    cacheGuardar(claveDeCache(p), JSON.stringify(suyos));
    resumen[p] = {
      n:   suyos.length,
      urg: suyos.filter(function (r) { return r.urg !== "pendiente" && r.dias <= 7; }).length
    };
  });

  try {
    CacheService.getScriptCache().put("res_v1", JSON.stringify(resumen), CACHE_MINUTOS * 60);
  } catch (err) { /* el resumen es una comodidad, no vale fallar por él */ }

  return { porPlanta: porPlanta, resumen: resumen };
}

/** Cuántos vencimientos tiene cada planta, para el selector. Pesa unos bytes. */
function resumenDePlantas() {
  const guardado = CacheService.getScriptCache().get("res_v1");
  if (guardado) {
    try { return JSON.parse(guardado); } catch (err) { /* ilegible: se recalcula */ }
  }
  return recalcularTodo().resumen;
}

/**
 * Los registros de otra planta, cuando alguien la pide con el selector.
 *
 * El enlace llega con su planta ya dentro, que es lo que hace que abra rápido.
 * Las demás no viajan hasta que se piden: quien solo mira la suya no paga el
 * peso de las otras quince.
 */
function registrosDeOtraPlanta(pedida) {
  const planta = indicePlantas()[normalizar(pedida)];
  if (!planta) {
    throw new Error("No reconozco la planta «" + String(pedida == null ? "" : pedida).slice(0, 40) + "».");
  }
  return registrosDePlanta(planta);
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
  mapaEstandares();                       // la tabla de estándares, de paso
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
/**
 * La fecha tentativa, en palabras, o "" si no viene o no sirve.
 *
 * Llega del navegador como AAAA-MM-DD. No se usa new Date(texto): eso lo lee
 * como UTC y en Colombia devuelve el día anterior. Se arma con las partes y se
 * comprueba que la fecha exista de verdad (un 31 de febrero se descarta) y que
 * no sea pasada. Si algo no cuadra se ignora en silencio: es un campo opcional
 * y no tiene sentido tumbar la solicitud entera por él.
 */
const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
                  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_ES  = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * "15 de septiembre de 2026".
 *
 * No se usa Utilities.formatDate con MMMM: eso toma el idioma del proyecto de
 * Apps Script, que está en inglés, y en el correo salía "15 de September".
 */
function fechaEnEspanol(d, conDiaSemana) {
  const txt = d.getDate() + " de " + MESES_ES[d.getMonth()] + " de " + d.getFullYear();
  return conDiaSemana ? DIAS_ES[d.getDay()] + " " + txt : txt;
}

function fechaTentativa(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor == null ? "" : valor).trim());
  if (!m) return "";

  const anio = +m[1], mes = +m[2], dia = +m[3];
  const d = new Date(anio, mes - 1, dia);
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return "";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (d < hoy) return "";
  if (anio > hoy.getFullYear() + 3) return "";   // un año disparatado no es una propuesta

  return fechaEnEspanol(d, true);
}

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
  const nota  = recorta(datos.nota, 1200);
  const fecha = fechaTentativa(datos.fecha);   // "" si no la pusieron

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
    (fecha
      ? "<p style=\"background:#e8f3ea;border-left:3px solid #2f7d4f;padding:11px 14px;margin:0 0 14px\">" +
        "<b>Fecha tentativa propuesta:</b> " + escapar(fecha) +
        "<br><span style=\"color:#5d7186;font-size:12.5px\">Es una propuesta de quien solicita, " +
        "no una fecha confirmada.</span></p>"
      : "") +
    (nota
      ? "<p><b>Observaciones de quien solicita:</b></p>" +
        "<p style=\"background:#eef3f8;border-left:3px solid #1d4370;padding:11px 14px;margin:0 0 14px;" +
        "white-space:pre-wrap\">" + escapar(nota) + "</p>"
      : "") +
    "<p style=\"color:#5d7186;font-size:12.5px\">Solicitud enviada" +
    (solicitante ? " por <b>" + escapar(solicitante) + "</b>" : "") + " el " +
    fechaEnEspanol(new Date(), false) + " a las " +
    Utilities.formatDate(new Date(), CFG.ZONA, "HH:mm") +
    " desde el reporte de capacitaciones.</p></div>";

  const correo = {
    to:       CORREO_SOLICITUDES,
    subject:  "Solicitud de capacitación · " + planta + " · " + personas.length +
              (personas.length === 1 ? " persona" : " personas") +
              (fecha ? " · propuesta: " + fecha : ""),
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

  // El estándar sale de una fila de encabezado que el script busca solo. Aquí
  // se ve cuál eligió: si no es la que toca, se fija en CFG.FILA_ESTANDAR.
  linea.push("");
  linea.push("ESTÁNDARES  (fila " + (a.filaEstandar || "?") +
             (CFG.FILA_ESTANDAR ? ", fijada en CFG.FILA_ESTANDAR" : ", detectada sola") + ")");
  const porEstandar = {};
  Object.keys(a.estandares).forEach(function (curso) {
    const e = a.estandares[curso];
    (porEstandar[e] = porEstandar[e] || []).push(curso);
  });
  const nombresEst = Object.keys(porEstandar).sort();
  if (!nombresEst.length) {
    linea.push("  NINGUNO. El tablero no mostrará el filtro por estándar.");
    linea.push("  Fije CFG.FILA_ESTANDAR con el número de fila donde está.");
  } else {
    nombresEst.forEach(function (e) {
      linea.push("  " + e + "  (" + porEstandar[e].length + " cursos)");
    });
    const sinEstandar = a.cursosDetectados - Object.keys(a.estandares).length;
    if (sinEstandar > 0) linea.push("  " + sinEstandar + " cursos se quedaron sin estándar");
  }

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

  const puntos = tabla.filas.length
    ? "<p>Estas son las personas de la planta a las que les falta cada capacitación:</p>" +
      tabla.html +
      "<p style=\"font-size:12.5px;color:#5d7186;margin:-6px 0 18px\">" +
      "Se cuentan <b>personas</b>, no capacitaciones. En total son <b>" + tabla.personas +
      "</b> personas distintas; una misma persona puede contar en varias filas si le falta " +
      "más de una capacitación.</p>"
    : "<p>Esta semana la planta <b>no tiene capacitaciones vencidas, por vencer ni sin realizar</b>. " +
      "Nada que programar.</p>";

  const cuerpo =
    "<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f1e2b;line-height:1.6\">" +
    "<p>Buen día.</p>" +
    "<p>De parte de <b>Capacitaciones H&amp;S</b> enviamos el informe semanal de las capacitaciones de la " +
    "planta <b>" + escapar(planta) + "</b>, con corte al " + fecha + ".</p>" +
    puntos +
    "<p style=\"margin:22px 0 10px\">Para ver quién es quién, solicitar la programación de las externas " +
    "o hacer en línea las que se pueden, entre al siguiente enlace:</p>" +
    "<p style=\"margin:0 0 22px\">" +
    "<a href=\"" + enlace + "\" style=\"background:#1d4370;color:#fff;text-decoration:none;" +
    "padding:12px 22px;border-radius:8px;display:inline-block;font-weight:700\">Ver el reporte de " +
    escapar(planta) + "</a></p>" +
    "<p style=\"color:#5d7186;font-size:12.5px\">El enlace abre en " + escapar(planta) + ", y desde el " +
    "selector de planta se pueden consultar las demás. Muestra siempre los datos del momento en que se " +
    "abre y solo funciona con su cuenta de Holcim. Se adjunta el Excel para quien necesite trabajar los datos.</p>" +
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
  const arranque = new Date().getTime();

  const url = ScriptApp.getService().getUrl();
  if (!url) throw new Error("No hay aplicación web publicada. Publíquela antes (ver LEEME.md).");

  const todos = construirRegistros().registros;
  const fecha = fechaEnEspanol(new Date(), false);

  const porPlanta = {};
  todos.forEach(function (r) {
    (porPlanta[r.planta] = porPlanta[r.planta] || []).push(r);
  });

  // La matriz ya está leída: se deja la caché lista antes de mandar los correos.
  // Es el momento en que más falta hace, porque en cuanto salgan van a entrar
  // todos a la vez y nadie debería ser quien pague la primera lectura.
  const resumen = {};
  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    const suyos = porPlanta[planta] || [];
    cacheGuardar(claveDeCache(planta), JSON.stringify(suyos));
    resumen[planta] = {
      n:   suyos.length,
      urg: suyos.filter(function (r) { return r.urg !== "pendiente" && r.dias <= 7; }).length
    };
  });
  try {
    CacheService.getScriptCache().put("res_v1", JSON.stringify(resumen), CACHE_MINUTOS * 60);
  } catch (err) {}

  // Lo que ya salió hoy, para no mandarlo dos veces. Ver la nota de arriba.
  const props   = PropertiesService.getScriptProperties();
  const clave   = claveDeEnviosDeHoy();
  const yaSalio = leerEnviadas(props, clave);

  const linea = [], pendientes = [], repetidas = [];

  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    const registros = porPlanta[planta] || [];
    const enlace    = url + "?planta=" + encodeURIComponent(planta);

    if (!ENVIAR_CORREOS) {
      // En prueba no se arma el Excel: son dieciséis hojas temporales en Drive
      // para tirarlas acto seguido. El adjunto se comprueba con probarCorreo().
      linea.push("[PRUEBA] " + planta + "  " + registros.length + " registros -> " +
                 CORREOS_PLANTA[planta] + "\n          " + enlace);
      return;
    }

    if (yaSalio.indexOf(planta) !== -1) { repetidas.push(planta); return; }

    // Apps Script corta la ejecución a los seis minutos. Antes de empezar una
    // planta se mira si hay tiempo para terminarla: más vale dejarla para la
    // siguiente ejecución que cortarse a mitad y no saber por dónde se iba.
    if (new Date().getTime() - arranque > MINUTOS_MAXIMOS * 60000) {
      pendientes.push(planta);
      return;
    }

    const armado = armarCorreoDePlanta(planta, registros, enlace, fecha);

    MailApp.sendEmail({
      to:          CORREOS_PLANTA[planta],
      subject:     armado.asunto,
      htmlBody:    armado.cuerpo,
      attachments: [excelDePlanta(planta, registros)]
    });

    // Se apunta enseguida, no al final: si la ejecución muere en la planta
    // siguiente, esta ya quedó registrada como enviada.
    yaSalio.push(planta);
    props.setProperty(clave, JSON.stringify(yaSalio));

    linea.push("enviado  " + planta + "  " + registros.length + " registros -> " + CORREOS_PLANTA[planta]);
  });

  if (repetidas.length) {
    linea.push("");
    linea.push("OMITIDAS porque ya salieron hoy: " + repetidas.join(", "));
    linea.push("  Si de verdad quiere repetirlas, ejecute olvidarEnviosDeHoy() y vuelva a correr esto.");
  }
  if (pendientes.length) {
    linea.push("");
    linea.push("SE ACABÓ EL TIEMPO con " + pendientes.length + " plantas sin enviar: " + pendientes.join(", "));
    linea.push("  Vuelva a ejecutar enviarEnlacesSemanales(): sigue por donde quedó,");
    linea.push("  las ya enviadas no se repiten.");
  }

  linea.push("");
  linea.push(ENVIAR_CORREOS
    ? "Terminado en " + Math.round((new Date().getTime() - arranque) / 1000) + " s."
    : "Prueba terminada: NO se envió nada. ENVIAR_CORREOS está en false.");

  Logger.log(linea.join("\n"));
}

/** La marca del día, en la zona de la planta y no en la del servidor. */
function claveDeEnviosDeHoy() {
  return "enviadas_" + Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd");
}

function leerEnviadas(props, clave) {
  try {
    const v = JSON.parse(props.getProperty(clave) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (err) {
    return [];
  }
}

/**
 * Borra la marca de lo enviado hoy.
 *
 * Solo hace falta para mandar a propósito un segundo correo el mismo día. Sin
 * esto, volver a ejecutar enviarEnlacesSemanales() omite las plantas que ya
 * salieron, que es justo lo que se quiere cuando una ejecución se cortó a la
 * mitad y hay que retomarla.
 */
function olvidarEnviosDeHoy() {
  const props = PropertiesService.getScriptProperties();
  const clave = claveDeEnviosDeHoy();
  const antes = leerEnviadas(props, clave);
  props.deleteProperty(clave);
  Logger.log(antes.length
    ? "Marca borrada. Estas " + antes.length + " volverán a recibir si ejecuta el envío:\n  " + antes.join(", ")
    : "Hoy no había ninguna marcada como enviada.");
}

/** Qué plantas ya recibieron hoy, sin tocar nada. */
function verEnviosDeHoy() {
  const enviadas = leerEnviadas(PropertiesService.getScriptProperties(), claveDeEnviosDeHoy());
  const faltan   = Object.keys(CORREOS_PLANTA).filter(function (p) { return enviadas.indexOf(p) === -1; });
  Logger.log("ENVIADAS HOY (" + enviadas.length + "): " + (enviadas.join(", ") || "ninguna") +
             "\n\nSIN ENVIAR  (" + faltan.length + "): " + (faltan.join(", ") || "ninguna"));
}

/**
 * La tabla del correo semanal y las cuentas que la acompañan.
 *
 * Devuelve { html, listadas, restantes, internas, pendientes }.
 */
function tablaDelCorreo(registros) {
  // Una persona puede tener varias capacitaciones de lo mismo. Lo que se cuenta
  // son PERSONAS: "de alturas faltan 12" se entiende; "hay 19 vencimientos de
  // alturas" no dice a cuánta gente hay que mover.
  const porCat = {};
  const todas  = {};

  registros.forEach(function (r) {
    const c = porCat[r.cat] || (porCat[r.cat] = {
      cat: r.cat, grupo: r.grupo, vencidas: {}, proximas: {}, sinHacer: {}, personas: {}
    });
    const casilla = (r.urg === "pendiente") ? c.sinHacer : (r.dias < 0 ? c.vencidas : c.proximas);
    casilla[r.id]   = true;
    c.personas[r.id] = true;
    todas[r.id]      = true;
  });

  const cuenta = function (o) { return Object.keys(o).length; };

  const filas = Object.keys(porCat).map(function (k) {
    const c = porCat[k];
    return { cat: c.cat, grupo: c.grupo,
             vencidas: cuenta(c.vencidas), proximas: cuenta(c.proximas),
             sinHacer: cuenta(c.sinHacer), personas: cuenta(c.personas) };
  });

  // Primero el grupo que hay que programar con proveedor, y dentro de cada
  // grupo lo más vencido arriba: el orden del correo es el orden de la agenda.
  filas.sort(function (a, b) {
    const ga = a.grupo === CORREO_TABLA.grupoArriba ? 0 : 1;
    const gb = b.grupo === CORREO_TABLA.grupoArriba ? 0 : 1;
    return (ga - gb) || (b.vencidas - a.vencidas) || (b.personas - a.personas) ||
           a.cat.localeCompare(b.cat);
  });

  return { filas: filas, personas: cuenta(todas), registros: registros.length,
           html: htmlDeTabla(filas) };
}

/** La tabla del correo a partir de las filas ya contadas. */
function htmlDeTabla(filas) {
  if (!filas.length) return "";

  const celda  = "padding:8px 11px;border-bottom:1px solid #e2e8ef;font-size:13px";
  const numero = celda + ";text-align:center;white-space:nowrap";
  const total  = { vencidas: 0, proximas: 0, sinHacer: 0 };

  let grupoActual = null;
  const cuerpo = filas.map(function (f) {
    total.vencidas += f.vencidas;
    total.proximas += f.proximas;
    total.sinHacer += f.sinHacer;

    let separador = "";
    if (f.grupo !== grupoActual) {
      grupoActual = f.grupo;
      separador =
        "<tr><td colspan='4' style=\"padding:11px 11px 5px;font-size:11.5px;font-weight:700;" +
        "letter-spacing:.06em;text-transform:uppercase;color:#5d7186;background:#f4f7fa\">" +
        (grupoActual === "externa"
          ? "Externas &middot; se programan con el proveedor"
          : "Internas &middot; varias se hacen en línea desde el reporte") +
        "</td></tr>";
    }

    // Un cero no es una alerta: se pinta apagado para que salten los que no lo son
    const n = function (v, color) {
      return "<td style='" + numero + (v ? ";color:" + color + ";font-weight:700" : ";color:#b6c2cf") + "'>" +
             (v || "&middot;") + "</td>";
    };

    return separador +
      "<tr><td style='" + celda + "'>" + escapar(f.cat) + "</td>" +
      n(f.vencidas, "#8f1d16") + n(f.proximas, "#e07a0c") + n(f.sinHacer, "#5d7186") + "</tr>";
  }).join("");

  const pie =
    "<tr style=\"background:#eef3f8\">" +
    "<td style='" + celda + ";border-bottom:0;font-weight:700'>Total</td>" +
    "<td style='" + numero + ";border-bottom:0;font-weight:700'>" + (total.vencidas || "&middot;") + "</td>" +
    "<td style='" + numero + ";border-bottom:0;font-weight:700'>" + (total.proximas || "&middot;") + "</td>" +
    "<td style='" + numero + ";border-bottom:0;font-weight:700'>" + (total.sinHacer || "&middot;") + "</td></tr>";

  return "<table style=\"border-collapse:collapse;width:100%;margin:16px 0\">" +
    "<thead><tr style=\"background:#1d4370;color:#fff\">" +
    "<th style='padding:9px 11px;text-align:left;font-size:12px'>Capacitación</th>" +
    "<th style='padding:9px 11px;font-size:12px;white-space:nowrap'>Vencidas</th>" +
    "<th style='padding:9px 11px;font-size:12px;white-space:nowrap'>Vencen en " + CFG.VENTANA_DIAS + " días</th>" +
    "<th style='padding:9px 11px;font-size:12px;white-space:nowrap'>Sin realizar</th>" +
    "</tr></thead><tbody>" + cuerpo + pie + "</tbody></table>";
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
  const fecha  = fechaEnEspanol(new Date(), false);
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

    const estandares = mapaEstandares();
    const titulos = ["Estándar", "Capacitación", "Categoría", "Cédula", "Nombre", "Cargo", "Vencimiento", "Días"];
    hoja.getRange(1, 1, 1, titulos.length).setValues([titulos])
        .setFontWeight("bold").setBackground("#D9D9D9");

    if (registros.length) {
      const filas = registros.map(function (r) {
        return [estandares[r.curso] || "", r.curso, r.cat, r.id, r.nombre, r.pos, r.fecha, r.dias];
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
  claves.push("logo_v1", "est_v1", "res_v1");
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
  plantilla.estandaresJson  = JSON.stringify(mapaEstandares());
  plantilla.resumenJson     = JSON.stringify({});   // el archivo suelto ya las trae todas
  plantilla.enlacesJson     = JSON.stringify(CURSOS_CON_ENLACE);
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
