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
      circle: false,
    };

    // Character scaling
    window.addEventListener("resize", () => {this.changeSetting('size', document.documentElement.clientWidth * 0.3);});
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
          background-color: var(--ddd-theme-default-coalyGray);
          color: var(--ddd-theme-default-white);
          position: absolute;
          top: 125%;
          left: 50%;
          transform: translateX(-50%);
          padding: var(--ddd-spacing-1) var(--ddd-spacing-2);
          border-radius: var(--ddd-spacing-1);
          font-size: 18px;
          font-weight: bold;
        }
        label {
          display: block;
          font-size: 21px;
          font-weight: bold;
          margin-bottom: var(--ddd-spacing-1);
        }
        wired-input,
        wired-checkbox,
        wired-slider,
        wired-combo {
          display: block;
          margin-bottom: var(--ddd-spacing-4);
          max-width: 400px;
        }
      `,
    ];
  }

  // Lit render the HTML
  render() {
    return html`
      <div class="container">
        <div class="character">
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
            style="--character-size: ${this.characterSettings.size}px;"
          ></rpg-character>
          <div class="seed">Seed: ${this.characterSettings.seed}</div>
        </div>
        <div class="settings">
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

          <label>Hat</label>
          <wired-combo
            .selected="${this.hat}"
            @selected="${(e) => this.changeSetting('hat', e.detail.selected)}"
          >
            ${["none", "bunny", "coffee", "construction", "cowboy",  "education", "knight", "ninja",
              "party", "pirate", "watermelon", "random"].map(hat => html`
              <wired-item value="${hat}" class="wired-rendered">${hat.charAt(0).toUpperCase() + hat.slice(1)}</wired-item>
            `)}
          </wired-combo>
          <label>Hat Color</label>
          <wired-slider value="${this.characterSettings.hatColor}" min="0" max="9"
            @change="${(e) => this.changeSetting('hatColor', parseInt(e.detail.value))}"
          ></wired-slider>

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

          <wired-checkbox ?checked="${this.characterSettings.walking}"
            @change="${(e) => this.changeSetting('walking', e.target.checked)}"
          >Walking</wired-checkbox>
          <wired-checkbox ?checked="${this.characterSettings.fire}"
            @change="${(e) => this.changeSetting('fire', e.target.checked)}"
          >On Fire</wired-checkbox>
          <wired-checkbox ?checked="${this.characterSettings.circle}"
            @change="${(e) => this.changeSetting('circle', e.target.checked)}"
          >Circle Frame</wired-checkbox>

          <wired-button @click="${this.shareOnX}">Share on X</wired-button>
          <wired-button @click="${this.shareOnLinkedIn}">Share on LinkedIn</wired-button>
          <wired-button @click="${this.copyShareLink}">Copy Share Link</wired-button>
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
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent('Check out my HAX avatar!')}&url=${this.characterSettings.url}`);
  }
  shareOnLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${this.characterSettings.url}`);
  }

  // Build URL
  buildURL() {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      seed: this.characterSettings.seed,
      hat: this.characterSettings.hat,
      fire: this.characterSettings.fire,
      walking: this.characterSettings.walking,
      circle: this.characterSettings.circle,
    }).toString();
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
    const params = new URLSearchParams(window.location.search);

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

      this.characterSettings.hat = params.get("hat");
      this.characterSettings.fire = params.get("fire") === 'true';
      this.characterSettings.walking = params.get("walking") === 'true';
      this.characterSettings.circle = params.get("circle") === 'true';
    }

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