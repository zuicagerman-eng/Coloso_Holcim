#!/usr/bin/env python3
"""Arma el .zip que se sube a la unidad compartida del área.

Es la copia de Holcim mientras no haya un repositorio corporativo: adentro va
todo lo necesario para volver a montar el programa desde cero, y un LEEME que
dice de cuándo es y qué hacer con él.

    python3 herramientas/empaquetar.py
"""
import datetime
import pathlib
import subprocess
import zipfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
INCLUIR = ['apps-script', 'vista', 'docs', 'pruebas', 'herramientas', 'README.md']
IGNORAR = {'.git', 'node_modules', '__pycache__', '.DS_Store'}


def version_del_codigo():
    """La última confirmación, si el paquete se arma desde el repositorio."""
    try:
        salida = subprocess.run(
            ['git', 'log', '-1', '--format=%h — %ad — %s', '--date=short'],
            cwd=RAIZ, capture_output=True, text=True, timeout=10)
        return salida.stdout.strip() or 'sin registro de versión'
    except (OSError, subprocess.SubprocessError):
        return 'sin registro de versión'


def archivos():
    for nombre in INCLUIR:
        origen = RAIZ / nombre
        if origen.is_file():
            yield origen
        elif origen.is_dir():
            for ruta in sorted(origen.rglob('*')):
                if ruta.is_file() and not (IGNORAR & set(ruta.parts)):
                    yield ruta


def leeme(hoy):
    return f"""COPIA DEL CÓDIGO — Coloso Holcim
Armada el {hoy}
Versión: {version_del_codigo()}

Qué es esto
-----------
Los archivos con los que se vuelve a montar el registro de Empresas y Personas
si se pierde la hoja de cálculo o el script. No es una copia de los datos: los
datos viven en la hoja, no aquí.

Qué hacer con esto
------------------
Nada, mientras todo funcione. El día que haga falta, siga docs/DESPLIEGUE.md:
son cuatro pasos y unos 15 minutos.

Dónde debe estar
----------------
En la unidad compartida del área, no en "Mi unidad" de alguien. Si el dueño de
la carpeta se va de la empresa, esta copia se va con él y no habría servido de
nada. El porqué está en docs/PROGRAMAS.md, en "Dónde vive el código".
"""


def main():
    hoy = datetime.date.today().isoformat()
    destino = RAIZ / f'Coloso-Holcim-{hoy}.zip'

    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as paquete:
        cuantos = 0
        for ruta in archivos():
            paquete.write(ruta, ruta.relative_to(RAIZ))
            cuantos += 1
        paquete.writestr('LEEME-DE-ESTA-COPIA.txt', leeme(hoy))

    print(f'Listo: {destino.name}  ({cuantos + 1} archivos, '
          f'{destino.stat().st_size // 1024} KB)')
    print('Súbalo a la carpeta del área en la unidad compartida.')


if __name__ == '__main__':
    main()
