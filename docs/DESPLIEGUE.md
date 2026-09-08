# Puesta en marcha

## Opción A — Manual (sin instalar nada)

1. Cree una hoja de cálculo nueva en el Drive de Holcim y nómbrela
   `Registro Empresas y Personas`.
2. Menú **Extensiones → Apps Script**.
3. Borre el `Código.gs` de ejemplo y cree tres archivos con el mismo nombre y
   contenido que en `apps-script/`: `Config.gs`, `Instalar.gs`, `Notificaciones.gs`.
4. Cree un archivo **HTML** llamado literalmente `mail/notificacion` con el
   contenido de `apps-script/mail/notificacion.html`.
5. En **Configuración del proyecto**, marque *Mostrar el archivo de manifiesto
   `appsscript.json`* y pegue el contenido de `apps-script/appsscript.json`.
6. En `Config.gs` escriba los correos reales en `NOTIFICAR_A`.
7. Seleccione la función **`instalar`** y ejecútela. Acepte los permisos
   (Google pedirá acceso a Formularios, Hojas de cálculo y envío de correo).
8. Copie los dos enlaces que aparecen al final y compártalos con quien
   deba diligenciar.

Después de instalar, la hoja tiene un menú **Registro Holcim** con
*Ver enlaces de los formularios*, *Actualizar lista de empresas* y
*Enviar correo de prueba*.

## Opción B — Desde este repositorio con `clasp`

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Registro Empresas y Personas — Holcim" --rootDir apps-script
clasp push
clasp open
```

Luego siga desde el paso 6 de la opción A.

## Verificación

| Prueba | Resultado esperado |
|---|---|
| Escribir `900123456-1` en el NIT del formulario | El formulario no deja enviar: "entre 8 y 10 dígitos, sin el dígito de verificación" |
| Escribir una cédula de 3 dígitos | El formulario no deja enviar |
| Enviar el formulario de Empresa | Fila nueva en la hoja `EMPRESAS`, con el DV calculado, y correo a los destinatarios |
| Abrir el formulario de Personas después | La empresa recién creada aparece en la lista desplegable |
| Menú **Registro Holcim → Enviar correo de prueba** | Llega el correo de muestra a los destinatarios |

## Detalles que conviene conocer

- **Quién diligenció** queda guardado porque los formularios usan
  `setCollectEmail(true)`. Con `SOLO_DOMINIO_HOLCIM: true` además exigen sesión
  del dominio, así nadie de afuera responde.
- **La lista de empresas** del formulario de personas se refresca sola al
  registrar una empresa nueva. Si alguna vez se desincroniza, use el menú
  *Actualizar lista de empresas*.
- **Si cambia los textos de las preguntas** en `CONFIG.PREGUNTAS`, hay que
  volver a ejecutar `instalar()` (crea formularios nuevos) o editar los títulos
  a mano en los formularios existentes.
- **Cuotas de Google Workspace**: 1.500 correos al día (100 en cuentas
  gratuitas). Muy por encima del uso previsto.
- **Si falla el envío**, el script le manda el error al dueño del script en vez
  de perderlo en silencio.
