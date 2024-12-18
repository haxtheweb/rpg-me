/**
 * Copyright 2024 jno-de
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";
import '@haxtheweb/rpg-character/rpg-character.js';
import "wired-elements"

/**
 * `rpg-me`
 * 
 * @demo index.html
 * @element rpg-me
 */
export class RpgMe extends DDDSuper(I18NMixin(LitElement)) {

  static get tag() {
    return "rpg-me";
  }

  constructor() {
    super();
    this.characterSettings = {
      seed: "00000000",
      base: 0,
      face: 0,
      faceitem: 0,
      hair: 0,
      pants: 0,
      shirt: 0,
      skin: 0,
      hat: "none",
      hatColor: 0,
      size: 360,
      fire: false,
      walking: false,
      circle: false,
    };
  }

  // Lit reactive properties
  static get properties() {
    return {
      ...super.properties,
      characterSettings: { type: Object },
    };
  }

  // Lit scoped styles
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          font-family: var(--ddd-font-navigation);
        }
        .container {
          display: flex;
          flex-wrap: wrap;
          padding: var(--ddd-spacing-5);
          gap: var(--ddd-spacing-5);
          justify-content: center;
          align-items: flex-start;
        }
        .controls {
          flex: 1;
          min-width: 300px;
          text-align: left;
        }
        .character-preview {
          flex: 1;
          min-width: 300px;
          text-align: center;
          position: relative;
        }
        .character-preview rpg-character {
          height: var(--character-size, 200px);
          width: var(--character-size, 200px);
          transition: height 0.3s ease, width 0.3s ease;
        }
        .seed-display {
          background-color: var(--ddd-theme-default-limestoneGray);
          color: var(--ddd-theme-default-white);
          position: absolute;
          top: 125%;
          left: 50%;
          transform: translateX(-50%);
          padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
          border-radius: var(--ddd-spacing-1);
          font-size: 14px;
          font-weight: bold;
          pointer-events: none;
        }
        .zoom {
          position: absolute;
          top: calc(-1.5 * var(--ddd-spacing-10));
          left: 50%;
          transform: translateX(-50%);
          padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
        }
        wired-input,
        wired-checkbox,
        wired-slider,
        wired-combo {
          display: block;
          margin-bottom: var(--ddd-spacing-4);
          max-width: 400px;
        }
        label {
          display: block;
          font-size: 21px;
          font-weight: bold;
          margin-bottom: var(--ddd-spacing-1);
        }
      `,
    ];
  }

  // Lit render the HTML
  render() {
    return html`
      <div class="container">
        <div class="character-preview">
          <rpg-character
            literalseed
            base="${this.characterSettings.base}"
            face="${this.characterSettings.face}"
            faceitem="${this.characterSettings.faceitem}"
            hair="${this.characterSettings.hair}"
            pants="${this.characterSettings.pants}"
            shirt="${this.characterSettings.shirt}"
            skin="${this.characterSettings.skin}"
            hatColor="${this.characterSettings.hatColor}"
            hat="${this.characterSettings.hat}"
            .fire="${this.characterSettings.fire}"
            .walking="${this.characterSettings.walking}"
            .circle="${this.characterSettings.circle}"
            style="
              --character-size: ${this.characterSettings.size}px;
              --hat-color: hsl(${this.characterSettings.hatColor}, 100%, 50%);
            "
          ></rpg-character>
          <div class="zoom">
            <label>Zoom</label>
              <wired-slider value="${this.characterSettings.size}" min="100" max="600"
                @change="${(e) => this._updateSetting('size', parseInt(e.detail.value))}"
              ></wired-slider>
          </div>
          <div class="seed-display">Seed: ${this.characterSettings.seed}</div>
        </div>
        <div class="controls">
          <label>Skin</label>
          <wired-slider value="${this.characterSettings.skin}" min="0" max="9"
            @change="${(e) => this._updateSetting('skin', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Face</label>
          <wired-slider value="${this.characterSettings.face}" min="0" max="5"
            @change="${(e) => this._updateSetting('face', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Face Accessory:</label>
          <wired-slider value="${this.characterSettings.faceitem}"  min="0" max="9"
            @change="${(e) => this._updateSetting('faceitem', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Shirt</label>
          <wired-slider value="${this.characterSettings.shirt}" min="0" max="9"
            @change="${(e) => this._updateSetting('shirt', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Pants</label>
          <wired-slider value="${this.characterSettings.pants}" min="0" max="9"
            @change="${(e) => this._updateSetting('pants', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Hat</label>
          <wired-combo
            .selected="${this.hat}"
            @selected="${(e) => this._updateSetting('hat', e.detail.selected)}"
          >
            ${["none", "bunny", "coffee", "construction", "cowboy",  "education", "knight", "ninja",
              "party", "pirate", "watermelon", "random"].map(hat => html`
              <wired-item value="${hat}">${hat.charAt(0).toUpperCase() + hat.slice(1)}</wired-item>
            `)}
          </wired-combo>
          
          <label>Hat Color</label>
          <wired-slider value="${this.characterSettings.hatColor}" min="0" max="9"
            @change="${(e) => this._updateSetting('hatColor', parseInt(e.detail.value))}"
          ></wired-slider>

          <wired-checkbox
            ?checked="${this.characterSettings.base === 1}"
            @change="${(e) =>
              this._updateSetting('base', e.target.checked ? 1 : 0)}"
            >Hair</wired-checkbox>
          
          <!-- only show hair color if hair is checked -->
          ${this.characterSettings.base === 1 ? html`
          <label>Hair Color:</label>
          <wired-slider value="${this.characterSettings.hair}" min="0" max="9"
            @change="${(e) => this._updateSetting('hair', parseInt(e.detail.value))}">
          </wired-slider>
          ` : ''}

          <wired-checkbox
            ?checked="${this.characterSettings.walking}"
            @change="${(e) => this._updateSetting('walking', e.target.checked)}"
          >Walking</wired-checkbox>

          <wired-checkbox
            ?checked="${this.characterSettings.fire}"
            @change="${(e) => this._updateSetting('fire', e.target.checked)}"
          >On Fire</wired-checkbox>

          <wired-checkbox
            ?checked="${this.characterSettings.circle}"
            @change="${(e) => this._updateSetting('circle', e.target.checked)}"
          >Circle Frame</wired-checkbox>

          <wired-button @click="${this._shareOnX}">Share on X</wired-button>
          <wired-button @click="${this._shareOnLinkedIn}">Share on LinkedIn</wired-button>
          <wired-button @click="${this._copyShareLink}">Copy Share Link</wired-button>
        </div>
      </div>
    `;
  }

  _updateSetting(key, value) {
    this.characterSettings = { ...this.characterSettings, [key]: value };
    // set seed
    const { base, face, faceitem, hair, pants, shirt, skin, hatColor } = this.characterSettings;
    this.characterSettings.seed = `${base}${face}${faceitem}${hair}${pants}${shirt}${skin}${hatColor}`;
    this.requestUpdate();
  }

  _copyShareLink() {
    navigator.clipboard.writeText(`${window.location.href.split("?")[0]}?${new URLSearchParams({ seed: this.characterSettings.seed }).toString()}`).then;
    alert("Link copied to clipboard!");
  }

  _shareOnX() {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('Check out my HAX avatar!')}&url=${`${window.location.href.split("?")[0]}?${new URLSearchParams({ seed: this.characterSettings.seed }).toString()}`}`);
  }

  _shareOnLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${`${window.location.href.split("?")[0]}?${new URLSearchParams({ seed: this.characterSettings.seed }).toString()}`}`);
  }

  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);

    if (params.has("seed")) {
      this.characterSettings.seed = params.get("seed");
      
      const seed = this.characterSettings.seed;
      const seedPadded = seed.padStart(8, "0").slice(0, 8);
      const vals = seedPadded.split("").map((v) => parseInt(v, 10));
    
      [
        this.characterSettings.base,
        this.characterSettings.face,
        this.characterSettings.faceitem,
        this.characterSettings.hair,
        this.characterSettings.pants,
        this.characterSettings.shirt,
        this.characterSettings.skin,
        this.characterSettings.hatColor,
      ] = vals;
    }

    this.requestUpdate();
  }

  /**
   * haxProperties integration via file reference
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url)
      .href;
  }
}

globalThis.customElements.define(RpgMe.tag, RpgMe);