# Raptor Grid Card

> Grid of 1:1 bubbles for Home Assistant – same theme engine as **Raptor Orbit**, but in a flexible grid layout instead of a wheel.

* Display your climates, switches, covers, sensors and gauges as **round / square / hexagon tiles**  
* Uses the **same theme system** as [Raptor Orbit Card](https://github.com/Inter-Raptor/raptor-orbit-card)  
* Great for **“control walls”**: lights, shutters, thermostats, presence, energy, etc.

---

## 🔍 Key features

- **Same theme engine as Raptor Orbit**
  - `theme_mode: auto | light | dark | ha | custom`
  - Light / dark gradients, transparent mode, custom overrides
- **1:1 tiles (bubbles)**
  - Default size: `100 × 100 px`
  - Shape: `circle | square | hex`
  - Patterns: `solid | stripes | dots`
  - Edge style: `liquid | straight`
- **Supports multiple “modes” per entity**
  - `climate` → `current_temperature` + `temperature` (or target)  
  - `binary` → `switch`, `light`, `input_boolean`  
  - `cover` → `%` position + fill progress  
  - `sensor` / `gauge` → value + min / max + severities
- **Fill logic per type**
  - **Climate**: color by `hvac_action` (`heating`, `cooling`, `idle`)
  - **Binary**: on / off colors
  - **Cover**: fill based on `current_position`
  - **Sensor/gauge**: fill based on min / max or `gauge_min` / `gauge_max`
  - Optional `invert_fill` globally or per entity (0→100 / 100→0)
- **Flexible grid layout**
  - `columns` to control number of columns
  - `gap` to control spacing (e.g. `"0.8rem"`)
  - `item_size` to scale the bubble (in px)
- **Per-entity overrides**
  - Shape, pattern, edge style
  - Text colors, gauge/cover colors
  - Min / max, severities, gauge direction
  - Icon mode, custom icon, per-entity `invert_fill`
  - `tap_action` / `hold_action` (toggle or more-info)
- **Smart icon / text layouts**
  - `icon_mode`:
    - `"inline"` (icon + label + values)
    - `"icon-only"`
    - `"label"`
    - `"value-only"`
    - `"label-value"`
    - `"icon-value"`
  - `show_icon: false` to hide icon globally or on an entity

---

## 🎥 Demo (GIF)

Global overview – mixed entities (lights, shutters, climates, sensors, presence…) in a single grid:

![Raptor Grid Card – Demo](raptor-grid-card-demo.gif)

> 👉 Place your GIF in the repository (for example `raptor-grid-card-demo.gif`) and update the filename above if needed.

---

# 1. Installation

## 1.1. HACS (recommended)

> Once the card is available in HACS default, you will be able to install it directly.  
> Until then, you can add it as a **custom repository**, like Raptor Orbit / Todo Hub.

1. Open **HACS → Frontend**
2. Click `⋮` (top right) → **Custom repositories**
3. Add the repository:

   ```text
   https://github.com/Inter-Raptor/raptor-grid-card
   ```

4. Category: **Lovelace**
5. Install **Raptor Grid Card** from HACS
6. Reload Lovelace resources (or restart Home Assistant if needed)

Resource example (usually added automatically by HACS):

```yaml
url: /hacsfiles/raptor-grid-card/raptor-grid-card.js
type: module
```

---

## 1.2. Manual installation

1. Download `raptor-grid-card.js`
2. Copy it into your `www` folder:

   ```text
   /config/www/raptor-grid-card.js
   ```

3. Add the resource in your Lovelace configuration:

   ```yaml
   lovelace:
     resources:
       - url: /local/raptor-grid-card.js
         type: module
   ```

   Or via **Settings → Dashboards → Resources** in the UI.

The card type is:

```yaml
type: custom:raptor-grid-card
```

---

# 2. Basic usage

## 2.1. Minimal configuration

Example with a few mixed entities (switch, climate, sensor):

```yaml
type: custom:raptor-grid-card
title: Ground floor
entities:
  - entity: switch.living_room_lamp
  - entity: climate.living_room
  - entity: sensor.living_room_temperature
```

This will:

- create a grid with **3 columns**
- use default **100×100** bubbles
- auto-detect mode (binary / climate / sensor)
- use the default theme (auto light/dark from Home Assistant)

---

## 2.2. Simple climate wall

```yaml
type: custom:raptor-grid-card
title: Heating – Ground floor
columns: 4
item_size: 110
entities:
  - entity: climate.salon
  - entity: climate.cuisine
  - entity: climate.couloir
  - entity: climate.sdb_rdc
```

---

## 2.3. Mixed grid with covers and switches

```yaml
type: custom:raptor-grid-card
title: Ground floor – Controls
columns: 4
gap: 0.8rem
shape: circle
pattern: solid
entities:
  - entity: light.salon
  - entity: light.cuisine
  - entity: switch.bureau_pc
  - entity: switch.prises_salon
  - entity: cover.volet_salon
  - entity: cover.volet_cuisine
  - entity: sensor.courant_instantane
  - entity: binary_sensor.presence_maison
```

---

# 3. Global options

These options are set at the top level of the card configuration:

```yaml
type: custom:raptor-grid-card
title: "My Grid"
theme_mode: auto
columns: 3
gap: 0.9rem
item_size: 100
# ...
entities:
  - entity: ...
```

---

## 3.1. Layout & header

| Option              | Type      | Default | Description |
|---------------------|-----------|---------|-------------|
| `title`             | string    | `""`    | Card title shown at the top left. |
| `show_title`        | boolean   | `true`  | Show / hide the title row. |
| `show_status`       | boolean   | `false` | Reserved for future use (status line, similar to Orbit). |
| `compact`           | boolean   | `false` | Smaller padding for a more compact layout. |
| `card_inner_padding`| number    | `12`    | Inner padding of the content (px). |
| `transparent`       | boolean   | `false` | If `true`, removes card background (good for custom backgrounds). |

---

## 3.2. Grid layout

| Option      | Type      | Default | Description |
|-------------|-----------|---------|-------------|
| `columns`   | number    | `3`     | Number of columns in the grid. |
| `gap`       | string    | `"0.9rem"` (or `"0.5rem"` in `compact` mode) | CSS gap between tiles. |
| `item_size` | number    | `100`   | Size of one tile (bubble) in pixels. Used for width and height. |

> Tip: doubling `item_size` approximately doubles the card height.  
> Use more columns + smaller `item_size` for dense dashboards.

---

## 3.3. Theme & colors (Orbit-compatible)

The Grid card uses the same theme engine as **Raptor Orbit**.

### 3.3.1. Mode selection

| Option        | Type   | Default | Description |
|---------------|--------|---------|-------------|
| `theme_mode`  | string | `auto`  | `auto`, `light`, `dark`, `ha`, `custom`. |
| `transparent` | bool   | `false` | If `true`, card background is removed. |

- `auto` → follow Home Assistant dark mode
- `light` / `dark` → force mode
- `ha` → use `hass.themes.darkMode`
- `custom` → you can override CSS variables (`--raptor-card-bg`, `--raptor-slot-bg`, etc.)

### 3.3.2. Logical colors

| Option                  | Default     | Description |
|-------------------------|-------------|-------------|
| `color_on`              | `#2196f3` (light) / `#ff9800` (dark) | Global “on” color. |
| `color_off`             | theme-dependent | Global “off” color. |
| `disc_color`            | theme-dependent | Base “disc” color (background of slots). |
| `disc_color_dark`       | theme-dependent | Darker disc color. |
| `cover_fill_color`      | `null` → derived from `color_on` | Default fill color for covers. |
| `gauge_default_color`   | `null` → derived from `color_on` | Default fill color for gauges / sensors. |
| `gauge_direction`       | `"bottom_to_top"` | Global direction for the fill (can be overridden per entity). |

### 3.3.3. Climate & switch colors

| Option                 | Description |
|------------------------|-------------|
| `climate_color_heat`   | Default color when `hvac_action: heating`. |
| `climate_color_cool`   | Default color when `hvac_action: cooling`. |
| `climate_color_idle`   | Default color for `idle` / other actions. |
| `switch_color_on`      | For binary entities when “on”. |
| `switch_color_off`     | For binary entities when “off”. |
| `invert_fill`          | If `true`, invert the fill percentage (global). |

---

## 3.4. Shape, pattern & edge style

| Option       | Default   | Description |
|--------------|-----------|-------------|
| `shape`      | `"circle"`| `circle`, `square`, `hex`. |
| `pattern`    | `"solid"` | `solid`, `stripes`, `dots`. |
| `edge_style` | `"liquid"`| `liquid` (soft, blurred) or `straight`. |

These can also be **overridden per entity**.

---

## 3.5. Fonts & text

| Option             | Type   | Default | Description |
|--------------------|--------|---------|-------------|
| `font_header`      | number | `1.05`  | Scale factor for header text. |
| `font_label`       | number | `1.0`   | Scale for labels (entity names). |
| `font_temp`        | number | `1.15`  | Scale for main value. |
| `font_current`     | number | `1.0`   | Scale for secondary value. |
| `label_bold`       | bool   | `true`  | If `true`, labels are bold and use main text color. |
| `text_color`       | string | `null`  | Override main text color. |
| `text_color_secondary` | string | `null` | Override secondary text color. |

---

## 3.6. Icon options

| Option      | Default   | Description |
|-------------|-----------|-------------|
| `icon_mode` | `"inline"`| `"inline"`, `"icon-only"`, `"label"`, `"none"`, `"value-only"`, `"label-value"`, `"icon-value"`. |
| `show_icon` | `true`    | Show icon globally (can be overridden per entity). |

> Examples:
> - `icon_mode: icon-only` → only a big icon (good for presence / scenes)  
> - `icon_mode: value-only` → only value, no icon and no label  
> - `icon_mode: label-value` → label + value, no icon

---

## 3.7. Temperature & value behavior

| Option         | Type   | Default | Description |
|----------------|--------|---------|-------------|
| `invert_temps` | bool   | `false` | If `true`, swap current / target display for climates. |

---

# 4. Per-entity configuration

Each entry in `entities:` can be either a simple string or an object.

```yaml
entities:
  - climate.salon          # shorthand → { entity: climate.salon }
  - entity: climate.cuisine
    name: Cuisine
    mode: climate
    shape: square
    tap_action: toggle
```

---

## 4.1. Basic per-entity fields

| Option       | Type        | Required | Description |
|--------------|-------------|----------|-------------|
| `entity`     | string      | yes      | Entity id, e.g. `climate.salon`. |
| `name`       | string      | no       | Override label (fallback to `friendly_name`). |
| `mode`       | string      | no       | Force mode: `climate`, `cover`, `binary`, `sensor`, `gauge`. If not set, auto-detected from domain. |
| `value_map`  | object      | no       | Map raw string states to nicer labels (for sensor / binary). |

---

## 4.2. Visual overrides

| Option                | Description |
|-----------------------|-------------|
| `shape`               | Override global shape (`circle`, `square`, `hex`). |
| `pattern`             | Override pattern (`solid`, `stripes`, `dots`). |
| `edge_style`          | Override edge style (`liquid`, `straight`). |
| `text_color`          | Override main text color. |
| `text_color_secondary`| Override secondary text color. |
| `gauge_color`         | Fill color for gauges / sensors. |
| `cover_fill_color`    | Fill color for this cover. |
| `invert_fill`         | Invert fill only for this entity. |
| `gauge_direction`     | Override global gauge direction (`left_to_right`, `right_to_left`, `top_to_bottom`, `bottom_to_top`). |

---

## 4.3. Min / max and severities

For numeric sensors and gauges:

| Option       | Type   | Description |
|--------------|--------|-------------|
| `min`        | number | Logical min (for percent calculation). |
| `max`        | number | Logical max. |
| `gauge_min`  | number | Alternative min specifically for gauge mode. |
| `gauge_max`  | number | Alternative max for gauge mode. |
| `severities` | array  | Optional list of `{ from, to, color }` for color ranges. |

Example:

```yaml
- entity: sensor.temperature_ext
  mode: gauge
  min: -10
  max: 40
  severities:
    - from: -10
      to: 0
      color: "#3b82f6"   # blue
    - from: 0
      to: 25
      color: "#22c55e"   # green
    - from: 25
      to: 40
      color: "#ef4444"   # red
```

---

## 4.4. Icons & actions

| Option        | Type    | Description |
|---------------|---------|-------------|
| `icon`        | string  | Custom icon, e.g. `mdi:home-thermometer`. |
| `icon_mode`   | string  | Override global `icon_mode`. |
| `show_icon`   | boolean | Force show/hide icon for this entity. |
| `tap_action`  | string  | `"toggle"` or `"more-info"` (default depends on type). |
| `hold_action` | string  | `"more-info"` (default) or `"toggle"`. |

Default tap behavior:

- `binary` / `cover` → `toggle`
- others → `more-info`

Default hold behavior:

- always `more-info` (long press).

---

# 5. Example configurations

## 5.1. Climate grid with inverted temps

```yaml
type: custom:raptor-grid-card
title: Heating – Upstairs
columns: 3
invert_temps: true
theme_mode: auto
entities:
  - entity: climate.chambre_parentale
  - entity: climate.chambre_enfant
  - entity: climate.bureau
```

---

## 5.2. Lights & switches wall

```yaml
type: custom:raptor-grid-card
title: Lights & switches
columns: 4
item_size: 95
icon_mode: icon-value
entities:
  - entity: light.salon
    name: Salon
  - entity: light.cuisine
  - entity: switch.prise_tv
  - entity: switch.prise_console
  - entity: switch.prise_bureau
  - entity: light.couloir
  - entity: light.escalier
  - entity: light.exterieur
```

---

## 5.3. Mixed sensors & gauges

```yaml
type: custom:raptor-grid-card
title: Environment
columns: 3
shape: hex
pattern: dots
entities:
  - entity: sensor.temperature_salon
    mode: gauge
    min: 10
    max: 30
  - entity: sensor.humidity_salon
    mode: gauge
    min: 0
    max: 100
  - entity: sensor.co2_salon
    mode: gauge
    min: 400
    max: 1600
    severities:
      - from: 400
        to: 800
        color: "#22c55e"
      - from: 800
        to: 1200
        color: "#f97316"
      - from: 1200
        to: 1600
        color: "#ef4444"
```

---

# 6. Notes & limitations

- The card relies on **standard Home Assistant attributes**:
  - `climate` → `current_temperature`, `temperature` / `target_temp_*`, `hvac_action`
  - `cover` → `current_position` or `position`
  - `sensor` / `gauge` → numeric state for fill calculation
- If attributes are missing or non-numeric, the card falls back to a simple label+state display.
- Some options (like `show_status`) are reserved for future features and may evolve over time.

---

## Credits

- **Author**: Inter-Raptor (Vivien Jardot)  
- **Inspiration**: [Raptor Orbit Card](https://github.com/Inter-Raptor/raptor-orbit-card) and neumorphic / glassmorphism dashboards.

Feel free to open issues or suggestions on GitHub if you have ideas for new patterns, shapes or layout modes.
