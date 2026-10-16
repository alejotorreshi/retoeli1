---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 08
subsystem: ui
tags: [react, vite, css-tokens, branding, fonts, woff2, bun-test, happy-dom]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-07 feature structure (encabezado, acceso, compartido), W12 widened to every stylesheet, W22/W23 and CODIGOS_DEL_FRONT"
provides:
  - "web/public/marca (official logo and favicon) and web/public/fuentes (Outfit 600, Montserrat 400/600 WOFF2 and both OFL texts), vendored and verified"
  - "marca.constants.ts: RUTA_LOGO, RUTA_FAVICON, ANCHO_LOGO, ALTO_LOGO, VARIANTE_LOGO, FUENTES_AUTOALOJADAS, LICENCIAS_DE_FUENTES, MARCADOR_TITULO, NOMBRE_PLUGIN_TITULO, ENTIDADES_HTML"
  - "titulo-del-documento Vite plugin (escaparHtml and insertarTituloDelDocumento exported from web/vite.config.ts)"
  - "LogoMarca in compartido/logo-marca, used by the header, the access screen and the loading screen"
  - "Brand tokens (marca, neon, acento, borde-control, deshabilitado, sombra, encabezado-punto, fuente-titulos, radio-pildora, foco-color) and the readjusted state colors"
  - "Teal header, teal access and loading screens, pill controls and Outfit titles across the modules"
  - "W8 also scans web/index.html"
affects: [05-09]

actuals:
  tokens: 16500
  tasks: 3
  commits: 4
plan_head_before: 6bb7311568411948f35e5e473c4ed11f94a25a7f
plan_head_after: 40c4c293c3a3c10f39ac20590e4924e2e10f021d

tech-stack:
  added: []
  patterns:
    - "Static brand assets live in web/public and are named by marca.constants.ts in TS and by absolute /marca and /fuentes URLs in CSS and index.html"
    - "Build-time HTML text comes from strings.ts through a marker and a Vite transformIndexHtml plugin whose transform is exported so a bun test can apply it to the real index.html"
    - "A surface overrides --foco-color locally (neon on teal, acento inside the white access card); the global :focus-visible reads --foco-color directly so the override takes effect"
    - "Button states: primary, secondary, destructive and chip state blocks with hover only inside @media (hover: hover) and transitions only on color, background-color and border-color"

key-files:
  created:
    - web/public/marca/periferia-it-group.webp
    - web/public/marca/favicon.jpg
    - web/public/fuentes/outfit-latin-600.woff2
    - web/public/fuentes/montserrat-latin-400.woff2
    - web/public/fuentes/montserrat-latin-600.woff2
    - web/public/fuentes/OFL-Outfit.txt
    - web/public/fuentes/OFL-Montserrat.txt
    - web/src/config/constants/marca.constants.ts
    - web/src/compartido/logo-marca/logo-marca.tsx
    - web/src/compartido/logo-marca/logo-marca.module.css
    - tests/web/marca.test.ts
  modified:
    - .gitattributes
    - web/index.html
    - web/vite.config.ts
    - web/src/types/ui.type.ts
    - web/src/styles/tokens.css
    - web/src/styles/global.css
    - web/src/features/encabezado/encabezado/encabezado.tsx and encabezado.module.css
    - web/src/features/encabezado/aviso-modelo/aviso-modelo.module.css
    - web/src/features/acceso/pantalla-acceso/pantalla-acceso.tsx and .module.css
    - web/src/features/acceso/pantalla-carga/pantalla-carga.tsx and .module.css
    - twelve module CSS files (compositor, acciones-rapidas, linea-de-tiempo, estado-vacio, tarjeta-confirmacion, panel-casos, bloque-caso, tarjeta-resultado, lista-archivos, dialogo-vista-previa, aviso-disco-efimero, dialogo-nueva-sesion)
    - tests/http/estatico.test.ts
    - tests/arquitectura-web.test.ts
    - tests/web/dom/app.test.tsx
    - tests/web/dom/app-acceso.test.tsx
    - docs/convenciones.md, docs/estructura.md, SOLUCION.md, .claude/CLAUDE.md

key-decisions:
  - "The plugin name, the title marker and the HTML entities live in marca.constants.ts, so the test and vite.config.ts share them instead of repeating literals"
  - "vite.config.ts exports escaparHtml and insertarTituloDelDocumento; the test checks that the plugin's transformIndexHtml is that exact function and applies it to the real index.html, which avoids calling a Vite hook with a fake this context"
  - "The global :focus-visible uses var(--foco-ancho) solid var(--foco-color) directly, because --foco is computed at :root and would ignore a local --foco-color override"
  - "--fuente-sistema holds the system stack once, and --fuente-base and --fuente-titulos prepend Montserrat and Outfit to it"
  - "The empty-state title takes Outfit now; its layout and the case cards stay for 05-09"
  - "The header .marca block no longer wraps, so the logo, divider and title stay on line 1; the narrow fit at 320 px is an eli-qa backstop"

patterns-established:
  - "Brand assets: download each file once into its own scratchpad directory, verify it with file and sips, record its sha256, copy it into web/public and lock its magic bytes in a test"

requirements-completed: [FE-05, FE-03, FE-04]

coverage:
  - id: D1
    description: "The official logo, favicon, three WOFF2 fonts and two OFL files are vendored under web/public, with the right magic bytes, and every /marca and /fuentes URL in index.html, global.css and marca.constants.ts exists"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "tests/web/marca.test.ts#activos de marca autoalojados en web/public"
        status: pass
    human_judgment: false
  - id: D2
    description: "No absolute http(s) URL appears in web/index.html or web/src, so there is no runtime request to Google, the company's site or a CDN"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "tests/web/marca.test.ts#ni index.html ni web/src cargan nada de un dominio externo"
        status: pass
    human_judgment: false
  - id: D3
    description: "The document title is written at build time from TEXTO_APP.tituloDocumento, escaped, and the favicon is /marca/favicon.jpg"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "tests/web/marca.test.ts#el título del documento se escribe en el build"
        status: pass
      - kind: other
        ref: "bun run build:web && grep -c 'Periferia IT Group</title>' web/dist/index.html (prints 1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "woff2, webp and jpg are served with font/woff2, image/webp and image/jpeg and status 200 without the access cookie"
    requirement: FE-05
    verification:
      - kind: integration
        ref: "tests/http/estatico.test.ts#/fuentes/montserrat-latin-400.woff2 se sirve como font/woff2 sin código de acceso"
        status: pass
    human_judgment: false
  - id: D5
    description: "The header shows LogoMarca before the h1 with no subtitle text, and the access screen shows the logo and the app name above the card heading"
    requirement: FE-05
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#el encabezado muestra el logo de Periferia IT Group antes del título de la app"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app-acceso.test.tsx#la pantalla de acceso muestra el logo y el nombre de la app sobre la tarjeta"
        status: pass
    human_judgment: false
  - id: D6
    description: "Brand palette, readjusted states, self-hosted fonts, teal header, access and loading screens, pill controls and Outfit titles with no loose CSS value"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W12: todo CSS de web/src salvo tokens.css usa tokens para colores, tamaños, unidades y porcentajes"
        status: pass
    human_judgment: true
    rationale: "Colors, focus rings, pill shapes, font rendering and the narrow header fit can only be judged in a browser (eli-qa backstops in the UI-SPEC)"
  - id: D7
    description: "W8 scans web/index.html text and accepts only the title marker; the docs and CLAUDE.md describe web/public, LogoMarca and the trademark and OFL note"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W8: reporta texto legible escrito a mano en index.html y acepta el marcador del título"
        status: pass
      - kind: unit
        ref: "tests/docs/solucion.test.ts"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 08: Periferia brand identity Summary

**The chat now carries Periferia IT Group's identity:**
- The official logo sits on a teal header and on the teal access and loading screens.
- The favicon is the official one, and the document title is real and written at build time.
- Outfit and Montserrat are self-hosted.
- The brand palette uses neon only on teal, controls are pills, and the state colors are readjusted.

**Everything ships as static files in `web/public`. No package was added, and nothing is requested from a third party at runtime.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-16T19:13:33Z
- **Completed:** 2026-10-16T19:25:00Z
- **Tasks:** 3
- **Files modified:** 44

## Asset Evidence

Each file was downloaded once into its own empty scratchpad directory and checked with `file`, `sips` and `shasum -a 256`. Then it was copied into `web/public`.

| File | Source | `file` output | Size | sha256 |
|------|--------|---------------|------|--------|
| `marca/periferia-it-group.webp` | periferiaitgroup.com/assets/img/periferia-it-group-1.webp | RIFF (little-endian) data, Web/P image (248 x 62 per `sips`) | 1592 | `04e6048f479faba34bd25d55d59f3726c30968f333bbbad3640d94ef061b8a0d` |
| `marca/favicon.jpg` | periferiaitgroup.com/assets/img/favicon-3.jpg | JPEG image data, Exif standard, baseline, precision 8, 512x512, components 3 | 13900 | `9cd66defd05ee083f484456ba09d56e5abda4976bf6c22cbf8b7199bce0c5e95` |
| `fuentes/outfit-latin-600.woff2` | jsDelivr Fontsource outfit latin-600-normal | Web Open Font Format (Version 2), TrueType, length 14140, version 1.0 | 14140 | `8cfe15c2c6de6ef8efff3eedbd52a383ac9ef23d6c23f6cd9f9b838f5f37dc36` |
| `fuentes/montserrat-latin-400.woff2` | jsDelivr Fontsource montserrat latin-400-normal | Web Open Font Format (Version 2), TrueType, length 18780, version 1.0 | 18780 | `e66bcd2761ab6924b25ce70dafe10e57a39193c4fea1516730bd9cb5240af6c8` |
| `fuentes/montserrat-latin-600.woff2` | jsDelivr Fontsource montserrat latin-600-normal | Web Open Font Format (Version 2), TrueType, length 18688, version 1.0 | 18688 | `d857325c360f7128b347ca924c1974967aaa886ba47dad22e4042d6c38b26a83` |
| `fuentes/OFL-Outfit.txt` | github google/fonts ofl/outfit/OFL.txt | ASCII text | 4389 | `c676351bf8576b9aba743cd5eaa8c0e7ee0d51f805d720447b4df4ddb6a2e416` |
| `fuentes/OFL-Montserrat.txt` | github google/fonts ofl/montserrat/OFL.txt | ASCII text | 4400 | `8b7141c03fa4f8d44e6345d5d4931709290f0f67875e452e95ac1fd3a027802e` |

The fonts are separate static files, one per weight, so Pitfall 8 (one variable file behind two names) does not apply. `.gitattributes` marks `*.woff2`, `*.webp` and `*.jpg` as binary.

## Accomplishments

- **Assets and title:**
  - The logo, favicon, fonts and licenses are vendored under `web/public`.
  - `index.html` sets the favicon and apple-touch-icon, preloads Montserrat 400 and Outfit 600, sets the teal `theme-color` and carries `%TITULO_DOCUMENTO%`.
  - The `titulo-del-documento` plugin writes `Registro como proveedor · Periferia IT Group`, with `&` and `<` escaped, into `web/dist/index.html`. The asset folders are present in `web/dist`.
- **LogoMarca.** The `img` keeps `width="248" height="62"` to reserve its box. Its alt is `TEXTO_APP.subtitulo`, and its height comes from the variant token (32, 24 or 40 px). The `VARIANTE_LOGO` members map to classes through a record keyed by those members (W22).
- **Tokens and fonts:**
  - `tokens.css` carries the UI-SPEC palette, including the jade success (`#0B6B5A`), the slate info (`#2E5A88`) and the header dots.
  - It also defines `--fuente-base` and `--fuente-titulos` over a shared system stack, `--titulo-fuente`, `--display-fuente`, `--radio-pildora`, `--foco-color` and `--foco-color-marca`.
  - `global.css` has exactly three `@font-face` rules with `font-display: swap` and the latin `unicode-range`.
- **Header.**
  - The header is teal with no bottom border. It shows the 32 px logo (24 px when narrow), the 1 x 24 neon divider and the Outfit h1 (16 px when narrow).
  - The date and model chips use `--marca-elevada`, and the model dot uses the `--encabezado-punto-*` colors.
  - Nueva sesión is a pill with a neon border. Focus inside the header is neon.
- **Access and loading screens:**
  - Both sit on teal with the 40 px logo.
  - The access screen shows the app name as an Outfit `p` above a white card, which has no border, the green focus, the 8 px field with `--borde-control`, the secondary pill Mostrar código and the full-width primary pill Entrar al agente.
  - `PantallaCarga` now shows "Cargando el agente…" visibly, in white with `role="status"`.
- **Modules:**
  - Every button and button-like link is a pill with the UI-SPEC states, and hover applies only under `(hover: hover)`.
  - Titles use Outfit. The Ver and Descargar links underline only on hover or press.
- **Docs:** SOLUCION.md §6 adds a trade-off bullet with the trademark and OFL note. `docs/estructura.md` adds a `web/public` row and describes LogoMarca, and CLAUDE.md adds the self-hosting bullet.

## Task Commits

1. **Task 1 (tracer): assets, title plugin and header logo.**
   - RED `6b28ed1` (test)
   - GREEN `a605ad1` (feat)
2. **Task 2: brand tokens, fonts, teal header, access and loading.** `cfa1aa3` (feat)
3. **Task 3: pill controls, Outfit titles, trademark and license note.** `40c4c29` (feat)

## TDD Evidence

- **RED (Task 1):**
  - Command: `bun test tests/web/dom/app.test.tsx tests/web/marca.test.ts --reporter=junit`, with exit 1.
  - The report was saved to `.local/tdd/05-08-red1.xml`, which is gitignored.
  - `check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`): 19 tests, 11 pass and 8 fail.
  - Target: "el encabezado muestra el logo de Periferia IT Group antes del título de la app". It failed on the planned assertion: the banner had no `img` named Periferia IT Group, because the subtitle was still a text paragraph.
  - The seven `marca.test.ts` assertions failed for the planned reasons: missing files, no marker and no plugin.
  - Semantic assessment: valid.
  - `marca.constants.ts` went into the RED commit as contract scaffolding (constants only, no behavior). Without it the RED tests would fail with a load error, which does not count as RED.
- **GREEN:** after `a605ad1`, the Task 1 verify passed: 118 pass, `bun run check` green, the build ran, both dist folders exist and the title grep printed 1.
- **Tracer gate (auto mode):** the Task 1 verify passed again on the committed code before Task 2 started.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The RED commit includes `marca.constants.ts`**
- **Found during:** Task 1, RED
- **Issue:** `tests/web/marca.test.ts` and the W8 test import the marker and routes. Without the constants file, the RED tests would fail with a load error, and a load error is not valid RED evidence.
- **Fix:** The constants-only file went into the RED commit. Behavior (assets, plugin, LogoMarca) went into GREEN.
- **Committed in:** `6b28ed1`

**2. [Acceptance criterion wording] `grep -c "titulo-del-documento" web/vite.config.ts` prints 0**
- **Issue:** The plugin name is `NOMBRE_PLUGIN_TITULO` in `marca.constants.ts`, so the test and the config share one constant. That is the project rule against scattered magic values.
- **Outcome:** `grep -c "titulo-del-documento" web/src/config/constants/marca.constants.ts` prints 1. The test finds the plugin in `web/vite.config.ts` by that name, so the intent is met.

**3. [Plan shape] How the test applies the plugin**
- **Issue:** The test does not call the Vite hook directly.
- **What changed:** `web/vite.config.ts` exports `insertarTituloDelDocumento` and `escaparHtml`. The test checks that the named plugin's `transformIndexHtml` is that exact function, then applies it to the real `index.html`. This avoids typing a fake Vite `this` context, and the result is the same.

**4. [Scope note] `aviso.module.css` was not changed**
- **Issue:** It has no button of its own. The notice actions are `.accionAviso` in `linea-de-tiempo.module.css`, which became a secondary pill.

**5. [Rule 2 - Consistency] The empty-state title and the access field label**
- **Issue:** The empty-state title already takes Outfit (D-107), but its layout stays for 05-09.
- **Change:** The Mostrar código pill gained weight 600, the weight the UI-SPEC sets for buttons.

---

**Total deviations:** 5 (1 blocking scaffolding, 4 wording, shape and scope notes).
**Impact on plan:** None on scope or behavior. Every existing DOM characterization passes with unchanged assertions.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 05-09 builds EstadoVacio and TarjetaCaso. It can use `--acento-tinte`, `--sombra-elevada`, `--radio-pildora`, `--display-fuente` and the chip state pattern from this plan.
- These need eli-qa with Playwright MCP:
  - The narrow header fit at 375 and 320 px.
  - The two-row maximum for the pill chips.
  - The branded access error and busy states.
  - The cold-start header.
  - The long model name.

Plan verification:
- `bun test`: 2614 pass, 2 skip (the existing live tests) and 0 fail across 130 files.
- `bun run check` is green.
- `bun run build:web` built, and `web/dist/index.html` carries the title.
- `bun run demo.ts` exited 0.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

- The eleven created files (seven assets, `marca.constants.ts`, the two `logo-marca` files and `tests/web/marca.test.ts`) exist.
- The four plan commits (`6b28ed1`, `a605ad1`, `cfa1aa3` and `40c4c29`) are ancestors of HEAD.
