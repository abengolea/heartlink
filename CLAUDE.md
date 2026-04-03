# HeartLink — contexto para asistentes

## Design Context

### Users

- **Quién:** médicos operadores, médicos solicitantes / solicitantes y administradores de una plataforma B2B de gestión de **estudios cardiológicos** (pacientes, estudios, vídeo/PDF, WhatsApp, suscripciones).
- **Contexto:** uso en consultorio u oficina; necesidad de claridad, rapidez y poca fricción; mensajes críticos (urgencias, acceso bloqueado por suscripción) deben destacarse sin fatiga visual.
- **Job to be done:** registrar y consultar pacientes y estudios, compartir enlaces públicos, colaborar entre roles, pagar/gestionar suscripción cuando aplica.

### Brand Personality

- **Inferido del producto:** profesional, sanitario, confiable; tono directo en español en la mayoría de la UI.
- **Emociones deseadas:** confianza y control (datos sensibles); la marca visual actual es funcional (shadcn + azul/cyan) más que distintiva.

### Aesthetic Direction

- **Stack visual:** Tailwind + variables HSL (shadcn), componentes Radix, tipografía **Inter** vía Google Fonts; tema claro por defecto; tokens `.dark` definidos pero sin flujo claro de conmutación en el layout raíz revisado.
- **Anti-referencia implícita:** evitar aspecto “genérico AI” (gradientes decorativos, glassmorphism gratuito, rejilla de tarjetas idénticas sin jerarquía); el dashboard actual muestra algo de patrón “métricas en tarjetas” a vigilar.

### Design Principles

1. **Coherencia idiomática:** UI principal en español; metadatos (`lang`), pie de página y mensajes `sr-only` alineados con el mismo idioma donde sea posible.
2. **Tokens antes que hex sueltos:** componentes de producto deberían usar `destructive`, `muted`, etc.; banners o alertas con `red-50`/`red-600` rompen consistencia en tema oscuro y tematización.
3. **Jerarquía sin ruido:** tarjetas con propósito (agrupar acciones relacionadas); evitar anidar contenedores solo por hábito.
4. **Accesibilidad operativa:** contraste de `muted-foreground`, objetivos táctiles ≥44px en móvil, foco visible en enlaces personalizados del sidebar, `prefers-reduced-motion` donde haya animación no esencial.
5. **Marca tipográfica:** si se busca diferenciación, planificar una pareja display + cuerpo acorde a salud/profesional (sin depender solo de Inter).

### Pendiente (validar con el equipo)

- Personalidad de marca en 3 palabras, referencias visuales explícitas y anti-referencias.
- Requisito WCAG objetivo (AA vs AAA) y necesidades específicas de usuarios.
- Si dark mode es requisito de producto o solo técnico.
