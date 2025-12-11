/* -------------------------------------------------------------------------
  Raptor Grid Card - par Inter-Raptor (Vivien Jardot)
  --------------------------------------------------------------------------
  Carte Lovelace personnalisée pour Home Assistant.

  Grille de bulles 1:1 façon Raptor Orbit :
  - Même moteur de thème que Raptor Orbit (mode clair / sombre / auto / ha / custom)
  - Bulles 1:1 (100 × 100 px par défaut) : cercle, carré ou hexagone
  - Logique de couleurs unifiée :
      * climate : hvac_action => heat / cool / idle
      * switch / light / input_boolean : on / off
      * cover : pourcentage + couleur de remplissage
      * sensor / gauge : min / max / severities
  - Options globales proches de Orbit :
      * theme_mode, transparent, color_on/off, climate_color_*, switch_color_*
      * gauge_default_color, gauge_direction, shape, pattern, edge_style
      * text_color, text_color_secondary
      * font_header, font_label, font_temp, font_current, label_bold
      * card_inner_padding
      * invert_temps (échange current/target pour les climates)
      * invert_fill (inverse le remplissage 0→100% / 100→0%)
  - Options Grid spécifiques :
      * columns (nb colonnes)
      * gap (espacement entre bulles, ex: "0.8rem")
      * item_size (taille d’une bulle en px, défaut: 100)
  - Options par entité (comme Orbit) :
      * shape, pattern, edge_style
      * text_color, text_color_secondary
      * gauge_color, cover_fill_color
      * min, max, gauge_min, gauge_max, gauge_direction
      * severities: [{ from, to, color }, ...]
      * invert_fill: true/false pour inverser le remplissage de cette entité
      * icon_mode: "inline" | "icon-only" | "label" | "none"
                    | "value-only" | "label-value" | "icon-value"
      * show_icon: false pour forcer sans icône
      * icon: "mdi:..." pour une icône custom
      * tap_action, hold_action
  - Options d’icônes globales :
      * icon_mode (défaut: "inline")
      * show_icon (défaut: true)

  Exemple d’utilisation Lovelace :

    type: custom:raptor-grid-card
    title: Ground floor
    columns: 4
    entities:
      - light.salon
      - climate.salon
      - cover.volet_salon
      - sensor.temperature_salon

  Auteur  : Inter-Raptor (Vivien Jardot)
  Version : 0.1.0
  ------------------------------------------------------------------------- */

/* "Raptor" ASCII logo ---------------------------------------------------- */
//                                   .,.                                          
//                       *******                        *#### (#####              
//                  ******                          / ########     .#####.        
//              ,*****                          //////##########   #####  /####   
//           .*****                           // /////*#####################  ##  
//         ******                             //// /// ######*      *############ 
//       ******                               ////// /   ###########,            
//     .*****                                 ////////     ##################     
//    ******                                  //////// #                         
//   *****.                                  ## ////// ###                       
//  *****,                              #########/ /// #####/                  , 
// ,*****                           ################ /.######                  
// *****                       (####################   (#####                  
// ******                   #####   ########   ////////   ###                   .*
//,******             .*** ######### #####*   /////////     # /                 *
// *********    .******* ############ ###### ////////       ////                *
//  ******************* (############# #####///////      *///// ##              *
//   ****************** //// ,######### ###  /########       #########          *
//     ****************  ////////  #####/(       #######.          ####         *
//                       /////// /////  ##     //    (####           ###       **
//                        ///// //////////, /////     .####       /*(##       **
//                       ////// ///////    / ////   ## ###         ,         ,**
//                     ////////////       // ///      #                     ***.
//    .              /////////,         ////,/                             ***   
//                   ///               ......                            ****    
//       ,           ,///##              /////                         ****.     
//         *.         // ###              ,/// /                     *****       
//           ,*       / ####                /*/// ///             *****          
//              **,    ####( ####             ///// ///        ******            
//                 ****  ##### #####                      ,*******               
//                     ******.                      **********                   
//                           ***************************                         
// ***************************
//
// ---- Raptor Grid Card - 1:1 grid of bubbles (climate / sensor / cover / switch / gauge) ----

const RG_LitBase =
  window.LitElement ||
  Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace") ||
      customElements.get("hui-view")
  );


const RG_LitBase =
  window.LitElement ||
  Object.getPrototypeOf(
    customElements.get("ha-panel-lovelace") ||
      customElements.get("hui-view")
  );

const rgHtml =
  (RG_LitBase.prototype && RG_LitBase.prototype.html)
    ? RG_LitBase.prototype.html
    : RG_LitBase.html;

const rgCss =
  (RG_LitBase.prototype && RG_LitBase.prototype.css)
    ? RG_LitBase.prototype.css
    : RG_LitBase.css;

class RaptorGridCard extends RG_LitBase {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _holdTimer: {},
      _holdFired: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._config = null;
    this.hass = null;
    this._holdTimer = null;
    this._holdFired = false;
  }

  setConfig(config) {
    const items = config.entities || config.items;

    if (!items || !Array.isArray(items) || items.length < 1) {
      throw new Error("Tu dois définir au moins 1 entité dans 'entities'.");
    }

    const norm = items.map((it) => {
      if (typeof it === "string") return { entity: it };
      if (!it.entity) {
        throw new Error("Chaque item doit avoir une propriété 'entity'.");
      }
      return { ...it };
    });

    this._config = {
      // titre / affichage
      title: config.title || "",
      show_title: config.show_title ?? true,
      show_status: config.show_status ?? false, // facultatif dans Grid
      compact: config.compact ?? false,

      // disposition grille
      columns: config.columns || 3,
      gap: config.gap || (config.compact ? "0.5rem" : "0.9rem"),
      item_size: config.item_size ?? 100, // px, bulles 100×100

      // thème (copié d’Orbit)
      theme_mode: config.theme_mode || "auto", // auto | light | dark | ha | custom
      transparent: config.transparent ?? false,

      color_on: config.color_on || "#ff9800",
      color_off: config.color_off || "#37474f",

      disc_color: config.disc_color || "#263238",
      disc_color_dark: config.disc_color_dark || "#111318",
      nav_color: config.nav_color || null,

      cover_fill_color: config.cover_fill_color ?? null,
      gauge_default_color: config.gauge_default_color ?? null,
      gauge_direction: config.gauge_direction || "bottom_to_top",

      text_color: config.text_color || null,
      text_color_secondary: config.text_color_secondary || null,

      shape: config.shape || "circle",          // circle | square | hex
      pattern: config.pattern || "solid",       // solid | stripes | dots
      edge_style: config.edge_style || "liquid",// liquid | straight

      // inversion éventuelle du remplissage (volets, jauges, etc.)
      invert_fill: config.invert_fill ?? false,

      climate_color_heat: config.climate_color_heat ?? null,
      climate_color_cool: config.climate_color_cool ?? null,
      climate_color_idle: config.climate_color_idle ?? null,

      switch_color_on: config.switch_color_on ?? null,
      switch_color_off: config.switch_color_off ?? null,

      font_header: config.font_header ?? 1.05,
      font_label: config.font_label ?? 1.0,
      font_temp: config.font_temp ?? 1.15,
      font_current: config.font_current ?? 1.0,
      label_bold: config.label_bold ?? true,

      card_inner_padding: config.card_inner_padding ?? 12,

      // icônes global
      icon_mode: config.icon_mode || "inline", // inline | icon-only | label | none | value-only | label-value | icon-value
      show_icon: config.show_icon !== false,

      // inversion éventuelle des températures (comme Orbit)
      invert_temps: config.invert_temps ?? false,

      entities: norm,
    };
  }

  // -------------------- THEMES (copié d’Orbit) --------------------

  _getEffectiveThemeMode() {
    const explicit = this._config.theme_mode || "auto";

    if (explicit === "light" || explicit === "dark" || explicit === "custom") {
      return explicit;
    }

    const isDarkHa =
      this.hass &&
      this.hass.themes &&
      this.hass.themes.darkMode;

    if (explicit === "ha") {
      return isDarkHa ? "dark" : "light";
    }

    // auto = suit le mode sombre HA
    return isDarkHa ? "dark" : "light";
  }

  _getThemeVars() {
    const mode = this._getEffectiveThemeMode();
    const custom = this._config.theme_mode === "custom";
    const transparent = this._config.transparent === true;

    if (mode === "dark") {
      const textMain =
        this._config.text_color || (custom ? "#ffffff" : "#f5f5f5");
      const textSecondary =
        this._config.text_color_secondary ||
        (custom ? "rgba(255,255,255,0.8)" : "rgba(245,245,245,0.78)");

      const cardBg = custom
        ? "var(--raptor-card-bg, radial-gradient(circle at 20% 0%, #252a32, #15171c 70%))"
        : "radial-gradient(circle at 20% 0%, #252a32, #15171c 70%)";

      const slotBg = custom
        ? "var(--raptor-slot-bg, linear-gradient(145deg, #313640, #181b21))"
        : "linear-gradient(145deg, #313640, #181b21)";

      const slotShadow = custom
        ? "var(--raptor-slot-shadow, 0 8px 16px rgba(0,0,0,0.6), inset 0 0 8px rgba(255,255,255,0.05))"
        : "0 8px 16px rgba(0,0,0,0.6), inset 0 0 8px rgba(255,255,255,0.05)";

      const vars = {
        cardBg,
        slotBg,
        slotShadow,
        textMain,
        textSecondary,
        discColor: this._config.disc_color || "#263238",
        discColorDark: this._config.disc_color_dark || "#111318",
        logical_on: this._config.color_on || "#ff9800",
        logical_off: this._config.color_off || "#37474f",
        climate_heat: this._config.climate_color_heat || "#ff9800",
        climate_cool: this._config.climate_color_cool || "#ff9800",
        climate_idle: this._config.climate_color_idle || "#37474f",
        switch_on: this._config.switch_color_on || "#ff9800",
        switch_off: this._config.switch_color_off || "#37474f",
        gauge_color: this._config.gauge_default_color || "#ff9800",
        cover_color:
          this._config.cover_fill_color ||
          this._config.color_on ||
          "#ff9800",
      };

      if (transparent) {
        vars.cardBg = "none";
      }

      return vars;
    }

    // clair
    const textMain =
      this._config.text_color || (custom ? "#000000" : "#0b1120");
    const textSecondary =
      this._config.text_color_secondary ||
      (custom ? "rgba(0,0,0,0.74)" : "#1f2933");

    const cardBg = custom
      ? "var(--raptor-card-bg, radial-gradient(circle at 20% -10%, #ffffff, #e6edf7 55%, #d0d9e6 100%))"
      : "radial-gradient(circle at 20% -10%, #ffffff, #e6edf7 55%, #d0d9e6 100%)";

    const slotBg = custom
      ? "var(--raptor-slot-bg, linear-gradient(145deg, #ffffff, #e5edf7))"
      : "linear-gradient(145deg, #ffffff, #e5edf7)";

    const slotShadow = custom
      ? "var(--raptor-slot-shadow, 0 6px 12px rgba(148,163,184,0.65), inset 0 0 6px rgba(255,255,255,0.9))"
      : "0 6px 12px rgba(148,163,184,0.65), inset 0 0 6px rgba(255,255,255,0.9)";

    const vars = {
      cardBg,
      slotBg,
      slotShadow,
      textMain,
      textSecondary,
      discColor: this._config.disc_color || "#f4f7fb",
      discColorDark: this._config.disc_color_dark || "#c9d5e8",
      logical_on: this._config.color_on || "#2196f3",
      logical_off: this._config.color_off || "#d0d9e6",
      climate_heat: this._config.climate_color_heat || "#2196f3",
      climate_cool: this._config.climate_color_cool || "#2196f3",
      climate_idle: this._config.climate_color_idle || "#90a4ae",
      switch_on: this._config.switch_color_on || "#2196f3",
      switch_off: this._config.switch_color_off || "#cbd5e1",
      gauge_color: this._config.gauge_default_color || "#2196f3",
      cover_color:
        this._config.cover_fill_color ||
        "#2196f3",
    };

    if (transparent) {
      vars.cardBg = "none";
    }

    return vars;
  }

  // -------------------- HELPERS LOGIQUES (copiés d’Orbit) --------------------

  _isOn(stateObj, mode) {
    if (!stateObj) return false;
    const domain = stateObj.entity_id.split(".")[0];

    if (mode === "climate" || domain === "climate") {
      const action = stateObj.attributes.hvac_action;
      return action === "heating" || action === "cooling";
    }

    if (
      mode === "binary" ||
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    ) {
      return stateObj.state === "on";
    }

    if (mode === "cover" || domain === "cover") {
      const pos =
        stateObj.attributes.current_position ??


        stateObj.attributes.position;
      return typeof pos === "number" && pos > 0;
    }

    return false;
  }

  _getMode(item, stateObj) {
    if (item.mode) return item.mode;
    if (!stateObj) return "sensor";

    const domain = stateObj.entity_id.split(".")[0];
    if (domain === "climate") return "climate";
    if (domain === "cover") return "cover";
    if (
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    )
      return "binary";
    if (domain === "sensor") return "sensor";
    return "sensor";
  }

  _getDisplayData(item) {
    const stateObj = this.hass && this.hass.states[item.entity];
    if (!stateObj) {
      return {
        name: item.name || item.entity,
        current: null,
        target: null,
        unit: "",
        stateObj: null,
        mode: item.mode || "sensor",
        percent: null,
        climate_phase: null,
      };
    }

    const mode = this._getMode(item, stateObj);
    const attr = stateObj.attributes;

    let name =
      item.name ||
      attr.friendly_name ||
      item.entity;

    let current = null;
    let target = null;
    let unit = attr.unit_of_measurement || "";
    let percent = null;
    let climate_phase = null;

    if (mode === "climate") {
      current = attr.current_temperature ?? null;
      target =
        attr.temperature ??


        attr.target_temp ??


        attr.target_temp_high ??


        attr.target_temp_low ??


        null;
      if (!unit) unit = "°";

      const action = attr.hvac_action;
      if (action === "heating") {
        climate_phase = "heat";
      } else if (action === "cooling") {
        climate_phase = "cool";
      } else {
        climate_phase = "idle";
      }
    } else if (mode === "cover") {
      const pos = attr.current_position ?? attr.position;
      if (typeof pos === "number") {
        current = pos;
        percent = Math.max(0, Math.min(1, pos / 100));
        if (!unit) unit = "%";
      }
    } else if (mode === "gauge") {
      const raw = parseFloat(stateObj.state);
      if (!isNaN(raw)) {
        current = raw;
        const min = item.min ?? item.gauge_min ?? 0;
        const max = item.max ?? item.gauge_max ?? 100;
        if (max > min) {
          percent = Math.max(0, Math.min(1, (raw - min) / (max - min)));
        }
      } else {
        current = stateObj.state;
      }
    } else if (mode === "binary") {
      current = stateObj.state;
    } else {
      const raw = parseFloat(stateObj.state);
      if (!isNaN(raw)) {
        current = raw;
        const min = item.min ?? 0;
        const max = item.max ?? 100;
        if (max > min) {
          percent = Math.max(0, Math.min(1, (raw - min) / (max - min)));
        }
      } else {
        current = stateObj.state;
      }
    }

    if (item.value_map && typeof current === "string") {
      const mapped = item.value_map[current];
      if (mapped !== undefined) {
        current = mapped;
      }
    }

    return { name, current, target, unit, stateObj, mode, percent, climate_phase };
  }

  _openMoreInfo(entityId) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }

  _toggleEntity(entityId) {
    if (!this.hass) return;
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return;

    const [domain] = entityId.split(".");
    if (
      domain === "switch" ||
      domain === "light" ||
      domain === "input_boolean"
    ) {
      this.hass.callService(domain, "toggle", { entity_id: entityId });
    } else if (domain === "cover") {
      const open = stateObj.state === "open";
      this.hass.callService("cover", open ? "close_cover" : "open_cover", {
        entity_id: entityId,
      });
    } else {
      this._openMoreInfo(entityId);
    }
  }

  _handleAction(type, item, info) {
    const stateObj = info.stateObj;
    const mode = info.mode;
    if (!stateObj) return;

    const defaultTap =
      mode === "binary" || mode === "cover" ? "toggle" : "more-info";

    const tapAction = item.tap_action || defaultTap;
    const holdAction = item.hold_action || "more-info";

    const action = type === "tap" ? tapAction : holdAction;

    if (action === "toggle") {
      this._toggleEntity(stateObj.entity_id);
    } else if (action === "more-info") {
      this._openMoreInfo(stateObj.entity_id);
    }
  }

  _onPointerDown(ev, item, info) {
    if (ev.button !== undefined && ev.button !== 0) return;
    this._holdFired = false;
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
      this._handleAction("hold", item, info);
    }, 600);
  }

  _onPointerUp(ev, item, info) {
    if (ev.button !== undefined && ev.button !== 0) return;
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
    if (!this._holdFired) {
      this._handleAction("tap", item, info);
    }
  }

  _onPointerLeave() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  // -------------------- STYLES --------------------

  static get styles() {
    return rgCss`
      ha-card {
        padding: 12px 14px 10px;
        border-radius: 20px;
        overflow: visible;
        display: flex;
        flex-direction: column;
        gap: 8px;

        background: var(
          --raptor-card-bg,
          radial-gradient(circle at 20% 0%, #252a32, #15171c 70%)
        );

        --raptor-text-main: #f5f5f5;
        --raptor-text-secondary: rgba(245,245,245,0.78);
        --raptor-slot-bg: linear-gradient(145deg, #313640, #181b21);
        --raptor-slot-shadow:
          0 8px 16px rgba(0,0,0,0.6),
          inset 0 0 8px rgba(255,255,255,0.05);
      }

      ha-card.compact {
        padding: 8px 8px 6px;
      }

      ha-card.transparent {
        background: none;
        box-shadow: none;
      }

      .inner {
        padding: var(--raptor-inner-padding, 10px);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--raptor-text-main);
        margin-bottom: 4px;
      }

      .sub {
        font-size: 0.78rem;
        opacity: 0.9;
        color: var(--raptor-text-secondary);
        text-align: right;
      }

      /* grille */

      .grid {
        display: grid;
        grid-template-columns: repeat(var(--rg-columns, 3), auto);
        justify-content: center;
        gap: var(--rg-gap, 0.9rem);
      }

      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }

      .slot-wrapper {
        width: var(--rg-size, 100px);
        height: var(--rg-size, 100px);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .slot {
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--raptor-slot-bg);
        box-shadow: var(--raptor-slot-shadow);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        opacity: 0.95;
        border: 2px solid transparent;
        overflow: hidden; /* important pour clipper le remplissage */

        backface-visibility: hidden;
        transform: translateZ(0);
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;

        transition:
          box-shadow 0.22s ease-out,
          border-color 0.22s ease-out,
          opacity 0.18s ease-out,
          background 0.22s ease-out,
          transform 0.08s ease-out;
      }

      .slot.on {
        opacity: 1;
      }

      .slot.off {
        opacity: 0.9;
      }

      .slot.on {
        box-shadow:
          0 12px 24px rgba(0,0,0,0.6),
          0 0 12px rgba(255,180,90,0.6);
      }

      .slot.off {
        box-shadow:
          0 8px 18px rgba(0,0,0,0.5);
      }

      .slot:active {
        transform: translateZ(0) scale(0.97);
      }

      .slot-inner {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 4px;
        width: 100%;
        height: 100%;
      }

      .slot-fill {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        border-radius: inherit;
        opacity: 0.95;
        z-index: 1;
        background: var(--fill-color, #ff9800);
      }

      /* formes */

      .shape-circle {
        border-radius: 999px;
      }

      .shape-square {
        border-radius: 20px;
      }

      .shape-hex {
        border-radius: 0;
        clip-path: polygon(
          25% 5%,
          75% 5%,
          100% 50%,
          75% 95%,
          25% 95%,
          0 50%
        );
      }

      /* patterns (comme Orbit) */

      .pattern-solid .slot-fill {
        background-color: var(--fill-color);
      }

      .pattern-stripes .slot-fill {
        background-image: repeating-linear-gradient(
          -45deg,
          rgba(0,0,0,0.22),
          rgba(0,0,0,0.22) 4px,
          rgba(255,255,255,0.2) 4px,
          rgba(255,255,255,0.2) 8px
        );
        background-color: var(--fill-color);
      }

      .pattern-dots .slot-fill {
        background-image: radial-gradient(circle, rgba(255,255,255,0.26) 2px, transparent 2px);
        background-size: 8px 8px;
        background-color: var(--fill-color);
      }

      .edge-straight .slot-fill {
        filter: none;
      }

      .edge-liquid .slot-fill {
        filter: blur(3px);
      }

      /* icônes */

      .rg-icon {
        --mdc-icon-size: 26px;
        margin-bottom: 2px;
      }

      .rg-icon.icon-only {
        --mdc-icon-size: 34px; /* plus grand quand icône seule */
        margin-bottom: 0;
      }

      /* textes */

      .label {
        font-size: 0.78rem;
        line-height: 1.1;
        opacity: 0.96;
        color: var(--raptor-text-secondary);
        text-align: center;
        max-width: 96%;
        text-wrap: balance;
        white-space: normal;
        margin: 0;
      }

      .label.bold {
        font-weight: 600;
        color: var(--raptor-text-main);
      }

      .main-value {
        font-weight: 700;
        color: var(--raptor-text-main);
        line-height: 1.05;
        white-space: nowrap; /* évite "o\nf\nf" ou "°\nC" */
        margin: 0;
      }

      .small-value {
        color: var(--raptor-text-secondary);
        opacity: 0.96;
        line-height: 1.1;
        white-space: nowrap;
        font-size: 0.78rem;
        margin: 0;
      }
    `;
  }

  // -------------------- RENDER D’UN SLOT --------------------

  _renderCell(item, themeVars) {
    const info = this._getDisplayData(item);
    const { name, current, target, unit, stateObj, mode, percent, climate_phase } = info;
    const isOn = this._isOn(stateObj, mode);

    // valeur principale / secondaire (même logique que Orbit)
    let big = target ?? current ?? (stateObj ? stateObj.state : "");
    let small =
      current != null && target != null && current !== target
        ? current
        : null;

    if (this._config.invert_temps && current != null && target != null) {
      big = current;
      small = target;
    }

    const mainValue =
      typeof big === "number"
        ? big.toLocaleString(undefined, { maximumFractionDigits: 1 })
        : big;

    const smallValue =
      typeof small === "number"
        ? small.toLocaleString(undefined, { maximumFractionDigits: 1 })
        : small;

    let unitText = unit || "";
    if (unitText === "°" || unitText === "Â°") unitText = "°";

    // styles texte (avec override par item)
    const textMain = item.text_color || themeVars.textMain;
    const textSecondary = item.text_color_secondary || themeVars.textSecondary;

    const labelClasses = ["label"];
    if (this._config.label_bold) labelClasses.push("bold");

    const labelStyle = `
      font-size:${0.9 * (this._config.font_label || 1)}rem;
      color:${this._config.label_bold ? textMain : textSecondary};
    `;
    const mainStyle = `
      font-size:${1.25 * (this._config.font_temp || 1)}rem;
      color:${textMain};
    `;
    const smallStyle = `
      font-size:${0.8 * (this._config.font_current || 1)}rem;
      color:${textSecondary};
    `;

    // couleurs de remplissage (copié d’Orbit)
    let fillStyle = "";
    let fillPercent = percent;
    let fillColor = null;

    if (mode === "cover") {
      fillColor =
        item.cover_fill_color ||
        this._config.cover_fill_color ||
        themeVars.cover_color ||
        themeVars.logical_on;
    } else if (mode === "gauge" || mode === "sensor") {
      fillColor =
        item.gauge_color ||
        themeVars.gauge_color ||
        themeVars.logical_on;
    } else if (mode === "binary") {
      fillPercent = 1;
      if (isOn) {
        fillColor =
          item.color_on ||
          themeVars.switch_on ||
          themeVars.logical_on;
      } else {
        fillColor =
          item.color_off ||
          themeVars.switch_off ||
          themeVars.logical_off;
      }
    } else if (mode === "climate") {
      fillPercent = 1;
      if (climate_phase === "heat") {
        fillColor =
          item.heat_color ||
          themeVars.climate_heat ||
          themeVars.logical_on;
      } else if (climate_phase === "cool") {
        fillColor =
          item.cool_color ||
          themeVars.climate_cool ||
          themeVars.logical_on;
      } else {
        fillColor =
          item.idle_color ||
          themeVars.climate_idle ||
          themeVars.logical_off;
      }
    }

    // severities (gauge / sensor)
    if (
      (mode === "gauge" || mode === "sensor") &&
      typeof current === "number" &&
      Array.isArray(item.severities)
    ) {
      const sev = item.severities.find(
        (s) =>
          typeof s.from === "number" &&
          typeof s.to === "number" &&
          current >= s.from &&
          current < s.to
      );
      if (sev && sev.color) {
        fillColor = sev.color;
      }
    }

    // inversion optionnelle du remplissage (global + par entité)
    const invert =
      item.invert_fill !== undefined
        ? item.invert_fill
        : this._config.invert_fill;

    if (invert && fillPercent != null) {
      fillPercent = 1 - fillPercent;
    }

    // calcul du remplissage
    if (fillPercent != null && fillColor) {
      const pct = Math.round(Math.max(0, Math.min(1, fillPercent)) * 100);
      const dir =
        item.gauge_direction ||
        this._config.gauge_direction ||
        (mode === "cover" ? "bottom_to_top" : "left_to_right");

      let sizePart = "";

      if (dir === "left_to_right") {
        sizePart = `height:100%;width:${pct}%;left:0;bottom:0;`;
      } else if (dir === "right_to_left") {
        sizePart = `height:100%;width:${pct}%;right:0;left:auto;bottom:0;`;
      } else if (dir === "top_to_bottom") {
        sizePart = `width:100%;height:${pct}%;left:0;top:0;bottom:auto;`;
      } else {
        // bottom_to_top
        sizePart = `width:100%;height:${pct}%;left:0;bottom:0;`;
      }

      fillStyle = `${sizePart}--fill-color:${fillColor};`;
    }

    const classes = ["slot"];
    classes.push(isOn ? "on" : "off");

    const shapeClass = item.shape || this._config.shape || "circle";
    const patternClass = item.pattern || this._config.pattern || "solid";
    const edgeClass = item.edge_style || this._config.edge_style || "liquid";

    // -------- Gestion des icônes / texte / valeurs --------

    const globalIconMode = this._config.icon_mode || "inline";
    const itemIconMode = item.icon_mode || globalIconMode;
    const showIcon =
      item.show_icon !== undefined ? item.show_icon : this._config.show_icon;

    // icône (avec override item.icon = "mdi:...")
    let iconTemplate = null;
    const iconMode = itemIconMode;

    const iconAllowedModes = ["inline", "icon-only", "label", "icon-value"];

    if (showIcon && stateObj && iconAllowedModes.includes(iconMode)) {
      let icon = item.icon || stateObj.attributes.icon;

      if (!icon) {
        const domain = stateObj.entity_id.split(".")[0];
        switch (domain) {
          case "cover":
            icon = "mdi:blinds";
            break;
          case "light":
            icon = "mdi:lightbulb";
            break;
          case "switch":
            icon = "mdi:toggle-switch";
            break;
          case "climate":
            icon = "mdi:thermostat";
            break;
          case "sensor":
            icon = "mdi:chart-line";
            break;
          case "person":
            icon = "mdi:account";
            break;
          default:
            icon = "mdi:circle-medium";
        }
      }

      const iconClass =
        iconMode === "icon-only" ? "rg-icon icon-only" : "rg-icon";

      iconTemplate = rgHtml`
        <ha-icon class="${iconClass}" .icon="${icon}"></ha-icon>
      `;
    }

    // label (nom)
    const showLabel =
      iconMode === "inline" ||
      iconMode === "label" ||
      iconMode === "label-value";

    const showValues =
      iconMode === "inline" ||
      iconMode === "value-only" ||
      iconMode === "label-value" ||
      iconMode === "icon-value";

    const labelNode = showLabel && name
      ? rgHtml`<div class="${labelClasses.join(" ")}" style="${labelStyle}">
          ${name}
        </div>`
      : null;

    const valuesNode = showValues
      ? rgHtml`
          <div class="main-value" style="${mainStyle}">
            ${mainValue}${unitText}
          </div>
          ${small != null
            ? rgHtml`<div class="small-value" style="${smallStyle}">
                ${smallValue}${unitText}
                ${mode === "climate"
                  ? this._config.invert_temps
                    ? " consigne"
                    : " actuel"
                  : ""}
              </div>`
            : null}
        `
      : null;

    const onPointerDown = (ev) => this._onPointerDown(ev, item, info);
    const onPointerUp = (ev) => this._onPointerUp(ev, item, info);
    const onPointerLeave = () => this._onPointerLeave();

    return rgHtml`
      <div class="cell">
        <div class="slot-wrapper">
          <div
            class="${classes.join(" ")} shape-${shapeClass} pattern-${patternClass} edge-${edgeClass}"
            @pointerdown=${onPointerDown}
            @pointerup=${onPointerUp}
            @pointercancel=${onPointerLeave}
            @pointerleave=${onPointerLeave}
          >
            ${fillStyle
              ? rgHtml`<div class="slot-fill" style="${fillStyle}"></div>`
              : null}
            <div class="slot-inner">
              ${iconTemplate}
              ${labelNode}
              ${valuesNode}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------- RENDER GLOBAL --------------------

  render() {
    if (!this._config || !this.hass) return rgHtml``;

    const themeVars = this._getThemeVars();

    const cardClasses = [];
    if (this._config.transparent) cardClasses.push("transparent");
    if (this._config.compact) cardClasses.push("compact");

    const headerScale = this._config.font_header || 1;
    const headerStyle = `font-size:${0.95 * headerScale}rem;`;

    const cardStyle = `
      --raptor-card-bg:${themeVars.cardBg};
      --raptor-slot-bg:${themeVars.slotBg};
      --raptor-slot-shadow:${themeVars.slotShadow};
      --raptor-text-main:${themeVars.textMain};
      --raptor-text-secondary:${themeVars.textSecondary};
      --raptor-inner-padding:${this._config.card_inner_padding}px;
      --rg-columns:${this._config.columns};
      --rg-gap:${this._config.gap};
      --rg-size:${this._config.item_size}px;
    `;

    return rgHtml`
      <ha-card class="${cardClasses.join(" ")}" style="${cardStyle}">
        <div class="inner">
          ${this._config.show_title
            ? rgHtml`
                <div class="header" style="${headerStyle}">
                  <div>${this._config.title}</div>
                  <div class="sub">
                    ${this._config.show_status ? "" : ""}
                  </div>
                </div>
              `
            : null}

          <div class="grid">
            ${this._config.entities.map((item) =>
              this._renderCell(item, themeVars)
            )}
          </div>
        </div>
      </ha-card>
    `;
  }

  getCardSize() {
    return 3;
  }
}

// enregistrement
if (!customElements.get("raptor-grid-card")) {
  customElements.define("raptor-grid-card", RaptorGridCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "raptor-grid-card",
  name: "Raptor Grid Card",
  description:
    "Grille de bulles 1:1 façon Raptor Orbit (climate, sensor, cover, switch, gauge).",
});
