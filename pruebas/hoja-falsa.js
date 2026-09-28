/* Doble de SpreadsheetApp para las pruebas que corren en node.
   No imita toda la API: solo lo que usa Hoja.gs, y con el suficiente
   detalle para que valga la pena —copyTo corre las referencias de las
   fórmulas, como lo hace la hoja de verdad—. */

function celda() { return { valor: '', formula: '', formato: null, validacion: null }; }

function correrReferencias(formula, salto) {
  /* B3 → B4 al copiar una fila hacia abajo. Sin $ no hay referencias
     absolutas que respetar, que es el caso de las fórmulas de la tabla. */
  return String(formula).replace(/(\$?)([A-Z]{1,2})(\$?)(\d+)/g, function (todo, aCol, col, aFila, fila) {
    if (aFila) return todo;
    return aCol + col + (Number(fila) + salto);
  });
}

function hojaFalsa(nombre, libro, encabezados) {
  var celdas = [];   /* celdas[fila][columna], base 0 */

  function en(f, c) {
    while (celdas.length < f) celdas.push([]);
    var linea = celdas[f - 1];
    while (linea.length < c) linea.push(celda());
    return linea[c - 1];
  }

  var hoja = {
    nombre: nombre,
    getName: function () { return nombre; },
    getSheetId: function () { return nombre; },
    getParent: function () { return libro; },

    getLastRow: function () {
      for (var f = celdas.length; f >= 1; f--) {
        if ((celdas[f - 1] || []).some(function (c) { return c && c.valor !== '' && c.valor !== null; })) return f;
      }
      return 0;
    },
    getLastColumn: function () {
      return celdas.reduce(function (max, linea) { return Math.max(max, linea.length); }, 0);
    },

    getRange: function (fila, col, nf, nc) {
      nf = nf || 1; nc = nc || 1;
      return {
        getValues: function () {
          var salida = [];
          for (var f = 0; f < nf; f++) {
            var linea = [];
            for (var c = 0; c < nc; c++) linea.push(en(fila + f, col + c).valor);
            salida.push(linea);
          }
          return salida;
        },
        setValues: function (valores) {
          for (var f = 0; f < nf; f++) {
            for (var c = 0; c < nc; c++) {
              var destino = en(fila + f, col + c);
              destino.valor = valores[f][c];
              destino.formula = '';     /* escribir un valor borra la fórmula */
            }
          }
          return this;
        },
        setValue: function (v) { en(fila, col).valor = v; return this; },
        getFormula: function () { return en(fila, col).formula; },
        setFormula: function (f) { en(fila, col).formula = f; return this; },
        setValidacion: function (v) { en(fila, col).validacion = v; return this; },
        setFormato: function (v) { en(fila, col).formato = v; return this; },

        copyTo: function (destino, tipo) {
          var salto = destino.fila - fila;
          for (var f = 0; f < nf; f++) {
            for (var c = 0; c < nc; c++) {
              var de = en(fila + f, col + c);
              var a = en(destino.fila + f, destino.col + c);
              if (tipo === 'FORMATO') a.formato = de.formato;
              if (tipo === 'VALIDACION') a.validacion = de.validacion;
              if (tipo === 'FORMULA') {
                a.formula = de.formula ? correrReferencias(de.formula, salto) : '';
                if (de.formula) a.valor = '(calculado)';
                else a.valor = de.valor;
              }
            }
          }
          return this;
        },

        fila: fila, col: col,
        setFontWeight: function () { return this; },
        setBackground: function () { return this; },
        setFontColor: function () { return this; }
      };
    },

    setFrozenRows: function () {}, autoResizeColumns: function () {},

    /* Ayudas para las pruebas, no para el código */
    fila: function (n) { return (celdas[n - 1] || []).map(function (c) { return c.formula || c.valor; }); },
    celdaEn: function (f, c) { return en(f, c); }
  };

  if (encabezados && encabezados.length) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  }
  return hoja;
}

function libroFalso(id, encabezadosPorHoja) {
  var hojas = {};
  var libro = {
    getId: function () { return id; },
    getName: function () { return id; },
    getUrl: function () { return 'https://docs.google.com/…/' + id; },
    getSheetByName: function (n) { return hojas[n] || null; },
    insertSheet: function (n) {
      hojas[n] = hojaFalsa(n, libro, null);
      return hojas[n];
    },
    hojas: hojas
  };
  Object.keys(encabezadosPorHoja || {}).forEach(function (n) {
    hojas[n] = hojaFalsa(n, libro, encabezadosPorHoja[n]);
  });
  return libro;
}

/* Las constantes que Hoja.gs le pide a SpreadsheetApp */
const CopyPasteType = { PASTE_FORMAT: 'FORMATO', PASTE_DATA_VALIDATION: 'VALIDACION', PASTE_FORMULA: 'FORMULA' };

module.exports = { libroFalso, hojaFalsa, CopyPasteType };
