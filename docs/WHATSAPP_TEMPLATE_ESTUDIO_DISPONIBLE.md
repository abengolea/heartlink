# Plantilla WhatsApp: notificas_estudio_medico

Plantilla para notificar al médico cuando un estudio está listo.

## En Meta Business Suite

Nombre de la plantilla: **notificas_estudio_medico**

---

### Cuerpo (Body) recomendado

```
Mensaje de {{1}}: Hola {{2}}, el estudio de {{3}} está disponible. Podés verlo en el siguiente enlace: {{4}}

Este mensaje es informativo. No respondas a este número.
```

---

### Variables (el código ya las envía así)

| Variable | Contenido | Ejemplo |
|----------|------------|---------|
| {{1}} | Nombre de la app | HeartLink |
| {{2}} | Nombre del médico | Santi Nuevo |
| {{3}} | Nombre del paciente | Olivia Bengolea |
| {{4}} | Link al estudio | https://heartlink.../public/study/xxx?token=yyy |

---

### Ejemplo final

> Mensaje de HeartLink: Hola Santi Nuevo, el estudio de Olivia Bengolea está disponible. Podés verlo en el siguiente enlace: https://heartlink--heartlink-f4ftq.us-central1.hosted.app/public/study/xxx?token=yyy
>
> Este mensaje es informativo. No respondas a este número.

---

## Nota

El código usa la plantilla **notificas_estudio_medico** y envía las variables en este orden.
