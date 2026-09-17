# eltop.lat — Guía Paso a Paso de Construcción

Este documento es la hoja de ruta completa para construir el MVP de eltop.lat, el leaderboard de pago tipo subasta para LATAM (Brasil, Perú, Colombia, Venezuela, Chile, Argentina). Sigue el orden de las fases — cada una depende de que la anterior esté funcionando.


## Fase 0 — Preparación (antes de escribir código)

1. **Confirmar el dominio**: eltop.lat ya está comprado. Configurar los DNS apuntando a Vercel apenas exista el proyecto (Fase 1, paso 3). 

2. **Crear cuentas necesarias**: 

   - Cuenta en [Supabase](https://supabase.com/) (proyecto nuevo, región más cercana a Brasil/Sudamérica si está disponible). 

   - Cuenta en [Vercel](https://vercel.com/) conectada a tu GitHub. 

   - Cuenta de desarrollador en [Mercado Pago](https://www.mercadopago.com.ar/developers) (credenciales de test y producción). 

   - Cuenta en Stripe con Pix habilitado (para Brasil) — puede quedar para Fase 2 si querés arrancar solo con Mercado Pago. 

   - Cuenta en un proveedor de cripto (NOWPayments o similar) para USDT — puede quedar en Fase 2 y manejarse manualmente al inicio. 

3. **Definir las 3-4 categorías del MVP** (recomendado: SaaS, Cripto, E-commerce/Afiliados, Marketing) con nombre en español y portugués. 

4. **Definir el incremento mínimo de puja** por categoría (ej. $5 USD) y el precio de piso inicial del primer puesto (ej. $20 USD). 


## Fase 1 — Setup del proyecto

1. Crear el repo: 

```
`npx create-next-app@latest eltop-lat --typescript --app --tailwindcd eltop-lat`
```

2. Instalar dependencias: 

```
`npm install @supabase/supabase-js @supabase/ssrnpm install mercadopagonpm install resend`
```

3. Conectar el repo a Vercel (`vercel link` o importar desde el dashboard) y apuntar el dominio eltop.lat al proyecto en Vercel → Settings → Domains. 

4. Crear el proyecto en Supabase y guardar las variables de entorno (`NEXT\_PUBLIC\_SUPABASE\_URL`, `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY`, `SUPABASE\_SERVICE\_ROLE\_KEY`) en `.env.local` y en Vercel (Settings → Environment Variables). 


## Fase 2 — Base de datos (Supabase)

1. Desde el SQL Editor de Supabase, correr las migraciones del schema: tablas `categories`, `listings`, `bids`, `click\_events`, `settings` (ver documento de spec técnico para el SQL completo). 

2. Crear los índices: 

```
`create index on listings (category\_id, rank\_type, position);create index on bids (listing\_id, created\_at desc);create index on click\_events (listing\_id, created\_at);`
```

3. Insertar las categorías iniciales en la tabla `categories` (nombre en ES y PT). 

4. Activar **Row Level Security (RLS)** en todas las tablas: 

   - `listings`: lectura pública, escritura solo desde el backend (service role). 

   - `bids`: lectura pública del feed de actividad, escritura solo desde el backend. 

   - `click\_events`: sin acceso público de lectura, solo inserción vía función RPC. 

5. Crear la función RPC `increment\_click\_count(listing\_id uuid)` para sumar clics de forma atómica. 

6. Habilitar **Supabase Realtime** en la tabla `bids` (para el feed de actividad en vivo — se puede dejar para Fase 5). 


## Fase 3 — Lógica central de la subasta

1. Construir la función de cálculo de precio: dado un `category\_id` y una `position` (o "siguiente puesto libre"), devolver el precio mínimo a pagar = puja actual del ocupante + incremento mínimo de la categoría. 

2. Construir el endpoint interno `POST /api/bids/create`: 

   - Recibe: categoría, nombre, tagline, URL, logo, email, monto ofrecido. 

   - Valida que el monto sea igual o mayor al mínimo requerido en ese momento. 

   - Crea una fila en `bids` con `payment\_status = 'pending'`. 

   - Devuelve el `bid\_id` para iniciar el checkout. 

3. **Regla de oro**: ninguna posición del ranking se actualiza en este paso. Solo se actualiza cuando el pago se confirma vía webhook (Fase 4). 

4. Construir el job que recalcula `position` dentro de cada categoría cada vez que se confirma un pago (ordenar por `current\_bid\_cents desc`). 

5. Manejar la condición de carrera: al confirmar el webhook, usar `select ... for update` sobre la fila del listado objetivo antes de actualizar, para evitar que dos pagos simultáneos otorguen el mismo puesto. 


## Fase 4 — Checkout y pagos

1. Construir la página `/\[categoria\]/reclamar` con el formulario (nombre, tagline, URL, logo, email) y el monto a pagar ya calculado. 

2. Integrar **Mercado Pago Checkout Pro**: 

   - Crear la preferencia de pago desde el backend (`POST /api/checkout/mercadopago`) usando el `bid\_id` como referencia externa. 

   - Redirigir al usuario al checkout hospedado de Mercado Pago. 

3. Crear el webhook `POST /api/webhooks/mercadopago`: 

   - Verifica la notificación con Mercado Pago. 

   - Actualiza `bids.payment\_status = 'paid'`. 

   - Dispara la lógica de recalculo de posiciones (Fase 3, paso 4). 

   - Envía email de confirmación al comprador (vía Resend). 

4. (Fase 2 del roadmap, no bloqueante para el MVP) Integrar Stripe con Pix para Brasil siguiendo el mismo patrón: preferencia → webhook → confirmación. 

5. (Fase 2 del roadmap) Integrar el flujo de USDT para Venezuela — al inicio puede ser manual: el usuario paga a una wallet fija y te avisa por WhatsApp/Telegram, vos confirmás el pago manualmente desde el panel admin. 

6. Probar el flujo completo en modo sandbox/test de Mercado Pago antes de pasar a producción. 


## Fase 5 — Páginas públicas

1. `/` — leaderboard general: trae todas las categorías activas y sus top listados, ordenado por `position`. 

2. `/\[categoria\]` — leaderboard filtrado por categoría, con tabs "Todo el tiempo" / "Hoy". 

3. `/l/\[listing\_id\]` — endpoint de redirección con tracking: 

   - Inserta un `click\_event`. 

   - Llama a `increment\_click\_count`. 

   - Hace `redirect(url\_real, 302)`. 

4. `/actividad` — feed de las últimas pujas (`bids` ordenadas por fecha). Empezar con polling simple cada 10-15 segundos; migrar a Supabase Realtime cuando el tráfico lo justifique. 

5. Diseño: priorizar mobile-first (la mayoría del tráfico LATAM en redes sociales llega desde celular), y mostrar claramente precio en USD + equivalente en moneda local. 


## Fase 6 — Panel de administración

1. Ruta `/admin` protegida (auth simple con Supabase Auth, un solo usuario admin al inicio). 

2. Funciones mínimas: 

   - Ver y aprobar/rechazar listados nuevos (`is\_approved`). 

   - Confirmar manualmente pagos de USDT (mientras no esté automatizado). 

   - Ver métricas básicas: total recaudado, listados activos por categoría, clics totales. 


## Fase 7 — Anti-abuso y moderación

1. Validar la URL enviada contra una blocklist básica de dominios prohibidos antes de aceptar el listado. 

2. Rate-limit por IP/email en el endpoint de creación de pujas (evitar spam de intentos de pago). 

3. Sanitizar el `tagline` y `name` contra HTML/script injection antes de guardar. 

4. Flag `is\_approved = false` por defecto si el volumen de listados es bajo al inicio, para revisar todo manualmente antes de publicar. 


## Fase 8 — Lanzamiento y validación

1. Antes del lanzamiento público, hacer una ronda de **preventa manual** con 15-20 contactos (afiliados, dueños de SaaS chicos, agencias) ofreciéndoles ser "fundadores" del ranking con descuento. 

2. Publicar el sitio con las categorías precargadas (aunque estén vacías, dejar precios de piso visibles). 

3. Anunciar en comunidades de indie hackers/marketers hispanohablantes y brasileñas (X/Twitter, grupos de Telegram, comunidades de Product Hunt en español). 

4. Capturar los primeros testimonios de ROI (clics generados, señales de tráfico) apenas haya compradores — esta prueba social es la pieza clave para que el sitio se vuelva viral, tal como pasó con outbid.lol. 


## Fase 9 — Roadmap post-MVP

- Ranking diario (`rank\_type = 'daily'`) con reset automático vía cron job (Vercel Cron o Supabase Edge Function programada). 

- Automatizar el flujo de USDT (NOWPayments o Binance Pay API) en vez de confirmación manual. 

- Integrar Stripe + Pix para Brasil de forma completamente automática. 

- Migrar el feed de actividad a Supabase Realtime. 

- Agregar más categorías según demanda real observada en los primeros meses. 


## Checklist de orden de implementación

- \[ \] Fase 0 — Cuentas y definiciones iniciales 

- \[ \] Fase 1 — Setup del proyecto (Next.js + Vercel + Supabase) 

- \[ \] Fase 2 — Schema de base de datos + RLS 

- \[ \] Fase 3 — Lógica de la subasta (backend) 

- \[ \] Fase 4 — Checkout con Mercado Pago + webhook 

- \[ \] Fase 5 — Páginas públicas del leaderboard 

- \[ \] Fase 6 — Panel admin básico 

- \[ \] Fase 7 — Anti-abuso y moderación 

- \[ \] Fase 8 — Preventa y lanzamiento 

- \[ \] Fase 9 — Roadmap post-MVP (Pix, USDT automático, daily ranking, realtime) 

