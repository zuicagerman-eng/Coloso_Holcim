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
  "AF-NOBSA":           "yeison.monroy.ext@holcim.com, carlos.vargash@holcim.com, maria.diazp@holcim.com, leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "AF-TELEPORT":        "yeison.monroy.ext@holcim.com, juan.narvaezsalazar@holcim.com, german.zuica@holcim.com",
  "CJ-NOBSA":           "yeison.monroy.ext@holcim.com, leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "HC-BARRANCABERMEJA": "yeison.monroy.ext@holcim.com, leidys.blanco@holcim.com, german.zuica@holcim.com",
  "HC-BELLO":           "yeison.monroy.ext@holcim.com, mayra.ramirez@holcim.com, wilson.toledo@holcim.com, edwin.yepes@holcim.com, leidy.perez2@holcim.com, juan.sanchez6@holcim.com, german.zuica@holcim.com",
  "HC-CALI":            "yeison.monroy.ext@holcim.com, mayra.ramirez@holcim.com, german.zuica@holcim.com",
  "HC-CHIA":            "yeison.monroy.ext@holcim.com, w.otalora@holcim.com, sara.garzon.ext@holcim.com, german.zuica@holcim.com",
  "HC-MEDELLIN":        "yeison.monroy.ext@holcim.com, wilson.toledo@holcim.com, german.zuica@holcim.com",
  "HC-MONDOÑEDO":       "yeison.monroy.ext@holcim.com, paula.catano@holcim.com, marisol.miranda@holcim.com, german.zuica@holcim.com",
  "HC-NOBSA CEMENTO":   "yeison.monroy.ext@holcim.com, leidy.rodriguez@holcim.com, carlos.vargash@holcim.com, maria.diazp@holcim.com, german.zuica@holcim.com",
  "HC-NOBSA CONCRETO":  "yeison.monroy.ext@holcim.com, leidy.rodriguez@holcim.com, german.zuica@holcim.com",
  "HC-PALMIRA":         "yeison.monroy.ext@holcim.com, mayra.ramirez@holcim.com, german.zuica@holcim.com",
  "HC-PUENTE ARANDA":   "german.zuica@holcim.com, yeison.monroy.ext@holcim.com, wilson.toledo@holcim.com, edwin.nastacuas@holcim.com, yineth.barrera@holcim.com",
  "HC-SIBATE":          "yeison.monroy.ext@holcim.com, edwin.nastacuas@holcim.com, wilson.toledo@holcim.com, miller.mahecharueda@holcim.com, german.zuica@holcim.com",
  "HC-TELEPORT":        "yeison.monroy.ext@holcim.com, juan.narvaezsalazar@holcim.com, german.zuica@holcim.com",
  "HC-TQC":             "yeison.monroy.ext@holcim.com, lizeth.novoa@holcim.com, german.zuica@holcim.com"
};

/** Geometría de la matriz. Coincide con lo que ya usa el correo actual. */
const CFG = {
  HOJA_MATRIZ:         "Matriz de Capacitaciones H&S",
  FILA_CURSOS:         6,    // fila con el nombre de cada curso
  PRIMERA_FILA_DATOS:  8,
  PRIMERA_COL_CURSO:   10,   // columna J
  COLUMNAS_POR_CURSO:  3,    // Aplicabilidad · Fecha de vencimiento · Soporte
  NUM_CURSOS:          62,
  VENTANA_DIAS:        60,   // hasta dónde mirar hacia adelante
  ZONA:                "GMT-5"
};

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
  "Trabajo seguro con computador":                                                           ["Interna / formación",       "interna"]
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
 * Recorre la matriz y devuelve un registro por cada vencimiento dentro de la
 * ventana. Las columnas NO se ubican a ciegas: se verifica que el bloque de
 * cada curso tenga su nombre, y los cursos omitidos se comparan normalizados.
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
  const anchoCursos = CFG.NUM_CURSOS * CFG.COLUMNAS_POR_CURSO;   // 62 × 3 = 186

  const nombresCurso = hoja.getRange(CFG.FILA_CURSOS, CFG.PRIMERA_COL_CURSO, 1, anchoCursos).getValues()[0];
  const personas     = hoja.getRange(CFG.PRIMERA_FILA_DATOS, 1, filas, 7).getValues();
  const vencimientos = hoja.getRange(CFG.PRIMERA_FILA_DATOS, CFG.PRIMERA_COL_CURSO, filas, anchoCursos).getValues();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const plantas   = indicePlantas();
  const omitir    = CURSOS_OMITIR.map(normalizar);
  const registros = [];
  const avisos    = {
    personasActivas:   0,
    plantasSinCorreo:  {},
    cursosSinCategoria: {},
    bloquesSinNombre:  0
  };

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

    for (let c = 0; c < celdas.length; c += CFG.COLUMNAS_POR_CURSO) {
      const curso = limpiarCurso(nombresCurso[c]);
      if (!curso) { avisos.bloquesSinNombre++; continue; }
      if (omitir.indexOf(normalizar(curso)) !== -1) continue;

      const valor = celdas[c + 1];                       // la 2ª del trío es la fecha
      if (!(valor instanceof Date) || isNaN(valor)) continue;

      const vence = new Date(valor);
      vence.setHours(0, 0, 0, 0);
      const dias = Math.round((vence - hoy) / 86400000);
      if (dias > CFG.VENTANA_DIAS) continue;

      let categoria = categoriaDe(curso);
      if (!categoria) {
        avisos.cursosSinCategoria[curso] = (avisos.cursosSinCategoria[curso] || 0) + 1;
        categoria = CATEGORIA_POR_DEFECTO;
      }

      registros.push({
        planta: planta,
        nombre: String(nombre).trim(),
        id:     String(cedula == null ? "" : cedula).trim(),
        pos:    String(cargo == null ? "" : cargo).trim(),
        curso:  curso,
        cat:    categoria[0],
        grupo:  categoria[1],
        fecha:  Utilities.formatDate(vence, CFG.ZONA, "yyyy-MM-dd"),
        dias:   dias,
        urg:    urgenciaPorDias(dias)
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
  plantilla.plantaInicial = planta;

  return plantilla.evaluate()
    .setTitle("Vencimientos de Capacitaciones · " + planta)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Registros de una planta, con caché corta.
 *
 * Leer la matriz entera toma varios segundos; sin caché, cada persona que
 * abre el enlace pagaría esa espera. Diez minutos es suficiente para una
 * mañana de consultas y bastante corto para no mostrar datos viejos.
 */
function registrosDePlanta(planta) {
  const cache = CacheService.getScriptCache();
  const clave = "rep_v1_" + Utilities.base64EncodeWebSafe(planta);

  const guardado = cache.get(clave);
  if (guardado) {
    try { return JSON.parse(guardado); } catch (err) { /* caché ilegible: se recalcula */ }
  }

  const todos = construirRegistros().registros;
  const mios  = todos.filter(function (r) { return r.planta === planta; });

  const texto = JSON.stringify(mios);
  if (texto.length < 90000) {            // el límite por entrada son 100 KB
    try { cache.put(clave, texto, 600); } catch (err) { /* si no cabe, seguimos sin caché */ }
  }
  return mios;
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
  ["vencida", "critica", "alta", "media", "baja"].forEach(function (u) {
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

  if (a.bloquesSinNombre) {
    linea.push("  bloques de curso sin nombre en la fila " + CFG.FILA_CURSOS + ": " + a.bloquesSinNombre);
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

  Object.keys(CORREOS_PLANTA).forEach(function (planta) {
    const registros = porPlanta[planta] || [];
    const enlace    = url + "?planta=" + encodeURIComponent(planta);

    const vencidas = registros.filter(function (r) { return r.urg === "vencida"; }).length;
    const criticas = registros.filter(function (r) { return r.urg === "critica"; }).length;

    const resumen = registros.length === 0
      ? "<p>Esta semana <b>no hay vencimientos</b> en los próximos " + CFG.VENTANA_DIAS + " días.</p>"
      : "<p>Hay <b>" + registros.length + "</b> vencimientos en los próximos " + CFG.VENTANA_DIAS + " días" +
        (vencidas ? ", de los cuales <b style=\"color:#8f1d16\">" + vencidas + " ya vencieron</b>" : "") +
        (criticas ? " y <b style=\"color:#d92f28\">" + criticas + " vencen esta semana</b>" : "") + ".</p>";

    const cuerpo =
      "<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f1e2b;line-height:1.6\">" +
      "<p>Cordial saludo.</p>" +
      "<p>Reporte de capacitaciones de <b>" + planta + "</b> al " + fecha + ".</p>" +
      resumen +
      "<p style=\"margin:22px 0\">" +
      "<a href=\"" + enlace + "\" style=\"background:#1d4370;color:#fff;text-decoration:none;" +
      "padding:11px 20px;border-radius:8px;display:inline-block;font-weight:600\">Abrir el reporte</a></p>" +
      "<p style=\"color:#5d7186;font-size:12.5px\">El enlace muestra siempre los datos del momento en que se abre " +
      "y solo funciona con su cuenta de Holcim. Se adjunta el Excel para quien necesite trabajar los datos.</p>" +
      "</div>";

    const adjuntos = [excelDePlanta(planta, registros)];

    if (!ENVIAR_CORREOS) {
      Logger.log("[PRUEBA] " + planta + ": " + registros.length + " registros · " + enlace);
      return;
    }

    MailApp.sendEmail({
      to:          CORREOS_PLANTA[planta],
      subject:     "Reporte de capacitaciones · " + planta,
      htmlBody:    cuerpo,
      attachments: adjuntos
    });
  });

  Logger.log(ENVIAR_CORREOS ? "Correos enviados." : "Prueba terminada: no se envió nada.");
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
