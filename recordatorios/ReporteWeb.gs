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

/**
 * El enlace de la aplicación web, fijado a mano.
 *
 * Vacío significa "pregúntaselo a ScriptApp". El problema es que
 * ScriptApp.getService().getUrl() NO devuelve siempre lo mismo: depende de
 * desde dónde se ejecute. Ejecutado a mano desde el editor devuelve una cosa,
 * y disparado por el activador del martes puede devolver otra —normalmente la
 * de la última implementación creada—. Por eso probarCorreo() mandaba un
 * enlace que abría y el envío de las siete mandó uno que no.
 *
 * Puesto aquí, el enlace es el que usted verificó que abre, y no cambia
 * porque alguien publique una versión nueva. Se saca de
 * Implementar -> Administrar implementaciones, copiando la URL de la
 * implementación activa (termina en /exec).
 */
const URL_APP = "";

/**
 * Aviso puntual al principio del correo.
 *
 * Con `texto` vacío no sale nada y el correo es el de siempre. Con texto,
 * aparece destacado encima del saludo, y `prefijoAsunto` se antepone al
 * asunto.
 *
 * Es para avisos de una sola vez: una corrección, un cambio de fecha, una
 * jornada extraordinaria. HAY QUE VACIARLO DESPUÉS DE USARLO — si no, el
 * aviso de hoy vuelve a salir el martes que viene, cuando ya no significa
 * nada. enviarEnlacesSemanales() lo recuerda en el registro cada vez que
 * envía con un aviso puesto.
 */
const AVISO_CORREO = {
  texto: "Este informe <b>reemplaza al que les llegó esta mañana</b>: el enlace que " +
         "llevaba no abría. Ya está corregido y verificado. Una disculpa por el inconveniente.",
  prefijoAsunto: "Corrección · "
};

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

/**
 * Dejar que el estándar de la matriz ponga la categoría.
 *
 * CATEGORIA_CURSO es una tabla escrita a mano y once de sus entradas las
 * propuse yo por el nombre del curso. El estándar no: está en la matriz, al
 * lado del curso, y es lo que la organización ya decidió. Con esto en true,
 * un curso cuyo estándar se lea toma su nombre como categoría -sin el código-
 * y la tabla queda como respaldo para los que no tengan estándar.
 *
 * Fue lo que delató «Trabajo cerca al agua»: yo lo tenía bajo Alturas y la
 * matriz dice HSE-110 Trabajos cerca al agua, que es estándar aparte.
 */
const CATEGORIA_DESDE_ESTANDAR = true;

/** Tope de personas por solicitud, para que un envío no se desborde. */
const MAX_POR_SOLICITUD = 60;

/**
 * Una marca que solo existe en el tablero.
 *
 * Sirve para comprobar que el archivo "reporte" es de verdad el tablero y no
 * otra cosa que alguien pegó encima. Si algún día se cambia el HTML, esta
 * cadena tiene que seguir apareciendo en él.
 */
const MARCA_DEL_TABLERO = 'id="view-lista"';

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
 * Cuántos días hacia atrás se considera "recién gestionada".
 *
 * La matriz no guarda historia: solo dice cuándo vence cada cosa. Pero la fila
 * de VIGENCIA (MESES) permite deducir cuándo se hizo -vencimiento menos
 * vigencia- y con eso sí se puede decir qué se movió últimamente, sin tener
 * que comparar contra ninguna foto anterior.
 */
const DIAS_GESTIONADAS = 45;

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

/**
 * Estándares que dicta un proveedor externo.
 *
 * Mientras esté vacío manda CATEGORIAS_EXTERNAS, que trabaja sobre categorías
 * que NO vienen de la matriz: las de los cursos nuevos las propuse yo mirando
 * el nombre, y adivinar el nombre no es saber. "Trabajo cerca al agua" acabó
 * bajo Alturas por eso, y de ahí salió como externa.
 *
 * El estándar sí es dato de la matriz. En cuanto se llene esta lista -copiando
 * del bloque ESTÁNDARES que imprime probar()- manda ella y mis categorías
 * dejan de decidir quién dicta cada curso. Basta el código: "HSE-004" cubre
 * todo el estándar sin tener que escribirlo completo.
 */
const ESTANDARES_EXTERNOS = [];

/**
 * "externa" o "interna" para un curso.
 *
 * Si hay estándares configurados, el estándar del curso decide. Si no, decide
 * la categoría de CATEGORIA_CURSO.
 */
const _memoGrupo = {};

function grupoDeCurso(curso) {
  if (Object.prototype.hasOwnProperty.call(_memoGrupo, curso)) return _memoGrupo[curso];
  return (_memoGrupo[curso] = grupoDeCursoCalculado(curso));
}

function grupoDeCursoCalculado(curso) {
  // Sin lista de estándares manda la tabla escrita a mano, que es lo que había.
  // Se consulta LA TABLA y no la etiqueta que se esté mostrando: con
  // CATEGORIA_DESDE_ESTANDAR la etiqueta pasa a ser "Trabajo en alturas" y
  // CATEGORIAS_EXTERNAS habla de "Alturas", así que mezclarlas dejaría todo
  // como interna y de golpe nadie podría solicitar nada.
  const deTabla = categoriaDeLaTabla(curso);
  const categoria = deTabla ? deTabla[0] : CATEGORIA_POR_DEFECTO;
  if (!ESTANDARES_EXTERNOS.length) return grupoDeCategoria(categoria);

  const est = normalizar(mapaEstandares()[curso] || "");
  if (!est) return grupoDeCategoria(categoria);

  for (let i = 0; i < ESTANDARES_EXTERNOS.length; i++) {
    const clave = normalizar(ESTANDARES_EXTERNOS[i]);
    if (clave && est.indexOf(clave) !== -1) return "externa";
  }
  return "interna";
}

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
  "Trabajo cerca al agua":                                                                   "Trabajo cerca al agua",
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

const _memoCategoria = {};

function categoriaDe(curso) {
  if (Object.prototype.hasOwnProperty.call(_memoCategoria, curso)) return _memoCategoria[curso];
  return (_memoCategoria[curso] = categoriaDeCalculada(curso));
}

function categoriaDeCalculada(curso) {
  if (CATEGORIA_DESDE_ESTANDAR) {
    const delEstandar = categoriaDelEstandar(curso);
    if (delEstandar) return [delEstandar, grupoDeCategoria(delEstandar)];
  }
  return categoriaDeLaTabla(curso);
}

/**
 * El nombre del estándar sin su código: "HSE-110 Trabajos cerca al agua" ->
 * "Trabajos cerca al agua". Vacío si el curso no tiene estándar legible.
 */
function categoriaDelEstandar(curso) {
  const est = mapaEstandares()[curso];
  if (!est) return "";
  const limpio = String(est).replace(/^[A-ZÁÉÍÓÚÑ]{2,6}[\s._-]*\d{1,4}[\s.:-]*/i, "").trim();
  return limpio || String(est).trim();
}

function categoriaDeLaTabla(curso) {
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
    // Solo se juntan espacios y tabuladores, NO los saltos de línea: la nota
    // al pie suele ir en un renglón aparte dentro de la misma celda, y ese
    // salto es la pista más fiable de dónde termina el nombre.
    const v = String(fila[i] == null ? "" : fila[i]).replace(/[ \t\u00a0]+/g, " ").trim();
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
 * { nombre del curso: vigencia en meses }.
 *
 * Es la fila de encabezado que leerEstandares descarta justamente por ser de
 * puros números. Se busca igual que el estándar -la que más números razonables
 * trae- para que mover una fila en la matriz no obligue a tocar el código. Si
 * no aparece, se devuelve vacío y lo único que se pierde es el panel de
 * gestionadas; nada más depende de esto.
 */
function leerVigencias(encabezados, bloques) {
  if (!bloques.length) return {};

  const aMeses = function (v) {
    const t = String(v == null ? "" : v).split(/[\r\n]/)[0].trim().replace(",", ".");
    if (!t || !/^\d+(\.\d+)?$/.test(t)) return 0;
    const n = parseFloat(t);
    // Una vigencia va de un mes a diez años; fuera de ahí es otra cosa
    return (n >= 1 && n <= 120) ? n : 0;
  };

  let mejor = null;
  for (let r = 0; r < encabezados.length; r++) {
    const fila = r + 1;
    if (fila === CFG.FILA_CURSOS || fila === CFG.FILA_TITULOS) continue;

    const valores = valoresPorBloque(encabezados[r], bloques);
    let buenos = 0;
    valores.forEach(function (v) { if (aMeses(v)) buenos++; });
    if (!mejor || buenos > mejor.buenos) mejor = { valores: valores, buenos: buenos };
  }

  if (!mejor || mejor.buenos < bloques.length / 2) return {};

  const mapa = {};
  bloques.forEach(function (b, i) {
    const n = aMeses(mejor.valores[i]);
    if (n) mapa[b.curso] = n;
  });
  return mapa;
}

/**
 * { nombre del curso: estándar } para el tablero.
 *
 * El estándar depende del curso, no de la persona, así que viaja como una
 * tabla de 62 entradas en vez de repetirse en cada registro: el filtro nuevo
 * no le suma peso al enlace. Solo lee las filas de encabezado, que es una
 * lectura mínima al lado de la matriz entera, y aun así se guarda en caché.
 */
let _memoEstandares = null;

function mapaEstandares() {
  if (_memoEstandares) return _memoEstandares;

  const cache = CacheService.getScriptCache();
  const guardado = cache.get("est_v1");
  if (guardado) {
    try { return (_memoEstandares = JSON.parse(guardado)); } catch (err) { /* ilegible: se relee */ }
  }

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.HOJA_MATRIZ);
  if (!hoja) return (_memoEstandares = {});

  const ancho = hoja.getLastColumn() - CFG.PRIMERA_COL_CURSO + 1;
  const enc   = hoja.getRange(1, CFG.PRIMERA_COL_CURSO, CFG.FILA_TITULOS, ancho).getValues();
  const mapa  = mapaDeEstandares(enc, detectarBloques(enc[CFG.FILA_CURSOS - 1],
                                                      enc[CFG.FILA_TITULOS - 1])).mapa;

  try { cache.put("est_v1", JSON.stringify(mapa), CACHE_MINUTOS * 60); } catch (err) {}
  return (_memoEstandares = mapa);
}

/** { fila, mapa } a partir de los encabezados ya leídos. */
function mapaDeEstandares(encabezados, bloques) {
  const est  = leerEstandares(encabezados, bloques);
  const mapa = {};
  const crudos = {};
  bloques.forEach(function (b, i) {
    const limpio = limpiarEstandar(est.valores[i]);
    if (limpio) {
      mapa[b.curso]   = limpio;
      crudos[b.curso] = est.valores[i];
    }
  });
  return { fila: est.fila, mapa: mapa, crudos: crudos };
}

/**
 * El nombre del estándar, sin la nota al pie que lo acompaña en la matriz.
 *
 * La celda no trae solo el nombre. La de HSE-001 dice:
 *
 *   Sistema de Gestión de Salud, Seguridad y Medio Ambiente (SGAS)*
 *   *Roles como COPASST, Brigadista de Emergencia, Coordinadores de alturas...
 *
 * El asterisco marca dónde acaba el nombre y empieza la aclaración. Se corta
 * ahí. Se limpia una sola vez, aquí, porque de este mapa salen la etiqueta de
 * cada fila, el filtro de estándares y la tabla del correo: recortarlo en cada
 * sitio sería recordar tres veces lo mismo.
 */
function limpiarEstandar(valor) {
  let t = String(valor == null ? "" : valor);
  if (!t.trim()) return "";

  // 1. Solo el primer renglón. La nota casi siempre va debajo.
  t = t.split(/[\r\n]/)[0];

  // 2. Hasta el primer asterisco, que es la llamada a la nota al pie.
  const ast = t.indexOf("*");
  if (ast > 0) t = t.slice(0, ast);

  t = t.replace(/\s+/g, " ").trim();

  // 3. Hasta un guión o dos puntos que separen una aclaración. Se exige el
  //    espacio a ambos lados para no partir "HSE-001" ni "Vigía/Entrante".
  t = t.split(/\s+[-–—]\s+/)[0];
  t = t.split(/\s+[:;]\s+/)[0];

  // 4. Y hasta un arranque de aclaración reconocible, por si no trae ninguna
  //    marca. Se comparan sin tildes ni mayúsculas.
  const marcas = ["NOTA", "NOTAS", "APLICA A", "APLICA PARA", "INCLUYE A",
                  "DIRIGIDO A", "ROLES COMO", "OBSERVACION", "OBSERVACIONES",
                  "SEGUN", "SE ASIGNARA", "SE ASIGNARAN"];
  const plano = normalizar(t);
  for (let i = 0; i < marcas.length; i++) {
    const donde = plano.indexOf(" " + marcas[i]);
    if (donde > 0) { t = t.slice(0, donde); break; }
  }

  // Se limpia la puntuación que quede colgando, pero NO los paréntesis de
  // cierre: "(SGAS)" es parte del nombre. Si el corte dejó uno abierto sin
  // cerrar, se quita desde ahí.
  t = t.replace(/[\s.,;:·*\-–—]+$/, "").trim();
  const abre = (t.match(/\(/g) || []).length, cierra = (t.match(/\)/g) || []).length;
  if (abre > cierra) t = t.slice(0, t.lastIndexOf("(")).replace(/[\s.,;:·*\-–—]+$/, "").trim();

  if (t.length <= ESTANDAR_MAX) return t;
  // Cortar en la última palabra completa que quepa, no a mitad de palabra
  const corte = t.slice(0, ESTANDAR_MAX);
  const esp = corte.lastIndexOf(" ");
  return (esp > ESTANDAR_MAX * 0.6 ? corte.slice(0, esp) : corte).replace(/[\s.,;:·-]+$/, "") + "…";
}

/** Largo máximo del nombre de un estándar. Más allá no cabe en ningún sitio. */
const ESTANDAR_MAX = 72;

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

  const bloques    = detectarBloques(nombresCurso, titulosCurso);
  const estandares = mapaDeEstandares(encabezados, bloques);
  const vigencias  = leerVigencias(encabezados, bloques);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const plantas   = indicePlantas();
  const omitir    = CURSOS_OMITIR.map(normalizar);
  const registros = [];
  // Lo que se movió hace poco. Va aparte de los registros: son justamente las
  // que YA NO vencen dentro de la ventana, así que ninguna estaría en la lista.
  const gestionadas = [];
  const desde = new Date(hoy.getTime() - DIAS_GESTIONADAS * 86400000);
  const avisos    = {
    personasActivas:   0,
    plantasSinCorreo:  {},
    cursosSinCategoria: {},
    cursosDetectados:  bloques.length,
    anchosDeBloque:    {},
    filaEstandar:      estandares.fila,
    estandares:        estandares.mapa,
    estandaresCrudos:  estandares.crudos
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

        // Cuándo se hizo = cuándo vence menos su vigencia. Se mira ANTES de
        // descartar por la ventana: lo recién hecho vence dentro de años y si
        // no se recoge aquí, no se recoge en ninguna parte.
        const meses = vigencias[curso];
        if (meses) {
          const hecha = new Date(vence);
          hecha.setMonth(hecha.getMonth() - Math.round(meses));
          if (hecha <= hoy && hecha >= desde) {
            gestionadas.push({
              planta: planta,
              nombre: String(nombre).trim(),
              id:     String(cedula == null ? "" : cedula).trim(),
              curso:  curso,
              grupo:  grupoDeCurso(curso),
              hecha:  Utilities.formatDate(hecha, CFG.ZONA, "yyyy-MM-dd"),
              hace:   Math.round((hoy - hecha) / 86400000)
            });
          }
        }

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
      const grupo = grupoDeCurso(curso);

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
        grupo:  grupo,
        fecha:  fecha,
        dias:   dias,
        urg:    urg
      });
    }
  }

  gestionadas.sort(function (a, b) { return a.hace - b.hace; });   // lo más reciente primero
  avisos.vigenciasLeidas = Object.keys(vigencias).length;
  avisos.gestionadas     = gestionadas.length;

  return { registros: registros, gestionadas: gestionadas, avisos: avisos };
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

  let datos;
  try {
    datos = registrosDePlanta(planta);
  } catch (err) {
    return paginaSimple("No se pudo generar el reporte", String(err.message || err),
                        "Avise a Seguridad y Salud para revisarlo.");
  }

  const plantilla = HtmlService.createTemplateFromFile("reporte");
  plantilla.datosJson       = JSON.stringify(datos.r || []);
  plantilla.gestionadasJson = JSON.stringify(datos.g || []);
  plantilla.corteTxt      = Utilities.formatDate(new Date(), CFG.ZONA, "d MMM yyyy · HH:mm");
  plantilla.corteIso      = Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd");
  plantilla.logo          = logoIncrustado();
  plantilla.logoAncho     = LOGO_ANCHO_PX;
  plantilla.saludoJson    = JSON.stringify({ nombres: saludoDePlanta(planta), planta: planta });
  plantilla.gruposSolicitud = JSON.stringify(GRUPOS_CON_SOLICITUD);
  plantilla.estandaresJson  = JSON.stringify(mapaEstandares());
  plantilla.resumenJson     = JSON.stringify(resumenDePlantas());
  plantilla.enlacesJson     = JSON.stringify(CURSOS_CON_ENLACE);
  plantilla.diasGestionadas = DIAS_GESTIONADAS;
  plantilla.plantaInicial = planta;

  // Comprobar que lo que se va a servir ES el tablero.
  //
  // El archivo "reporte" es un archivo más del proyecto y se puede pisar sin
  // querer: si dentro hay otra cosa, HtmlService la sirve igual y el navegador
  // la enseña tal cual. Ya pasó dos veces con el código de otro proyecto, que
  // acabó a la vista de quien abriera el enlace. Un reporte que no es el
  // reporte es mejor que no salga.
  const salida = plantilla.evaluate();
  if (salida.getContent().indexOf(MARCA_DEL_TABLERO) === -1) {
    return paginaSimple(
      "El reporte no está disponible",
      "El archivo <b>reporte</b> del proyecto no contiene el tablero.",
      "Avise a Seguridad y Salud: hay que volver a pegar reporte.html en ese archivo.");
  }

  return salida
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
  return "rep_v3_" + Utilities.base64EncodeWebSafe(planta);
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
    try {
      const v = JSON.parse(guardado);
      if (v && v.r) return v;
    } catch (err) { /* ilegible: se recalcula */ }
  }
  return recalcularTodo().porPlanta[planta] || { r: [], g: [] };
}

/**
 * Lee la matriz una vez y deja las dieciséis plantas en caché.
 *
 * De paso arma el resumen —cuántos vencimientos y cuántos urgentes tiene cada
 * planta—, que es lo que necesita el selector para mostrar las demás plantas
 * sin tener que cargarlas.
 */
function recalcularTodo() {
  const leido = construirRegistros();

  const porPlanta = {};
  const dame = function (p) {
    return porPlanta[p] || (porPlanta[p] = { r: [], g: [] });
  };
  leido.registros.forEach(function (r) { dame(r.planta).r.push(r); });
  (leido.gestionadas || []).forEach(function (g) { dame(g.planta).g.push(g); });

  const resumen = {};
  Object.keys(CORREOS_PLANTA).forEach(function (p) {
    const suyos = dame(p);
    cacheGuardar(claveDeCache(p), JSON.stringify(suyos));
    resumen[p] = {
      n:   suyos.r.length,
      urg: suyos.r.filter(function (r) { return r.urg !== "pendiente" && r.dias <= 7; }).length
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
  const n = registrosDePlanta(Object.keys(CORREOS_PLANTA)[0]).r.length;
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

  let personas = Array.isArray(datos.personas) ? datos.personas : [];
  if (!personas.length) throw new Error("No hay ninguna capacitación seleccionada.");

  // La planta la trae cada persona, no la solicitud: desde que el reporte deja
  // ver varias a la vez, una misma selección puede mezclarlas. Se resuelve
  // contra la lista del servidor, nunca se copia lo que diga el navegador.
  const plantas = [];
  const conocidas = indicePlantas();
  personas.forEach(function (p) {
    const planta = conocidas[normalizar(p.planta)];
    if (!planta) throw new Error("No reconozco la planta de la solicitud.");
    p.planta = planta;
    if (plantas.indexOf(planta) === -1) plantas.push(planta);
  });
  plantas.sort();
  const planta = plantas.join(" · ");
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

  const celdaPlanta = function (p) {
    return plantas.length > 1
      ? "<td style='padding:7px 10px;border-bottom:1px solid #e2e8ef;white-space:nowrap'>" +
        escapar(p.planta) + "</td>"
      : "";
  };

  const filas = personas.map(function (p) {
    return "<tr>" +
      celdaPlanta(p) +
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
    (plantas.length > 1 ? "<th style='padding:8px 10px;text-align:left'>Planta</th>" : "") +
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
    subject:  "Solicitud de capacitación · " +
              (plantas.length > 2 ? plantas.length + " plantas" : planta) + " · " + personas.length +
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
  linea.push("  (a la izquierda lo que dice la matriz, a la derecha lo que se muestra)");
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
  // Crudo contra recortado, para poder revisar de una vez si alguna se quedó
  // larga o si a alguna le recorté de más.
  if (a.estandaresCrudos) {
    linea.push("");
    linea.push("RECORTE DE LOS ESTÁNDARES");
    const vistos = {};
    Object.keys(a.estandaresCrudos).forEach(function (curso) {
      const crudo = a.estandaresCrudos[curso];
      if (!crudo || vistos[crudo]) return;
      vistos[crudo] = true;
      const corto = limpiarEstandar(crudo);
      const unaLinea = String(crudo).replace(/\s+/g, " ").trim();
      linea.push("  MATRIZ  (" + unaLinea.length + ") " + unaLinea);
      linea.push("  MUESTRA (" + corto.length + ") " + corto +
                 (unaLinea.length === corto.length ? "   = sin recortar" : ""));
      linea.push("");
    });
  }

  linea.push("QUIÉN DICTA CADA CURSO  (decide " +
    (ESTANDARES_EXTERNOS.length ? "el ESTÁNDAR de la matriz" : "CATEGORIAS_EXTERNAS, o sea mi clasificación") + ")");
  const porGrupo = { externa: {}, interna: {} };
  Object.keys(a.estandares).concat(Object.keys(CATEGORIA_CURSO)).forEach(function (curso) {
    const cat = (categoriaDe(curso) || [CATEGORIA_POR_DEFECTO])[0];
    porGrupo[grupoDeCurso(curso)][curso] = cat;
  });
  ["externa", "interna"].forEach(function (g) {
    const cursos = Object.keys(porGrupo[g]).sort();
    linea.push("  " + g.toUpperCase() + " (" + cursos.length + ")" +
               (g === "externa" ? "  <- estos llevan botón de solicitar" : ""));
    cursos.forEach(function (c) {
      linea.push("     " + c + "   [" + porGrupo[g][c] + "]");
    });
  });

  linea.push("");
  let url = "";
  try { url = enlaceDeLaApp(); } catch (err) { url = ""; }
  linea.push(url
    ? "ENLACE DE EJEMPLO   (" + (URL_APP ? "fijado en URL_APP" : "según ScriptApp") + ")\n  " +
      url + "?planta=" + encodeURIComponent("HC-BELLO")
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
    ? "<p>Estas son las personas de la planta a las que les falta cada estándar:</p>" +
      tabla.html +
      "<p style=\"font-size:12.5px;color:#5d7186;margin:-6px 0 18px\">" +
      "Se cuentan <b>personas</b>, no capacitaciones. En total son <b>" + tabla.personas +
      "</b> personas distintas; una misma persona puede contar en varias filas si le falta " +
      "más de una capacitación.</p>"
    : "<p>Esta semana la planta <b>no tiene capacitaciones vencidas, por vencer ni sin realizar</b>. " +
      "Nada que programar.</p>";

  const cuerpo =
    "<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#0f1e2b;line-height:1.6\">" +
    avisoDelCorreo() +
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
    asunto: (AVISO_CORREO.prefijoAsunto || "") + "Informe semanal de capacitaciones · " + planta,
    cuerpo: cuerpo
  };
}

/** El recuadro del aviso puntual, o nada si no hay aviso puesto. */
function avisoDelCorreo() {
  const texto = String((AVISO_CORREO && AVISO_CORREO.texto) || "").trim();
  if (!texto) return "";
  // El texto lo escribe quien configura el script, no llega de fuera, así que
  // se deja pasar el HTML: hace falta para poner una negrita o un enlace.
  return "<p style=\"background:#fbf3dc;border-left:4px solid #bd9000;padding:12px 15px;" +
         "border-radius:0 8px 8px 0;margin:0 0 18px;font-size:13.5px;line-height:1.6\">" +
         texto + "</p>";
}

/**
 * Manda a cada planta su enlace, con el Excel adjunto para quien necesite
 * trabajar los datos. Sustituye el PDF por el enlace al tablero.
 *
 * No hace nada mientras ENVIAR_CORREOS sea false.
 */
function enviarEnlacesSemanales() {
  const arranque = new Date().getTime();

  const url = enlaceDeLaApp();

  // Se comprueba ANTES de mandar nada. Dieciséis correos con un enlace muerto
  // no se pueden recoger, y el que los manda es el último en enterarse.
  if (ENVIAR_CORREOS) {
    const prueba = elEnlaceAbre(url);
    if (!prueba.ok) {
      throw new Error(
        "El enlace no abre (" + prueba.codigo + "):\n  " + url + "\n\n" +
        "Si la implementación se archivó o se borró, publique de nuevo\n" +
        "(Implementar -> Administrar implementaciones -> lápiz -> Versión: Nueva)\n" +
        "y ponga la dirección /exec resultante en URL_APP.\n" +
        "No se envió ningún correo.");
    }
  }
  guardarEnlaceUsado(url);

  // Una sola lectura de la matriz sirve para el correo y, de paso, deja la
  // caché del enlace lista. Es el momento en que más falta hace: en cuanto
  // salgan los correos van a entrar todos a la vez, y nadie debería ser quien
  // pague la primera lectura.
  const fecha = fechaEnEspanol(new Date(), false);
  const listo = recalcularTodo();

  const porPlanta = {};
  Object.keys(listo.porPlanta).forEach(function (p) {
    porPlanta[p] = listo.porPlanta[p].r;
  });

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

  if (String((AVISO_CORREO && AVISO_CORREO.texto) || "").trim()) {
    linea.push("");
    linea.push("AVISO PUESTO EN EL CORREO — acuérdese de vaciar AVISO_CORREO.");
    linea.push("  Si se queda, este mismo aviso vuelve a salir el martes que viene.");
    linea.push("  texto: " + AVISO_CORREO.texto.replace(/<[^>]+>/g, "").slice(0, 90) + "…");
  }

  linea.push("");
  linea.push(ENVIAR_CORREOS
    ? "Terminado en " + Math.round((new Date().getTime() - arranque) / 1000) + " s."
    : "Prueba terminada: NO se envió nada. ENVIAR_CORREOS está en false.");

  Logger.log(linea.join("\n"));
}

/**
 * Deja anotado con qué enlace salieron los correos.
 *
 * Sirve para responder a "¿el enlace que le llegó a la planta es el de ahora?"
 * sin tener que buscar el correo. verEnlaceActual() compara los dos.
 */
function guardarEnlaceUsado(url) {
  try {
    PropertiesService.getScriptProperties().setProperty("enlace_ultimo_envio",
      url + " | " + Utilities.formatDate(new Date(), CFG.ZONA, "yyyy-MM-dd HH:mm"));
  } catch (err) {}
}

/**
 * Compara el enlace de ahora con el que se mandó en el último correo.
 *
 * Si no coinciden, los correos que ya salieron apuntan a una implementación
 * que cambió, y hay que volver a enviarlos.
 */
function verEnlaceActual() {
  let ahora = "";
  try { ahora = enlaceDeLaApp(); } catch (err) { ahora = "(" + err.message + ")"; }
  let ultimo = "";
  try {
    ultimo = PropertiesService.getScriptProperties().getProperty("enlace_ultimo_envio") || "";
  } catch (err) {}

  const partes = ultimo.split(" | ");
  const abre = /^https/.test(ahora) ? elEnlaceAbre(ahora) : { ok: false, codigo: "sin enlace" };
  const linea = [
    "ENLACE DE AHORA   (" + (URL_APP ? "fijado en URL_APP" : "según ScriptApp") + ")",
    "  " + ahora,
    "  " + (abre.ok ? "ABRE correctamente." : "NO ABRE (" + abre.codigo + ")."),
    "  ejemplo: " + ahora + "?planta=" + encodeURIComponent(PLANTA_DE_PRUEBA),
    ""
  ];

  if (!partes[0]) {
    linea.push("Todavía no hay registro de ningún envío con este código.");
  } else {
    linea.push("ENLACE DEL ÚLTIMO CORREO   (" + (partes[1] || "sin fecha") + ")");
    linea.push("  " + partes[0]);
    linea.push("");
    linea.push(partes[0] === ahora
      ? "COINCIDEN. Los correos enviados siguen sirviendo."
      : "NO COINCIDEN. Los correos enviados apuntan a una implementación que ya\n" +
        "no es la de ahora, y quien los abra verá 'No se pudo abrir el archivo'.\n" +
        "Hay que volver a enviarlos: olvidarEnviosDeHoy() y enviarEnlacesSemanales().");
  }

  Logger.log(linea.join("\n"));
  return ahora;
}

/**
 * El enlace de la aplicación web que se va a mandar.
 *
 * Manda URL_APP si está puesto; si no, lo que diga ScriptApp. Nunca una URL
 * /dev: esa solo abre a los editores del script, así que un correo con ella
 * llega roto a las dieciséis plantas y el que lo manda no lo nota, porque a
 * él sí le abre.
 */
function enlaceDeLaApp() {
  const fijado = String(URL_APP || "").trim();
  if (fijado) {
    if (fijado.indexOf("/dev") !== -1) {
      throw new Error("URL_APP es una dirección /dev, que solo abre a los editores del " +
                      "script. Copie la que termina en /exec.");
    }
    return fijado;
  }

  const url = ScriptApp.getService().getUrl();
  if (!url) {
    throw new Error("No hay aplicación web publicada. Publíquela antes (ver LEEME.md).");
  }
  if (url.indexOf("/dev") !== -1) {
    throw new Error("ScriptApp devolvió la URL /dev. Publique la aplicación web, o " +
                    "mejor, ponga la dirección /exec en URL_APP.");
  }
  return url;
}

/**
 * Comprueba que el enlace abre de verdad, antes de mandarlo a nadie.
 *
 * Es la diferencia entre enterarse ahora o enterarse por un reclamo el jueves.
 * Una implementación archivada o borrada responde 404 y el correo sale igual
 * de bonito, con un enlace que no lleva a ninguna parte.
 */
function elEnlaceAbre(url) {
  try {
    const r = UrlFetchApp.fetch(url + "?planta=" + encodeURIComponent(PLANTA_DE_PRUEBA), {
      muteHttpExceptions: true,
      followRedirects:    true,
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
    });
    return { ok: r.getResponseCode() === 200, codigo: r.getResponseCode() };
  } catch (err) {
    return { ok: false, codigo: String(err.message || err) };
  }
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
  // Se agrupa por ESTÁNDAR, que es como está escrito el requisito, y no por la
  // categoría que usa el tablero. Lo que se cuenta son PERSONAS: "del estándar
  // de alturas faltan 12" se entiende; "hay 19 vencimientos" no dice a cuánta
  // gente hay que mover.
  const estandarDe = mapaEstandares();
  const grupos = {};

  registros.forEach(function (r) {
    const est = estandarDe[r.curso] || SIN_ESTANDAR;
    const k   = r.grupo + " >> " + est;

    const f = grupos[k] || (grupos[k] = {
      estandar: est, grupo: r.grupo, cats: {},
      vencidas: {}, proximas: {}, sinHacer: {}, personas: {}
    });

    const casilla = (r.urg === "pendiente") ? f.sinHacer : (r.dias < 0 ? f.vencidas : f.proximas);
    casilla[r.id]    = true;
    f.personas[r.id] = true;
    f.cats[r.cat]    = true;
  });

  const cuantos = function (o) { return Object.keys(o).length; };

  const filas = Object.keys(grupos).map(function (k) {
    const f = grupos[k];
    return {
      estandar: f.estandar, grupo: f.grupo,
      cats:     Object.keys(f.cats).sort(),
      vencidas: cuantos(f.vencidas), proximas: cuantos(f.proximas),
      sinHacer: cuantos(f.sinHacer), personas: cuantos(f.personas)
    };
  });

  // Primero el grupo que hay que programar con proveedor, y dentro de cada
  // grupo lo más vencido arriba: el orden del correo es el orden de la agenda.
  filas.sort(function (a, b) {
    const ga = a.grupo === CORREO_TABLA.grupoArriba ? 0 : 1;
    const gb = b.grupo === CORREO_TABLA.grupoArriba ? 0 : 1;
    return (ga - gb) || (b.vencidas - a.vencidas) || (b.personas - a.personas) ||
           a.estandar.localeCompare(b.estandar);
  });

  const personas = {};
  registros.forEach(function (r) { personas[r.id] = true; });

  return { filas: filas, personas: cuantos(personas), registros: registros.length,
           html: htmlDeTabla(filas) };
}

/** Etiqueta para los cursos cuyo estándar no se pudo leer de la matriz. */
const SIN_ESTANDAR = "Sin estándar asignado";

/**
 * La tabla del correo a partir de las filas ya contadas.
 *
 * El correo se lee en tres segundos y muchas veces desde el teléfono: por eso
 * cada casilla va teñida de su color y las columnas separadas. Un cero no es
 * una alerta, así que se dibuja apagado para que salten los que no lo son.
 */
function htmlDeTabla(filas) {
  if (!filas.length) return "";

  const TONO = {
    vencidas: { fondo: "#fdecea", texto: "#8f1d16" },
    proximas: { fondo: "#fdf3e0", texto: "#9a5b04" },
    sinHacer: { fondo: "#eceff3", texto: "#44596b" }
  };
  const SEP   = "border-right:1px solid #dbe3ec";
  const celda = "padding:9px 12px;border-bottom:1px solid #e2e8ef;font-size:13px;" + SEP;
  const num   = "padding:9px 12px;border-bottom:1px solid #e2e8ef;font-size:14px;" +
                "text-align:center;white-space:nowrap;" + SEP;

  const casilla = function (v, tipo) {
    if (!v) return "<td style='" + num + ";color:#c3ced8'>&middot;</td>";
    const t = TONO[tipo];
    return "<td style='" + num + ";background:" + t.fondo + ";color:" + t.texto +
           ";font-weight:700'>" + v + "</td>";
  };

  const banda = function (texto, fondo, color) {
    return "<tr><td colspan='4' style=\"padding:10px 12px;font-size:11.5px;font-weight:700;" +
           "letter-spacing:.07em;text-transform:uppercase;color:" + color + ";background:" + fondo +
           ";border-bottom:1px solid #e2e8ef\">" + texto + "</td></tr>";
  };

  const subtotal = function (rotulo, t) {
    const n = function (v, tipo) {
      return "<td style='" + num + ";font-weight:800;color:" +
             (v ? TONO[tipo].texto : "#c3ced8") + "'>" + (v || "&middot;") + "</td>";
    };
    return "<tr style=\"background:#f2f6fa\">" +
      "<td style='" + celda + ";font-weight:700'>" + rotulo + "</td>" +
      n(t.vencidas, "vencidas") + n(t.proximas, "proximas") + n(t.sinHacer, "sinHacer") + "</tr>";
  };

  let cuerpo = "", grupoActual = null, acum = null;
  const cerrar = function () {
    if (!acum) return "";
    const html = subtotal(grupoActual === "externa" ? "Total externas" : "Total internas", acum);
    acum = null;
    return html;
  };

  filas.forEach(function (f) {
    if (f.grupo !== grupoActual) {
      cuerpo += cerrar();
      grupoActual = f.grupo;
      acum = { vencidas: 0, proximas: 0, sinHacer: 0 };
      cuerpo += (grupoActual === "externa")
        ? banda("Externas &middot; se programan con el proveedor", "#fdf0ed", "#8f1d16")
        : banda("Internas &middot; varias se hacen en línea desde el reporte", "#edf2f8", "#2c5c8f");
    }

    acum.vencidas += f.vencidas;
    acum.proximas += f.proximas;
    acum.sinHacer += f.sinHacer;

    // Debajo del estándar, qué capacitaciones cubre. Solo cuando son varias:
    // repetir "Alturas" bajo "HSE-004 Trabajo en alturas" no dice nada nuevo.
    const detalle = (f.cats.length > 1)
      ? "<br><span style='color:#5d7186;font-size:11.5px'>" + escapar(f.cats.join(" &middot; ")) + "</span>"
      : "";

    cuerpo += "<tr><td style='" + celda + "'>" + escapar(f.estandar) + detalle + "</td>" +
      casilla(f.vencidas, "vencidas") + casilla(f.proximas, "proximas") +
      casilla(f.sinHacer, "sinHacer") + "</tr>";
  });
  cuerpo += cerrar();

  const th = "padding:10px 12px;font-size:12px;border-right:1px solid rgba(255,255,255,.22)";
  return "<table style=\"border-collapse:collapse;width:100%;margin:16px 0;border:1px solid #dbe3ec\">" +
    "<thead><tr style=\"background:#1d4370;color:#fff\">" +
    "<th style='" + th + ";text-align:left'>Estándar</th>" +
    "<th style='" + th + "'>Vencidas</th>" +
    "<th style='" + th + "'>Vencen en " + CFG.VENTANA_DIAS + " días</th>" +
    "<th style='" + th + ";border-right:0'>Sin realizar</th>" +
    "</tr></thead><tbody>" + cuerpo + "</tbody></table>";
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
  // El mismo camino que el envío del martes. Si aquí abre y allá no, es que
  // no estaban usando el mismo enlace, que es justo lo que pasó.
  const url = enlaceDeLaApp();
  const prueba = elEnlaceAbre(url);
  if (!prueba.ok) {
    throw new Error("El enlace no abre (" + prueba.codigo + "):\n  " + url +
                    "\nNo se mandó la prueba.");
  }

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
  const nFrio  = registrosDePlanta(planta).r.length;
  const msFrio = ahora() - t;

  t = ahora();
  const nCaliente  = registrosDePlanta(planta).r.length;
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
  const leido = construirRegistros();
  let registros = leido.registros;

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
  plantilla.diasGestionadas = DIAS_GESTIONADAS;
  plantilla.gestionadasJson = JSON.stringify(leido.gestionadas || []);
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
