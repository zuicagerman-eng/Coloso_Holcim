# Guía de despliegue (30 minutos)

## Opción A — Manual (sin instalar nada)

1. Cree una hoja de cálculo nueva en Google Drive de Holcim.
   Nómbrela `Registro Empresas y Personas`.
2. Menú **Extensiones → Apps Script**.
3. Borre el `Código.gs` de ejemplo y cree estos archivos con el mismo nombre y contenido
   que en `apps-script/` de este repositorio:
   - `Config.gs`, `Sheets.gs`, `Validators.gs`, `Mailer.gs`, `Code.gs`
   - `ui/index.html`, `ui/estilos.html`, `ui/complemento.html`
   - `mail/notificacion.html`
   > En el editor, los archivos HTML se crean con **+ → HTML** y se nombran
   > literalmente `ui/index`, `ui/estilos`, `ui/complemento`, `mail/notificacion`.
4. En **Configuración del proyecto**, marque *Mostrar el archivo de manifiesto
   `appsscript.json`* y pegue el contenido de `apps-script/appsscript.json`.
5. Edite `Config.gs` y ponga los **dos correos reales** en `NOTIFICAR_A`.
6. Ejecute la función `inicializarLibro` una vez y acepte los permisos.
   Se crean las hojas `EMPRESAS`, `PERSONAS`, `COMPLEMENTOS`, `LOG`.
7. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Usuarios de holcim.com**
8. Copie la URL `/exec` y compártala con quien registra.
9. Vuelva a la hoja y use el menú **Registro Holcim → Enviar correo de prueba**
   para verificar que los dos correos llegan.

## Opción B — Desde este repositorio con `clasp` (recomendada)

```bash
npm install -g @google/clasp
clasp login

# Cree el proyecto ligado a una hoja nueva
clasp create --type sheets --title "Registro Empresas y Personas — Holcim" --rootDir apps-script

# O apunte a un script existente
cp .clasp.json.example .clasp.json   # y pegue el scriptId

clasp push
clasp deploy --description "v1 registro empresas y personas"
clasp open
```

Después de `clasp push`, repita los pasos 5 a 9 de la opción A (correos, permisos y publicación).

## Cambiar los correos notificados

Solo se toca `Config.gs`:

```js
NOTIFICAR_A: ['compras@holcim.com', 'hse@holcim.com'],
```

y luego `clasp push` + **Implementar → Administrar implementaciones → Editar → Nueva versión**.

## Verificación rápida

| Prueba | Resultado esperado |
|---|---|
| Registrar empresa con NIT `900123456-1` | Error: "Escriba el NIT SIN el dígito de verificación" |
| Registrar la misma empresa dos veces | Error de duplicado por NIT |
| Registrar persona sin empresa previa | Error: "La empresa … no está registrada" |
| Registrar empresa válida | Fila en `EMPRESAS` + correo a los dos destinatarios con botón "Diligenciar información" |
| Abrir el enlace del correo y guardar | Fila en `COMPLEMENTOS` y estado cambia a "En diligenciamiento" |
| Diligenciar todas las áreas | Estado cambia a "Completo" |

## Cuotas relevantes (Google Workspace)

- Correos por día: 1.500 (cuenta Workspace) / 100 (cuenta gratuita).
- Tiempo de ejecución por llamada: 6 minutos.
- Filas por hoja: 10 millones de celdas por libro (muy por encima del uso previsto).
