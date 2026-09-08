# Coloso Holcim — Registro de Empresas y Personas

Aplicación web para registrar **empresas** y **personas**, almacenar todo en un
**Google Sheet** y **notificar por correo a dos áreas de Holcim** con un enlace
para que ellas diligencien la información que les corresponde.

## Decisión de plataforma

**Google Apps Script para ejecutar, GitHub para versionar.** No compiten:
Apps Script es donde corre la solución (Sheet y correo nativos, costo cero,
sin infraestructura que aprobar); GitHub es donde vive el código con historial,
ramas y revisión. El análisis completo, con el árbol de decisión y el límite de
cuándo migrar a otra plataforma, está en
[`docs/DECISION-GITHUB-VS-APPS-SCRIPT.md`](docs/DECISION-GITHUB-VS-APPS-SCRIPT.md).

## Modelo de datos (el de la nota)

**Empresa**
| Campo | Regla |
|---|---|
| NIT | 8–10 dígitos, **sin dígito de verificación** (el DV se calcula y se guarda aparte) |
| Nombre | obligatorio |
| Correo | formato válido |
| Contacto | nombre y teléfono |

**Persona**
| Campo | Regla |
|---|---|
| Nombres / Apellidos | obligatorios |
| Cédula | 6–10 dígitos, única |
| Correo | formato válido |
| Empresa | debe existir previamente (se selecciona por NIT) |

## Flujo

```
Formulario web (Holcim)
   │
   ├─► Validación (NIT sin DV, cédula, correo, duplicados)
   ├─► Google Sheet: EMPRESAS / PERSONAS
   └─► Correo a los DOS destinatarios de CONFIG.NOTIFICAR_A
           │
           └─► botón "Diligenciar información" (enlace con token único)
                   │
                   └─► formulario por área → hoja COMPLEMENTOS
                           └─► estado: Pendiente → En diligenciamiento → Completo
```

## Estructura

```
apps-script/
  Config.gs             correos notificados, áreas, hojas y encabezados
  Code.gs               doGet + casos de uso (registrarEmpresa, registrarPersona, guardarComplemento)
  Sheets.gs             única capa que toca SpreadsheetApp
  Validators.gs         NIT/DV DIAN, cédula, correo, IDs y tokens
  Mailer.gs             notificación a los dos correos + acuse al registrado
  ui/index.html         formulario Empresa / Personas
  ui/complemento.html   formulario para las otras áreas
  ui/estilos.html       identidad visual (variables CSS)
  mail/notificacion.html plantilla del correo
docs/
  DECISION-GITHUB-VS-APPS-SCRIPT.md
  DESPLIEGUE.md
```

## Puesta en marcha

Resumen: cree la hoja → Extensiones → Apps Script → suba estos archivos
(o `clasp push`) → ponga los dos correos en `Config.gs` → ejecute
`inicializarLibro` → publique como Web App para el dominio Holcim.
Paso a paso y pruebas de verificación en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

## Personalización

| Qué | Dónde |
|---|---|
| Los dos correos notificados | `Config.gs → NOTIFICAR_A` |
| Áreas que diligencian | `Config.gs → AREAS` |
| Colores / marca | `ui/estilos.html` (variables `--hlc-*`) y el verde `#00A758` de `mail/notificacion.html` |
| Campos nuevos | `Config.gs → ENCABEZADOS` + validación en `Validators.gs` + campo en `ui/index.html` |

Los colores parten del verde corporativo `#00A758`; si Comunicaciones entrega el
manual de marca vigente, se reemplazan solo las variables CSS.
