# Decisión: ¿GitHub o Google Apps Script? — Proyecto Coloso Holcim

## Respuesta corta

**No son alternativas que compitan: resuelven cosas distintas.**

- **Google Apps Script** = *dónde se ejecuta* la solución (formulario web, Hoja de cálculo, envío de correos).
- **GitHub** = *dónde vive y se versiona* el código de esa solución.

Para el requerimiento de la nota (registrar **Empresa** y **Personas**, guardar en un
**Sheet** y **notificar por correo** a los responsables cuando alguien diligencie) la
ejecución debe ser **Google Forms + Apps Script**, y el código debe estar en **GitHub**
y subirse con `clasp`.

```
GitHub (repositorio, ramas, PR, historial)
        │  clasp push
        ▼
Google Forms (Empresa · Personas)  ──►  Google Sheets (EMPRESAS, PERSONAS)
                                              │
                                              └──►  Apps Script + MailApp
                                                    └──►  los correos de CONFIG.NOTIFICAR_A
```

El formulario no se programa: lo pone Google. El código se limita al aviso por correo.

## Árbol de decisión aplicado al caso

| Pregunta | Respuesta en Holcim | Consecuencia |
|---|---|---|
| ¿Los datos deben quedar en un Google Sheet? | Sí (lo pide la nota) | Apps Script es nativo: `SpreadsheetApp`, sin API keys ni OAuth propio |
| ¿Hay que enviar correos corporativos? | Sí, a 2 áreas | `MailApp`/`GmailApp` sale del dominio Holcim, sin SMTP ni SendGrid |
| ¿Hay presupuesto de hosting / servidor? | No | Apps Script: **costo 0**, incluido en Workspace |
| ¿Se requiere aprobación de TI para infraestructura? | Sí, y es lenta | Apps Script vive dentro de Workspace ya aprobado |
| ¿Volumen esperado? | Cientos/mes, no miles/día | Muy por debajo de las cuotas de Apps Script |
| ¿Necesitamos control de versiones, revisión y respaldo del código? | Sí | **GitHub**: ramas, PR, historial, recuperación ante borrado accidental |
| ¿Se necesita login corporativo? | Sí | El Form exige sesión del dominio y guarda quién respondió |

## Comparación directa

| Criterio | Google Apps Script | App propia alojada (Node/React) desplegada desde GitHub |
|---|---|---|
| Costo de infraestructura | $0 | Servidor + dominio + certificado |
| Tiempo a producción | Horas | Semanas (aprobaciones, red, VPN) |
| Acceso al Sheet | Nativo | Requiere Service Account + Google Sheets API + secretos |
| Envío de correo | Nativo (cuota 1.500–2.000/día en Workspace) | Requiere proveedor SMTP y whitelisting |
| Autenticación Holcim | Automática (sesión Google) | Hay que integrar SSO/Azure AD |
| Construir el formulario | Ya existe (Google Forms) | Hay que desarrollarlo y mantenerlo |
| Versionamiento del código | Débil (editor en línea) → **por eso GitHub** | Nativo |
| Pruebas automatizadas / CI | Limitadas | Completas |
| Escalabilidad futura (miles de usuarios, reportería pesada) | Se queda corta | Adecuada |
| Riesgo de "quedar en manos de una persona" | Alto si vive solo en Drive → **mitigado con GitHub** | Bajo |

## Recomendación

1. **Fase 1 (ahora, este repositorio):** Google Forms + Sheet + notificación por correo.
   Código versionado aquí en GitHub, publicado con `clasp push`.
2. **Fase 2 (si el volumen crece o se integra con SAP/Ariba):** migrar la capa de datos a una
   base real. Las reglas de captura viven en `Config.gs` y en las validaciones del propio
   formulario, así que el cambio no arrastra código de interfaz.

## Límite claro de cuándo NO usar Apps Script

Cambiar de plataforma si aparece alguno de estos:
- más de ~1.500 correos por día,
- más de ~50.000 filas activas en el Sheet,
- necesidad de auditoría regulatoria con firma/inmutabilidad,
- integración transaccional en línea con SAP.
