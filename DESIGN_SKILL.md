# UnifyApps "Warm Enterprise" Design Skill

## Description
A complete design system for building premium, warm-themed enterprise UI — the look used across the Skills / AI FDE product. It defines the exact color tokens, typography, spacing, radii, shadows, button/CTA rules, icon conventions, and component patterns so any designer or engineer can recreate screens that are pixel-consistent with the existing product.

Use it when:
- Building a new screen, panel, modal, table, or dropdown for this product
- Adding a CTA and you need to decide primary vs ghost vs icon-only
- Choosing a color, font, radius, shadow, or icon and you want the canonical value
- Reviewing a UI for consistency with the established style

---

## 1. Foundations

### 1.1 Theme in one line
Warm **sand/cream** surfaces (`#FEFDFB`) floating as rounded cards on a **dark-green frame** (`#0e2614`), with a single **dark-green** action color (`#16341f`). Serif display type, humanist sans for body, mono for code. Soft, layered shadows. No CSS framework — all inline `style={{}}`.

### 1.2 Color tokens

**Greens (frame + actions)**
| Token | Hex | Use |
|---|---|---|
| `--green-frame` / `--green-sidebar` | `#0e2614` | Outer canvas, sidebar, top status bar |
| `--green-btn` | `#16341f` | Primary buttons, active accents, selected states |
| green hover | `#1d4228` | Hover state for any primary green button |
| deep panel green | `#17370B → #6A763B` | AI FDE logo radial gradient only |
| command/link green | `#1f7a3d` | Inline `/command` text, slash-menu slugs |
| success green | `#7dd896` / `rgba(125,216,150,0.13)` | Positive deltas, selected sidebar highlight |

**Surfaces (sand / cream)**
| Hex | Use |
|---|---|
| `#FEFDFB` | Primary card/page surface |
| `#fff` | Inputs, menus, secondary buttons, bubbles |
| `#faf8f3` | Button hover, subtle row hover |
| `#f7f4ee` / `#f5f8f5` | Menu-item hover, suggestion hover |
| `#eee7da` / `#f4f9f4` | Icon tiles, AI gradient base |

**Borders (warm grays)**
| Hex | Use |
|---|---|
| `#efece6` | Hairline dividers inside cards |
| `#e3ddd1` / `#e8e1d2` | Default button & menu borders |
| `#ece5d7` | Modal borders |
| `#d8cfbb` | Input borders (resting) |
| `#16341f` | Input border on focus |

**Text**
| Hex | Use |
|---|---|
| `#1a1a1a` | Headings, primary text |
| `#3a3a36` | Body text, input values |
| `#5b5547` | Field labels |
| `#8a8170` / `#9a917f` | Muted helper text, captions |
| `#c9c2b4` | Breadcrumb separators, disabled |

**Status thresholds** (success rate, health, scores)
- `≥ 95` → green `#1f7a3d`
- `90–95` → amber/brown `#b07a16`
- `< 90` → red `#c0492f`

> Rule: there is exactly **one** action color (green). Never introduce a second brand accent (no blue/purple CTAs). Brand colors appear **only** inside third-party tool icons (Salesforce blue, Slack, etc.).

### 1.3 Typography
| Role | Family | Var | Notes |
|---|---|---|---|
| Display / headings / breadcrumbs | **Lora** (serif) | `--serif` | weights 400–600, e.g. page titles 17–25px |
| Body / UI / buttons / labels | **ARS Maquette** (sans) | `--sans` | the default; weights 400/500/600 |
| Code / `/commands` / slugs | **JetBrains Mono** | `--mono` | 12–13px |

Common sizes: title 19–25 (serif), section heading 15.5–17, body 13.5–14, label 12.5 (600), caption 11–12.5. Line-height 1.45–1.6 for prose.

### 1.4 Spacing, radius, shadow
- **Radii:** inputs/buttons `9–10`, menus `10–12`, cards/panels `14`, modals `16`, pills `7`, message bubbles `14–15` (with one `4px` corner for the "tail").
- **Card padding:** `18–22px`. Modal padding: `20–22px`. Button height: `36–38px`, padding `0 16–20px`.
- **Shadows (layered, warm):**
  - Resting button: `0 1px 2px rgba(60,50,30,0.04)`
  - Primary button: `0 4px 14px rgba(22,52,31,0.28), 0 1px 2px rgba(0,0,0,0.1)`
  - Menu/dropdown: `0 14px 38px rgba(40,32,18,0.18)`
  - Modal: `0 24px 70px rgba(40,32,18,0.30)`
  - Floating input / question card: `0 16px 40px rgba(16,52,31,0.16)`
- **Layout:** floating cards sit on the green frame with `6–8px` gaps; everything is a rounded card, never edge-to-edge.

---

## 2. CTAs & buttons — decision rules

Pick the button type by **weight of the action**, never by aesthetics:

| Type | When | Style |
|---|---|---|
| **Primary** | The single most important action on the surface (Publish, Create skill, Done) | `background: #16341f`, white text, no border, radius 9, primary shadow; hover → `#1d4228` |
| **Ghost / secondary** | Supporting text actions (Save Draft, Cancel, Share) | `background: #fff`, text `#3a3a36`, `1px solid #e3ddd1`, radius 9; hover → `#faf8f3` |
| **Icon-only ghost** | Frequent/utility actions where a label adds noise (Test, three-dot menu, History, New chat) | square `36×36` (or `30×30` in compact toolbars), ghost styling, **always** a `title=""` tooltip |
| **Invisible / discoverable** | Easter-door / power-user trigger | transparent until hover; reveal a subtle hint |

Rules:
- **One primary per surface.** If two greens compete, demote one to ghost.
- Toolbar order: low-commitment → high-commitment, left → right (e.g. `⋮  Test  Share  Save Draft  Publish`).
- Disabled = `opacity: 0.45`, `cursor: default`. Never gray out by changing hue.
- Hover transitions: `all .15s`. Keep motion subtle.

---

## 3. Icon conventions

- **Style:** outline / line icons, **Feather-like**, `stroke="currentColor"`, `stroke-width 1.3–1.5`, round caps & joins. No filled glyphs except tiny status dots.
- **Size:** 14–18px in buttons, 15–16px in menu rows, 26px AI mini-logo.
- **Color:** inherit text color (`#4a463e` in menus, `#5e685b`/`#9097a0` for muted controls). Never multicolor except brand logos.
- **Which icon when:**
  - Flask → Test / run-in-sandbox
  - Three vertical dots → contextual "More" menu
  - Clock (circle + hands) → history / version history / "subtle/processing" hint
  - Pencil-in-square → New chat / edit / rename
  - Globe / people / lock → share access level (Everyone / Restricted-teams / Only me)
  - Up-arrow in rounded square → send message
  - Mic → voice input (same 30×30 footprint as send so the row height never jumps)
  - Chevron `›` → breadcrumb separator & disclosure
- **Brand/tool icons:** use Simple Icons CDN (`https://cdn.simpleicons.org/{slug}`) on white `#fff`/`#eee7da` tiles; keep an inline SVG fallback for Salesforce & Slack (CDN drops them). These are the **only** place full color is allowed.

---

## 4. Component patterns

### 4.1 Cards & panels
Surface `#FEFDFB`, radius 14, `1px solid #efece6` internal dividers, padding 18–22. Float with gaps on the green frame.

### 4.2 Modals
Centered, width 540–680, `#FEFDFB`, radius 16, border `#ece5d7`, modal shadow, backdrop `rgba(28,24,18,0.40)` + `blur(2px)`. Header = serif title (19px) + 12.5px muted subtitle. Footer right-aligned: Cancel (ghost) + Primary, with a `1px solid #f2ede3` top divider. Animate in with `fdeFadeUp .18s`.

### 4.3 Inputs
Height 42 (single-line) or auto-growing textarea. Border `#d8cfbb`, radius 10–12, `#fff` bg, focus border `#16341f`. Labels 12.5px/600 `#5b5547`. Auto-grow textareas: cap at ~120px then scroll; `overflowY` stays `hidden` until content exceeds the cap (prevents a phantom single-line scrollbar). Keep the trailing control (send/mic) a fixed square so row height is stable; vertically **center** on one line, bottom-align only when wrapped.

### 4.4 Dropdowns & menus
`#fff`, radius 10–12, border `#e8e1d2`, menu shadow, 5–6px padding. Rows: 8–10px padding, radius 7–8, hover `#f7f4ee`. **Portal to `document.body`** with fixed positioning when a menu could be clipped by an overflow/scroll/footer; auto-flip upward near edges. Slash/command menus: compact single-line rows, mono text, green hover `#f1f6f1`, keyboard nav (↑/↓/Enter/Tab/Esc).

### 4.5 Tables
Pixel-width columns with a min-width guard. Bold the **number**, not its unit label. Status text must stay on one line. Owner/name columns must not wrap to two lines.

### 4.6 AI FDE (assistant panel)
- 360px dock; can slide from the **right** (default) or **left** (between nav and canvas). Slide easing `cubic-bezier(.22,1,.36,1)` over `.42s`.
- Background gradient: `#fff → #f4f9f4 → #eaf4ec` (top to bottom).
- Header: serif "AI FDE" + icon-only History / New chat / Close.
- Bubbles: AI = white, border `#ececec`, radius `14 14 14 4`; user = green gradient `#1d4228→#16341f`, white text, radius `15 15 4 15`.
- Logo: rounded-square radial gradient (`#6A763B→#17370B`) with a white "burst" star cutout.
- Markdown-ish rendering for `**bold**` and `` `code` ``.

### 4.7 Motion
Keyframes: `fdeFadeUp` (entrances, 6px rise), `fdeBlink` (typing dots), `toolSlide` (tool chips). Durations 150–240ms, gentle cubic-beziers. Streaming/"building" effects type content in chunks for realism. Never bounce or overshoot hard.

---

## 5. Voice & copy
- Warm, direct, confident — no filler, no "bullshit widgets."
- Helper text explains *why/when*, e.g. "Give your skill a name and help agents understand when to use it."
- Avoid jargon like "sandbox" in user-facing copy; say "I'll run the skill and show you what it returns."
- Sentence case for buttons and labels. American names/emails for sample data (`@acme.com`).

---

## 6. Do / Don't
**Do**
- Float rounded cards on the green frame.
- Keep one green primary per surface.
- Use line icons with `currentColor`.
- Reserve color for third-party brand tiles only.
- Keep row/control heights stable so nothing "jumps."

**Don't**
- Introduce a second accent color for CTAs.
- Use filled/duotone icons for UI controls.
- Let menus get clipped — portal them.
- Wrap status/owner text onto a second line.
- Ship a primary + secondary that are both green.
