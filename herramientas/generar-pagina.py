#!/usr/bin/env python3
"""Copia vista/index.html a apps-script/pagina.html, que es lo que sirve
Apps Script. Se mantiene una sola fuente: la vista."""
import pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
vista = (raiz / 'vista' / 'index.html').read_text(encoding='utf-8')
aviso = """<!-- ==================================================================
     GENERADO DESDE vista/index.html — NO EDITAR AQUÍ.
     Para cambiarlo, edite vista/index.html y vuelva a ejecutar:
        python3 herramientas/generar-pagina.py
     ================================================================== -->
"""
destino = raiz / 'apps-script' / 'pagina.html'
destino.write_text(aviso + vista, encoding='utf-8')
print('Generado', destino.relative_to(raiz))
