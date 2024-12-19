/**
 * Copyright 2024 jno-de
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";
import '@haxtheweb/rpg-character/rpg-character.js';
import "wired-elements";

const statement = encodeURIComponent('Check out my awesome RPG character, brought to the world by');

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
      url: "",
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
      size: document.documentElement.clientWidth * 0.3,
      fire: false,
      walking: false,
    };

    // Character scaling
    globalThis.addEventListener("resize", () => {this.changeSetting('size', document.documentElement.clientWidth * 0.3);});
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
        .character {
          flex: 1;
          min-width: 300px;
          text-align: center;
          position: relative;
        }
        .character rpg-character {
          height: var(--character-size, 200px);
          width: var(--character-size, 200px);
          transition: height 0.3s ease, width 0.3s ease;
        }
        .settings {
          flex: 1;
          min-width: 300px;
          text-align: left;
        }
        .seed {
          background-color: var(--ddd-primary-2);
          color: var(--ddd-theme-default-white);
          padding: var(--ddd-spacing-1);
          margin: var(--ddd-spacing-2) 0 0 0;
          border-radius: var(--ddd-radius-xs);
          font-size: var(--ddd-font-size-4xs);
          font-weight: bold;
        }
        label {
          display: block;
          font-size: var(--ddd-font-size-s);
          font-weight: bold;
          color: var(--ddd-primary-2);
          margin-top: var(--ddd-spacing-2);
        }
        wired-button:focus-within,
        wired-button:hover {
          background-color: var(--ddd-primary-16);
          color: var(--ddd-primary-2)
        }
        wired-input,
        wired-checkbox,
        wired-slider,
        wired-combo {
          display: block;
          margin-bottom: var(--ddd-spacing-4);
          max-width: 400px;
          color: var(--ddd-primary-2);
        }
        wired-item {
          font-size: var(--ddd-font-size-m);
          padding: var(--ddd-spacing-2);
        }
        wired-combo {
          --wired-combo-popup-bg: var(--ddd-primary-16);
        }
        wired-checkbox {
          --wired-checkbox-default-swidth: 2px;
          --wired-checkbox-icon-color: var(--ddd-primary-16);
        }
        wired-slider {
          --wired-slider-knob-color: var(--ddd-primary-16);
          --wired-slider-bar-color: var(--ddd-primary-2);
          --wired-slider-knob-outline-color: var(--ddd-primary-15);
        }
      `,
    ];
  }

  // Lit render the HTML
  render() {
    return html`
      <div class="container">
        <div class="character">
        <wired-button @click="${this.shareOnX}">Share on X</wired-button>
          <wired-button @click="${this.shareOnLinkedIn}">Share on LinkedIn</wired-button>
          <wired-button @click="${this.copyShareLink}">Copy Share Link</wired-button>
          <div class="seed">Seed: ${this.characterSettings.seed}</div>
          <rpg-character
            literalseed
            seed=""
            base="${this.characterSettings.base}"
            face="${this.characterSettings.face}"
            faceitem="${this.characterSettings.faceitem}"
            hair="${this.characterSettings.hair}"
            pants="${this.characterSettings.pants}"
            shirt="${this.characterSettings.shirt}"
            skin="${this.characterSettings.skin}"
            hatColor="${this.characterSettings.hatColor}"
            hat="${this.characterSettings.hat}"
            ?fire="${this.characterSettings.fire}"
            ?walking="${this.characterSettings.walking}"
            style="--character-size: ${this.characterSettings.size}px;"
          ></rpg-character>
        </div>
        <div class="settings">
        <label>Hat</label>
          <wired-combo
            .selected="${this.characterSettings.hat}"
            @selected="${(e) => this.changeSetting('hat', e.detail.selected)}"
          >
            ${["none", "party", "bunny", "coffee", "construction", "cowboy",  "education", "knight", "ninja",
              "pirate", "watermelon", "random"].map(hat => html`
              <wired-item value="${hat}" class="wired-rendered">${hat.charAt(0).toUpperCase() + hat.slice(1)}</wired-item>
            `)}
          </wired-combo>
          ${['none', 'bunny', 'coffee', 'party'].includes(this.characterSettings.hat) ? html`
          <label>Hat Color</label>
            <wired-slider value="${this.characterSettings.hatColor}" min="0" max="9"
              @change="${(e) => this.changeSetting('hatColor', parseInt(e.detail.value))}"
            ></wired-slider>
          ` : ''}

          <wired-checkbox
            ?checked="${this.characterSettings.base === 1}"
            @change="${(e) =>
              this.changeSetting('base', e.target.checked ? 1 : 0)}"
            >Hair</wired-checkbox>
          ${this.characterSettings.base === 1 ? html`
            <label>Hair Color</label>
            <wired-slider value="${this.characterSettings.hair}" min="0" max="9"
              @change="${(e) => this.changeSetting('hair', parseInt(e.detail.value))}">
            </wired-slider>
          ` : ''}
          <label>Skin</label>
          <wired-slider value="${this.characterSettings.skin}" min="0" max="9"
            @change="${(e) => this.changeSetting('skin', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Face</label>
          <wired-slider value="${this.characterSettings.face}" min="0" max="5"
            @change="${(e) => this.changeSetting('face', parseInt(e.detail.value))}"
          ></wired-slider>
          <label>Face Accessory</label>
          <wired-slider value="${this.characterSettings.faceitem}"  min="0" max="9"
            @change="${(e) => this.changeSetting('faceitem', parseInt(e.detail.value))}"
          ></wired-slider>

          <label>Shirt</label>
          <wired-slider value="${this.characterSettings.shirt}" min="0" max="9"
            @change="${(e) => this.changeSetting('shirt', parseInt(e.detail.value))}"
          ></wired-slider>
          <label>Pants</label>
          <wired-slider value="${this.characterSettings.pants}" min="0" max="9"
            @change="${(e) => this.changeSetting('pants', parseInt(e.detail.value))}"
          ></wired-slider>

          <wired-checkbox ?checked="${this.characterSettings.walking}"
            @change="${(e) => this.changeSetting('walking', e.target.checked)}"
          >Walking</wired-checkbox>
          <wired-checkbox ?checked="${this.characterSettings.fire}"
            @change="${(e) => this.changeSetting('fire', e.target.checked)}"
          >On Fire</wired-checkbox>
        </div>
      </div>
    `;
  }

  // Share buttons
  copyShareLink() {
    navigator.clipboard.writeText(`${this.characterSettings.url}`).then;
    alert("Link copied to clipboard!");
  }
  shareOnX() {
    globalThis.open(`https://x.com/intent/tweet?text=${statement} @HAXTheWeb&url=${encodeURIComponent(this.characterSettings.url)}`);
  }
  shareOnLinkedIn() {
    globalThis.open(`https://www.linkedin.com/sharing/share-offsite/?text=${statement} @HAX&url=${encodeURIComponent(this.characterSettings.url)}`);
  }

  // Build URL
  buildURL() {
    const baseUrl = globalThis.location.origin;
    let paramData = {
      seed: this.characterSettings.seed,
    };
    if (this.characterSettings.hat) {
      paramData.hat = this.characterSettings.hat;
    }
    if (this.characterSettings.fire) {
      paramData.fire = this.characterSettings.fire;
    }
    if (this.characterSettings.walking) {
      paramData.walking = this.characterSettings.walking;
    }
    const params = new URLSearchParams(paramData).toString();
    this.characterSettings.url = `${baseUrl}?${params}`;
  }

  // Character updated
  changeSetting(key, value) {
    this.characterSettings = { ...this.characterSettings, [key]: value };
    const { base, face, faceitem, hair, pants, shirt, skin, hatColor } = this.characterSettings;
    this.characterSettings.seed = `${base}${face}${faceitem}${hair}${pants}${shirt}${skin}${hatColor}`;
    this.buildURL();
  }

  // Character loaded
  connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(globalThis.location.search);

    if (params.has("seed")) {
      // get seed from URL if it exists, then split each digit and map it for assignment to characterSettings
      this.characterSettings.seed = params.get("seed");
      const seedPadded = this.characterSettings.seed.padStart(8, "0").slice(0, 8);
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

      this.characterSettings.hat = params.get("hat") ? params.get('hat') : 'none';
      this.characterSettings.fire = params.get("fire") === 'true';
      this.characterSettings.walking = params.get("walking") === 'true';    }

    this.buildURL();
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