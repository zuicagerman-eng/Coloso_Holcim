# Decisión: ¿GitHub o Google Apps Script? — Proyecto Coloso Holcim

## Respuesta corta

**No son alternativas que compitan: resuelven cosas distintas.**

- **Google Apps Script** = *dónde se ejecuta* la solución (formulario web, Hoja de cálculo, envío de correos).
- **GitHub** = *dónde vive y se versiona* el código de esa solución.

Para el requerimiento de la nota (registrar **Empresa** y **Personas**, guardar en un
**Sheet** y **notificar por correo a dos destinatarios** para que otras áreas de Holcim
diligencien) la ejecución debe ser **Google Apps Script**, y el código debe estar en
**GitHub** y subirse con `clasp`.

```
GitHub (repositorio, ramas, PR, historial)
        │  clasp push  /  GitHub Actions
        ▼
Google Apps Script (Web App)  ──►  Google Sheets (EMPRESAS, PERSONAS, COMPLEMENTOS)
        │
        └──►  MailApp  ──►  correo1@holcim.com + correo2@holcim.com  (con link para diligenciar)
```

## Árbol de decisión aplicado al caso

| Pregunta | Respuesta en Holcim | Consecuencia |
|---|---|---|
| ¿Los datos deben quedar en un Google Sheet? | Sí (lo pide la nota) | Apps Script es nativo: `SpreadsheetApp`, sin API keys ni OAuth propio |
| ¿Hay que enviar correos corporativos? | Sí, a 2 áreas | `MailApp`/`GmailApp` sale del dominio Holcim, sin SMTP ni SendGrid |
| ¿Hay presupuesto de hosting / servidor? | No | Apps Script: **costo 0**, incluido en Workspace |
| ¿Se requiere aprobación de TI para infraestructura? | Sí, y es lenta | Apps Script vive dentro de Workspace ya aprobado |
| ¿Volumen esperado? | Cientos/mes, no miles/día | Muy por debajo de las cuotas de Apps Script |
| ¿Necesitamos control de versiones, revisión y respaldo del código? | Sí | **GitHub**: ramas, PR, historial, recuperación ante borrado accidental |
| ¿Se necesita login corporativo? | Sí | Web App con acceso "Usuarios de holcim.com" (Google resuelve la identidad) |

## Comparación directa

| Criterio | Google Apps Script | App propia alojada (Node/React) desplegada desde GitHub |
|---|---|---|
| Costo de infraestructura | $0 | Servidor + dominio + certificado |
| Tiempo a producción | Horas | Semanas (aprobaciones, red, VPN) |
| Acceso al Sheet | Nativo | Requiere Service Account + Google Sheets API + secretos |
| Envío de correo | Nativo (cuota 1.500–2.000/día en Workspace) | Requiere proveedor SMTP y whitelisting |
| Autenticación Holcim | Automática (sesión Google) | Hay que integrar SSO/Azure AD |
| Versionamiento del código | Débil (editor en línea) → **por eso GitHub** | Nativo |
| Pruebas automatizadas / CI | Limitadas | Completas |
| Escalabilidad futura (miles de usuarios, reportería pesada) | Se queda corta | Adecuada |
| Riesgo de "quedar en manos de una persona" | Alto si vive solo en Drive → **mitigado con GitHub** | Bajo |

## Recomendación

1. **Fase 1 (ahora, este repositorio):** Web App en Apps Script + Sheet + notificación a 2 correos.
   Código versionado aquí en GitHub, publicado con `clasp push`.
2. **Fase 2 (si el volumen crece o se integra con SAP/Ariba):** migrar la capa de datos a una
   base real. La lógica de validación (NIT sin dígito de verificación, cédula, correo) ya queda
   aislada en `Validators.gs` y se puede portar sin reescribir todo.

## Límite claro de cuándo NO usar Apps Script

Cambiar de plataforma si aparece alguno de estos:
- más de ~1.500 correos por día,
- más de ~50.000 filas activas en el Sheet,
- necesidad de auditoría regulatoria con firma/inmutabilidad,
- integración transaccional en línea con SAP.
