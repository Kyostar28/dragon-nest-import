## Resumen
Implementar un sistema RPG completo: breeding (dragones + nidos), stats por elemento/rareza, niveles, Mundo con Ciudad y Bosque (20 stages × 3 mobs por turnos estilo Dofus), codex con bloqueo visual, hechizos con costo de PA.

## 1. Base de datos (migración)

**Tablas nuevas:**
- `dragon_elements` (enum): fire, water, earth, air, light, dark, etc.
- Añadir a `dragons_catalog`: `element`, `base_hp`, `base_ap`, `base_defense`, `base_crit`
- Añadir a `user_dragons`: `level int default 1`, `xp int default 0`, `current_hp int`
- `dragon_spells`: id, catalog_id, name, ap_cost, damage, effect, min_level
- `world_zones`: id, slug (ciudad/bosque), name, type (safe/pve)
- `world_stages`: id, zone_id, stage_number (1-20), mob_pool jsonb, is_boss
- `mobs`: id, name, element, hp, ap, defense, crit, level, sprite_key, is_boss
- `user_progress`: user_id, zone_id, max_stage_unlocked
- `battle_sessions`: id, user_id, stage_id, dragon_id, current_mob_index, turn, state jsonb, status

**RPC functions (server-side, security definer):**
- `breed_dragons(d1_id, d2_id)` → valida misma especie/rareza común, borra ambos, crea nuevo poco común
- `breed_nests(n1_id, n2_id)` → igual lógica
- `start_battle(stage_id, dragon_id)` → crea session
- `battle_action(session_id, action_type, spell_id?)` → procesa turno player + IA mob
- `end_turn(session_id)` → cede turno al mob

## 2. Frontend

**Lib:**
- `src/lib/elements.ts`: definición elementos + colores
- `src/lib/stats.ts`: cálculo de stats `(base + level multiplier) × rarity multiplier`
- `src/lib/spells.ts`: catálogo inicial de hechizos por elemento

**Rutas:**
- `/breed` → conecta con RPC, muestra dragones agrupados por especie+rareza, botón fusionar cuando hay 2
- `/nests` (o sub-tab en /farm) → mismo flujo para nidos
- `/codex` → marca con `grayscale opacity-40` los que el usuario no posee (consulta `user_dragons`)
- `/world` → grid con Ciudad (segura) + Bosque (PvE) tipo screenshot 2
- `/world/forest` → lista de 20 stages, bloqueados secuencialmente
- `/world/forest/$stage` → selector de dragón → arena de combate (UI tipo screenshot 1)

**Componentes:**
- `BattleArena`: HP/AP bars, log, botones Atacar + hechizos, timer 30s, countdown 3s entre mobs
- `DragonStatsPanel`: muestra HP/AP/DEF/CRIT/level
- `BreedPanel`: par seleccionado + preview resultado

## 3. Lógica de combate
- Turnos: jugador 30s (auto end-turn al expirar), luego mob actúa.
- Acciones consumen AP, refrescan al inicio del turno.
- Ataque básico: gratis o 2 AP, daño = atk - def, crit ×2.
- Hechizos por elemento desbloqueados por nivel.
- Al morir mob: mensaje + countdown 3s → siguiente mob.
- Stage 1-20 mob 3 = elite boss (mob con flag `is_boss`, stats ×3).
- Victoria de stage → desbloquea siguiente, otorga XP al dragón.

## Detalles técnicos

**Stats por rareza** (multiplicador): common 1.0, uncommon 1.3, rare 1.7, epic 2.2, legendary 3.0
**XP curve**: `level^2 × 100`
**Mobs del bosque**: Lobo, Oso, Jabalí, León, Bandido, Sombra (boss elite final)
**Combat timer**: `setInterval` cliente + validación servidor por timestamp en `battle_sessions.turn_started_at`

## Preguntas antes de empezar
1. ¿Confirmas crear las nuevas tablas listadas? (es una migración grande)
2. ¿El breeding requiere coste en ETC/DP además de los 2 dragones?
3. ¿Los niveles del dragón son ilimitados o cap (ej. 50)?

## Alcance / orden de implementación
Por tamaño, sugiero entregar en 2 PRs:
**PR-A (esta vuelta):** migración DB + breed dragones + breed nidos + codex gris + stats visibles + ruta /world placeholder
**PR-B (siguiente):** sistema de combate completo + 20 stages + boss

¿Procedo con PR-A primero o intento todo en una sola pasada?
