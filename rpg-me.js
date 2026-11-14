/**
 * Copyright 2026 The Pennsylvania State University
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";
import {
  RpgCharacter,
  traitsFromSeed,
  encodeCharacter,
  decodeCharacter,
  codeSlots,
} from "@haxtheweb/rpg-character/rpg-character.js";

// numeric look traits, in display order, with their label key
// (the same list and order rpg-character-builder uses)
export const lookSlots = [
  ["base", "body"],
  ["skin", "skin"],
  ["hair", "hair"],
  ["hatColor", "hairColor"],
  ["face", "face"],
  ["faceItem", "faceItem"],
  ["accessories", "accessory"],
  ["shirt", "shirt"],
  ["pants", "pants"],
];
const styleSelects = ["hat", "mask", "makeup"];
const chipSlots = ["expression", "pose"];
const gearSlots = ["item", "offhand", "feet", "pet"];
const toggleSlots = ["shaved", "seasonal", "fire", "circle"];
const tabs = ["look", "style", "gear", "extras"];

const slotValues = (name) => {
  const slot = codeSlots.find((s) => s.name === name);
  // "random" is not something a code can keep
  return slot ? slot.values.filter((v) => v !== "random") : [];
};

/**
 * A character from rpg-me's address: ?code= wins; otherwise ?seed= as a name,
 * or as the 8-digit seed old rpg-me links carry (body, face, glasses, hair,
 * pants, shirt, skin, hair color), plus the old &hat= and &fire= choices.
 * Returns { code, seed, walking }.
 */
export function characterFromParams(search) {
  const params = new URLSearchParams(search || "");
  const walking = params.get("walking") === "true";
  const code = (params.get("code") || "").trim();
  if (code && decodeCharacter(code)) {
    return { code, seed: "", walking };
  }
  const seed = (params.get("seed") || "").trim();
  if (!seed) {
    return null;
  }
  let character;
  if (/^\d{1,8}$/.test(seed)) {
    const d = seed.padStart(8, "0").split("").map(Number);
    const clamp = (name, v) => {
      const values = slotValues(name);
      return values.includes(v) ? v : values[values.length - 1];
    };
    character = {
      base: clamp("base", d[0]),
      face: clamp("face", d[1]),
      faceItem: d[2],
      hair: d[3],
      pants: d[4],
      shirt: d[5],
      skin: d[6],
      hatColor: d[7],
    };
  } else {
    character = traitsFromSeed(seed);
    character.base = Number(character.base);
  }
  const hat = params.get("hat");
  if (hat && slotValues("hat").includes(hat)) {
    character.hat = hat;
  }
  if (params.get("fire") === "true") {
    character.fire = true;
  }
  return {
    code: encodeCharacter(character),
    seed: /^\d+$/.test(seed) ? "" : seed,
    walking,
  };
}

/**
 * `rpg-me`
 * rpg-me.hax.cloud: build an rpg-character, keep its code, share a link that
 * recreates it, and drop it into any page that loads HAX.
 *
 * @element rpg-me
 */
export class RpgMe extends DDDSuper(I18NMixin(LitElement)) {
  static get tag() {
    return "rpg-me";
  }

  constructor() {
    super();
    this.code = "";
    this.seed = "";
    this.walking = false;
    this.tab = "look";
    this.status = "";
    this._labels = {};
    this.t = {
      title: "RPG me",
      eyebrow: "rpg-character",
      heading: "Build your character. Keep its code.",
      siteNav: "RPG me",
      build: "Build",
      useIt: "Use it",
      portfolio: "Element portfolio",
      liveDemo: "Try the live demo",
      preview: "Character preview",
      name: "Name",
      nameHelp: "A name picks a look. Your other choices stay.",
      code: "Character code",
      codeHelp: "Paste a code to load that character.",
      invalidCode: "That is not a character code.",
      copyCode: "Copy code",
      copyLink: "Copy share link",
      copied: "Copied!",
      randomize: "Randomize",
      builder: "Builder sections",
      look: "Look",
      style: "Style",
      gear: "Gear",
      extras: "Extras",
      body: "Body",
      skin: "Skin",
      hair: "Hair",
      hairColor: "Hair color",
      face: "Face",
      faceItem: "Glasses",
      accessory: "Neckwear",
      shirt: "Shirt",
      pants: "Pants",
      previous: "Previous {name}",
      next: "Next {name}",
      variant: "{current} of {total}",
      characterType: "Character type",
      typesCount: "{total} to pick from",
      noneType: "Your own look",
      flagText: "Flag text",
      circle: "Circle background",
      walking: "Walking",
      useHeading: "Use it anywhere",
      useText:
        "The code rebuilds this exact character on any page that loads HAX. In a HAX site, add the RPG character block and paste the code.",
      embedLabel: "Embed code",
      copyEmbed: "Copy embed code",
      magicText: "On a page that is not a HAX site, add the",
      magicLink: "magic script",
      shareLinkedIn: "Share on LinkedIn",
      source: "Source: haxtheweb/rpg-me",
      element: "rpg-character in the element portfolio",
      network: "Part of the HAX network.",
    };
    this.registerLocalization({
      context: this,
      localesPath: new URL("./locales/", import.meta.url).href,
    });
  }

  static get properties() {
    return {
      ...super.properties,
      /** The character code being built */
      code: { type: String, reflect: true },
      /** Name the look (skin, hair...) is derived from */
      seed: { type: String },
      /** Preview only: walk in place (not part of the code) */
      walking: { type: Boolean },
      tab: { type: String },
      status: { type: String },
      _labels: { type: Object, state: true },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    const fromUrl = characterFromParams(globalThis.location.search);
    if (fromUrl) {
      this.code = fromUrl.code;
      this.seed = fromUrl.seed;
      this.walking = fromUrl.walking;
    }
    this._loadLabels();
  }

  willUpdate(changed) {
    if (super.willUpdate) {
      super.willUpdate(changed);
    }
    if (!decodeCharacter(this.code)) {
      const traits = traitsFromSeed(this.seed || "hax");
      traits.base = Number(traits.base);
      this.code = encodeCharacter(traits);
    }
  }

  updated(changed) {
    if (super.updated) {
      super.updated(changed);
    }
    if (changed.has("code") || changed.has("walking")) {
      // keep the address bar a link to what is on screen
      try {
        globalThis.history.replaceState(
          {},
          "",
          `${globalThis.location.pathname}?${this._query()}`,
        );
      } catch {
        // some embedded contexts refuse history changes
      }
    }
  }

  /** option labels come from rpg-character's own HAX settings */
  async _loadLabels() {
    const labels = {};
    try {
      const response = await fetch(RpgCharacter.haxProperties);
      if (response.ok) {
        const schema = await response.json();
        const configure =
          schema.settings && schema.settings.configure
            ? schema.settings.configure
            : [];
        configure.forEach((entry) => {
          labels[entry.property] = {
            title: entry.title,
            options: entry.options || {},
          };
        });
      }
    } catch {
      // labels fall back to option values
    }
    this._labels = labels;
  }

  get character() {
    return decodeCharacter(this.code) || decodeCharacter("1-");
  }

  _query() {
    const params = new URLSearchParams({ code: this.code });
    if (this.walking) {
      params.set("walking", "true");
    }
    return params.toString();
  }

  get shareLink() {
    return `${globalThis.location.origin}/?${this._query()}`;
  }

  get embedCode() {
    return `<rpg-character code="${this.code}"${this.walking ? " walking" : ""}></rpg-character>`;
  }

  _set(name, value) {
    const character = this.character;
    character[name] = value;
    this._commit(encodeCharacter(character));
  }

  _commit(code) {
    if (code !== this.code) {
      this.code = code;
      this.status = "";
    }
  }

  _step(name, delta) {
    const values = slotValues(name);
    const index = values.indexOf(Number(this.character[name]));
    this._set(name, values[(index + delta + values.length) % values.length]);
  }

  _seedChanged(e) {
    this.seed = e.target.value;
    // a new name gives a new look; every other choice is kept
    const character = this.character;
    const traits = traitsFromSeed(this.seed || "hax");
    lookSlots.forEach(([slot]) => {
      character[slot] = Number(traits[slot]);
    });
    this._commit(encodeCharacter(character));
  }

  _codeTyped(e) {
    const value = e.target.value.trim();
    if (decodeCharacter(value)) {
      this._commit(value);
    } else {
      this.status = this.t.invalidCode;
    }
  }

  randomize() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const character = traitsFromSeed(Math.random().toString(36).substring(2));
    character.base = Number(character.base);
    styleSelects
      .concat(chipSlots, gearSlots, ["preset"])
      .forEach((name) => {
        // mostly keep it simple: each slot is set about a third of the time
        const values = slotValues(name).filter((v) => v !== "none");
        character[name] = Math.random() < 0.33 ? pick(values) : "none";
      });
    character.flagText = "";
    this.seed = "";
    this._commit(encodeCharacter(character));
  }

  async _copy(text) {
    try {
      await globalThis.navigator.clipboard.writeText(text);
      this.status = this.t.copied;
    } catch {
      this.status = text;
    }
  }

  _label(name, value) {
    const entry = this._labels[name];
    return entry && entry.options && entry.options[value]
      ? entry.options[value]
      : String(value);
  }

  _title(name) {
    const entry = this._labels[name];
    return entry && entry.title ? entry.title : name;
  }

  _fill(text, values) {
    return Object.keys(values).reduce(
      (out, key) => out.replace(`{${key}}`, () => values[key]),
      text,
    );
  }

  _tabKey(e) {
    const at = tabs.indexOf(this.tab);
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(at + 1) % tabs.length];
    if (e.key === "ArrowLeft") next = tabs[(at - 1 + tabs.length) % tabs.length];
    if (e.key === "Home") next = tabs[0];
    if (e.key === "End") next = tabs[tabs.length - 1];
    if (next) {
      e.preventDefault();
      this.tab = next;
      this.updateComplete.then(() => {
        const button = this.shadowRoot.querySelector(`#tab-${next}`);
        if (button) {
          button.focus();
        }
      });
    }
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          color-scheme: light dark;
          --rpgme-bg: light-dark(
            var(--ddd-theme-default-white),
            var(--ddd-theme-default-coalyGray)
          );
          --rpgme-fg: light-dark(
            var(--ddd-theme-default-coalyGray),
            var(--ddd-theme-default-white)
          );
          --rpgme-heading: light-dark(
            var(--ddd-theme-default-nittanyNavy),
            var(--ddd-theme-default-white)
          );
          --rpgme-eyebrow: light-dark(
            var(--ddd-theme-default-beaverBlue),
            var(--ddd-theme-default-pughBlue)
          );
          --rpgme-muted: light-dark(
            var(--ddd-theme-default-slateGray),
            var(--ddd-theme-default-limestoneLight)
          );
          --rpgme-line: light-dark(
            var(--ddd-theme-default-limestoneLight),
            var(--ddd-theme-default-slateGray)
          );
          --rpgme-band: light-dark(
            var(--ddd-theme-default-slateMaxLight),
            var(--ddd-theme-default-potentialMidnight)
          );
          --rpgme-panel: light-dark(
            var(--ddd-theme-default-limestoneMaxLight),
            var(--ddd-theme-default-potentialMidnight)
          );
          --rpgme-current: light-dark(
            var(--ddd-theme-default-skyMaxLight),
            var(--ddd-theme-default-beaverBlue)
          );
          --rpgme-accent: light-dark(
            var(--ddd-theme-default-beaverBlue),
            var(--ddd-theme-default-pughBlue)
          );
          --rpgme-link: light-dark(
            var(--ddd-theme-default-link),
            var(--ddd-theme-default-linkLight)
          );
          --rpgme-wrap: 1440px;
          --rpgme-gutter: var(--ddd-spacing-8);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-fg);
          font-family: var(--ddd-font-primary);
        }
        .wrap {
          max-width: var(--rpgme-wrap);
          margin: 0 auto;
          padding-inline: var(--rpgme-gutter);
          box-sizing: border-box;
        }
        a {
          color: var(--rpgme-link);
          font-weight: var(--ddd-font-weight-bold);
          text-decoration: none;
        }
        a:hover,
        a:focus-visible {
          text-decoration: underline;
        }
        :focus-visible {
          outline: var(--ddd-focus-ring);
          outline-offset: var(--ddd-focus-offset);
        }
        button,
        input,
        select {
          font-family: inherit;
        }

        /* ---------- site header (matches hax.cloud) ---------- */
        header.top {
          background-color: var(--ddd-theme-default-nittanyNavy);
          color: var(--ddd-theme-default-white);
        }
        header.top .wrap {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--ddd-spacing-3) var(--ddd-spacing-8);
          padding-block: var(--ddd-spacing-3);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-3);
          color: var(--ddd-theme-default-white);
          font-weight: var(--ddd-font-weight-black);
          font-size: var(--ddd-font-size-xs);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--ddd-spacing-10);
          height: var(--ddd-spacing-10);
          border-radius: var(--ddd-radius-sm);
          background-color: var(--ddd-theme-default-beaverBlue);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
        }
        nav.site {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-1) var(--ddd-spacing-6);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-3xs);
        }
        header.top a.navlink {
          color: var(--ddd-theme-default-white);
          font-weight: var(--ddd-font-weight-regular);
          padding-block: var(--ddd-spacing-2);
        }
        .acts {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-3);
          margin-left: auto;
        }
        header.top a.pill {
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          padding: var(--ddd-spacing-2) var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-rounded);
          text-decoration: none;
        }
        header.top a.pill.portfolio {
          color: var(--ddd-theme-default-white);
          border: var(--ddd-border-size-sm) solid
            var(--ddd-theme-default-pughBlue);
        }
        header.top a.pill.demo {
          color: var(--ddd-theme-default-nittanyNavy);
          background-color: var(--ddd-theme-default-keystoneYellow);
          border: var(--ddd-border-size-sm) solid
            var(--ddd-theme-default-keystoneYellow);
        }

        /* ---------- page ---------- */
        hgroup {
          margin: 0;
          padding-block: var(--ddd-spacing-8) var(--ddd-spacing-6);
        }
        .eyebrow {
          margin: 0 0 var(--ddd-spacing-1);
          font-family: var(--ddd-font-navigation);
          font-weight: var(--ddd-font-weight-bold);
          font-size: var(--ddd-font-size-4xs);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--rpgme-eyebrow);
        }
        h1 {
          margin: 0;
          font-size: var(--ddd-font-size-xl);
          color: var(--rpgme-heading);
        }
        h2,
        h3 {
          margin: 0;
          color: var(--rpgme-heading);
        }
        h2 {
          font-size: var(--ddd-font-size-m);
        }
        h3 {
          font-size: var(--ddd-font-size-xs);
        }
        .columns {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-6);
          align-items: flex-start;
        }
        .card {
          border: var(--ddd-border-xs);
          border-color: var(--rpgme-line);
          border-radius: var(--ddd-radius-xl);
          box-sizing: border-box;
        }

        /* preview */
        .preview {
          flex: 1 1 340px;
          padding: var(--ddd-spacing-6);
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-4);
        }
        .stage {
          align-self: center;
          margin: 0;
          width: 280px;
          max-width: 100%;
          aspect-ratio: 1;
          border-radius: var(--ddd-radius-circle);
          background-color: var(--rpgme-current);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-1);
        }
        label,
        .label {
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          color: var(--rpgme-heading);
        }
        .help {
          margin: 0;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-muted);
        }
        input[type="text"],
        select {
          height: var(--ddd-textfield-height-md, 48px);
          box-sizing: border-box;
          padding: 0 var(--ddd-spacing-3);
          border: var(--ddd-border-xs);
          border-color: var(--ddd-theme-default-limestoneGray);
          border-radius: var(--ddd-radius-xs);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-fg);
          font-size: var(--ddd-font-size-4xs);
          min-width: 0;
        }
        input.code {
          font-family: var(--ddd-font-mono, monospace);
        }
        .status {
          min-height: 1.5em;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-heading);
        }
        .status.error {
          color: var(--ddd-theme-default-error);
        }
        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-2);
        }
        .btn {
          flex: 1 1 auto;
          min-height: var(--ddd-spacing-11);
          padding: 0 var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-xs);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          cursor: pointer;
          border: var(--ddd-border-xs);
          border-color: var(--rpgme-heading);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-heading);
        }
        .btn.primary {
          border-color: var(--ddd-theme-default-nittanyNavy);
          background-color: var(--ddd-theme-default-nittanyNavy);
          color: var(--ddd-theme-default-white);
        }
        .btn:hover {
          background-color: var(--rpgme-current);
        }
        .btn.primary:hover {
          background-color: var(--ddd-theme-default-beaverBlue);
        }

        /* builder */
        .builder {
          flex: 999 1 560px;
          min-width: 0;
          overflow: hidden;
        }
        [role="tablist"] {
          display: flex;
          flex-wrap: wrap;
          padding: 0 var(--ddd-spacing-4);
          background-color: var(--rpgme-band);
          border-bottom: var(--ddd-border-xs);
          border-bottom-color: var(--rpgme-line);
        }
        [role="tab"] {
          background: transparent;
          border: 0;
          border-bottom: var(--ddd-border-size-md) solid transparent;
          padding: var(--ddd-spacing-3) var(--ddd-spacing-4);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-3xs);
          color: var(--rpgme-muted);
          cursor: pointer;
        }
        [role="tab"][aria-selected="true"] {
          border-bottom-color: var(--rpgme-accent);
          color: var(--rpgme-heading);
          font-weight: var(--ddd-font-weight-bold);
        }
        [role="tabpanel"] {
          padding: var(--ddd-spacing-6);
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-6);
        }
        .rows {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--ddd-spacing-4) var(--ddd-spacing-6);
        }
        .stepper {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-2);
        }
        .stepper select {
          flex: 1 1 auto;
        }
        .step {
          width: var(--ddd-spacing-11);
          height: var(--ddd-spacing-11);
          flex: none;
          border-radius: var(--ddd-radius-circle);
          border: var(--ddd-border-xs);
          border-color: var(--ddd-theme-default-limestoneGray);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-heading);
          font-size: var(--ddd-font-size-xs);
          cursor: pointer;
        }
        .variant {
          flex: none;
          min-width: 4.5em;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-muted);
        }
        .types {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
          gap: var(--ddd-spacing-3);
        }
        .type {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--ddd-spacing-1);
          padding: var(--ddd-spacing-2) var(--ddd-spacing-1);
          border-radius: var(--ddd-radius-md);
          border: var(--ddd-border-xs);
          border-color: var(--rpgme-line);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-fg);
          font-size: var(--ddd-font-size-4xs);
          cursor: pointer;
        }
        .type[aria-pressed="true"] {
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-accent);
          background-color: var(--rpgme-current);
          font-weight: var(--ddd-font-weight-bold);
        }
        .type rpg-character {
          pointer-events: none;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-2);
        }
        .chip {
          min-height: var(--ddd-spacing-10);
          padding: 0 var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-rounded);
          border: var(--ddd-border-xs);
          border-color: var(--ddd-theme-default-limestoneGray);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-fg);
          font-size: var(--ddd-font-size-4xs);
          cursor: pointer;
        }
        .chip[aria-pressed="true"] {
          border-color: var(--ddd-theme-default-beaverBlue);
          background-color: var(--ddd-theme-default-beaverBlue);
          color: var(--ddd-theme-default-white);
          font-weight: var(--ddd-font-weight-bold);
        }
        .toggles {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-3) var(--ddd-spacing-8);
        }
        .toggles label {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-2);
          font-weight: var(--ddd-font-weight-regular);
          font-size: var(--ddd-font-size-3xs);
          color: var(--rpgme-fg);
        }
        .toggles input {
          width: var(--ddd-spacing-5);
          height: var(--ddd-spacing-5);
          accent-color: var(--ddd-theme-default-beaverBlue);
        }

        /* use it */
        .use {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
          gap: var(--ddd-spacing-6);
          padding-block: var(--ddd-spacing-10) var(--ddd-spacing-12);
        }
        .use > div {
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-3);
        }
        .use p {
          margin: 0;
          font-size: var(--ddd-font-size-3xs);
          line-height: var(--ddd-lh-150);
        }
        .use .note {
          background-color: var(--rpgme-band);
          border-radius: var(--ddd-radius-md);
          padding: var(--ddd-spacing-5) var(--ddd-spacing-6);
        }
        pre {
          margin: 0;
          padding: var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-sm);
          background-color: var(--ddd-theme-default-potentialMidnight);
          color: var(--ddd-theme-default-white);
          font-family: var(--ddd-font-mono, monospace);
          font-size: var(--ddd-font-size-4xs);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        /* footer (matches hax.cloud) */
        footer {
          background-color: var(--ddd-theme-default-nittanyNavy);
          color: var(--ddd-theme-default-white);
        }
        footer .wrap {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ddd-spacing-3) var(--ddd-spacing-8);
          padding-block: var(--ddd-spacing-6);
          font-size: var(--ddd-font-size-4xs);
        }
        footer a {
          color: var(--ddd-theme-default-white);
        }
        footer .note {
          margin-left: auto;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          :host {
            --rpgme-gutter: var(--ddd-spacing-4);
          }
          .acts {
            margin-left: 0;
          }
          h1 {
            font-size: var(--ddd-font-size-l);
          }
          [role="tabpanel"] {
            padding: var(--ddd-spacing-4);
          }
          footer .note {
            margin-left: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none;
          }
        }
      `,
    ];
  }

  render() {
    const character = this.character;
    const invalid = this.status === this.t.invalidCode;
    return html`
      <header class="top">
        <div class="wrap">
          <a class="brand" href="/">
            <span class="badge" aria-hidden="true">HAX</span>
            <span>${this.t.title}</span>
          </a>
          <nav class="site" aria-label="${this.t.siteNav}">
            <a class="navlink" href="#build">${this.t.build}</a>
            <a class="navlink" href="#use">${this.t.useIt}</a>
          </nav>
          <div class="acts">
            <a class="pill portfolio" href="https://webcomponents.hax.cloud"
              >${this.t.portfolio} ↗</a
            >
            <a
              class="pill demo"
              href="https://demo.hax.cloud"
              >${this.t.liveDemo} ↗</a
            >
          </div>
        </div>
      </header>
      <main>
        <div class="wrap">
          <hgroup>
            <p class="eyebrow">${this.t.eyebrow}</p>
            <h1>${this.t.heading}</h1>
          </hgroup>
          <div class="columns" id="build">
            ${this.renderPreview(character, invalid)}
            ${this.renderBuilder(character)}
          </div>
          ${this.renderUse()}
        </div>
      </main>
      <footer>
        <div class="wrap">
          <a href="https://github.com/haxtheweb/rpg-me">${this.t.source}</a>
          <a href="https://webcomponents.hax.cloud">${this.t.element}</a>
          <span class="note">${this.t.network}</span>
        </div>
      </footer>
    `;
  }

  renderPreview(character, invalid) {
    return html`<section class="card preview" aria-label="${this.t.preview}">
      <figure class="stage">
        <rpg-character
          code="${this.code}"
          ?walking="${this.walking}"
          width="200"
          height="250"
        ></rpg-character>
      </figure>
      <div class="field">
        <label for="seed">${this.t.name}</label>
        <input
          type="text"
          id="seed"
          aria-describedby="seed-help"
          .value="${this.seed}"
          @input="${this._seedChanged}"
        />
        <p class="help" id="seed-help">${this.t.nameHelp}</p>
      </div>
      <div class="field">
        <label for="code">${this.t.code}</label>
        <input
          type="text"
          id="code"
          class="code"
          spellcheck="false"
          aria-describedby="code-help code-status"
          .value="${this.code}"
          @change="${this._codeTyped}"
        />
        <p class="help" id="code-help">${this.t.codeHelp}</p>
      </div>
      <div class="buttons">
        <button
          type="button"
          class="btn primary"
          @click="${() => this._copy(this.code)}"
        >
          ${this.t.copyCode}
        </button>
        <button
          type="button"
          class="btn"
          @click="${() => this._copy(this.shareLink)}"
        >
          ${this.t.copyLink}
        </button>
        <button type="button" class="btn" @click="${this.randomize}">
          ${this.t.randomize}
        </button>
      </div>
      <div
        class="status ${invalid ? "error" : ""}"
        id="code-status"
        role="status"
        aria-live="polite"
      >
        ${this.status}
      </div>
    </section>`;
  }

  renderBuilder(character) {
    return html`<section class="card builder" aria-label="${this.t.builder}">
      <div
        role="tablist"
        aria-label="${this.t.builder}"
        @keydown="${this._tabKey}"
      >
        ${tabs.map(
          (name) =>
            html`<button
              type="button"
              role="tab"
              id="tab-${name}"
              aria-controls="panel"
              aria-selected="${this.tab === name ? "true" : "false"}"
              tabindex="${this.tab === name ? "0" : "-1"}"
              @click="${() => {
                this.tab = name;
              }}"
            >
              ${this.t[name]}
            </button>`,
        )}
      </div>
      <div
        role="tabpanel"
        id="panel"
        aria-labelledby="tab-${this.tab}"
        tabindex="0"
      >
        ${this.tab === "look" ? this.renderLook(character) : ""}
        ${this.tab === "style" ? this.renderStyle(character) : ""}
        ${this.tab === "gear" ? this.renderGear(character) : ""}
        ${this.tab === "extras" ? this.renderExtras(character) : ""}
      </div>
    </section>`;
  }

  renderLook(character) {
    return html`<div class="rows">
      ${lookSlots.map(([name, key]) => {
        const values = slotValues(name);
        const current = Number(character[name]);
        const label = this.t[key];
        return html`<div class="field">
          <label for="opt-${name}">${label}</label>
          <div class="stepper">
            <button
              type="button"
              class="step"
              aria-label="${this._fill(this.t.previous, { name: label })}"
              @click="${() => this._step(name, -1)}"
            >
              ‹
            </button>
            <select
              id="opt-${name}"
              data-slot="${name}"
              @change="${(e) => this._set(name, Number(e.target.value))}"
            >
              ${values.map(
                (v) =>
                  html`<option value="${v}" ?selected="${v === current}">
                    ${v + 1}
                  </option>`,
              )}
            </select>
            <span class="variant" aria-hidden="true"
              >${this._fill(this.t.variant, {
                current: values.indexOf(current) + 1,
                total: values.length,
              })}</span
            >
            <button
              type="button"
              class="step"
              aria-label="${this._fill(this.t.next, { name: label })}"
              @click="${() => this._step(name, 1)}"
            >
              ›
            </button>
          </div>
        </div>`;
      })}
    </div>`;
  }

  renderStyle(character) {
    const presets = slotValues("preset");
    return html`
      <div class="field">
        <h2 id="types-title">
          ${this.t.characterType}
          <span class="help"
            >${this._fill(this.t.typesCount, {
              total: presets.length - 1,
            })}</span
          >
        </h2>
        <div class="types" role="group" aria-labelledby="types-title">
          ${presets.map((preset) => {
            const look = { ...character, preset, pose: "none", fire: false };
            const label =
              preset === "none" ? this.t.noneType : this._label("preset", preset);
            return html`<button
              type="button"
              class="type"
              data-preset="${preset}"
              aria-pressed="${character.preset === preset ? "true" : "false"}"
              @click="${() => this._set("preset", preset)}"
            >
              <rpg-character
                aria-hidden="true"
                code="${encodeCharacter(look)}"
                width="48"
                height="60"
              ></rpg-character>
              <span>${label}</span>
            </button>`;
          })}
        </div>
      </div>
      ${chipSlots.map(
        (name) =>
          html`<div class="field">
            <h3 id="chips-${name}">${this._title(name)}</h3>
            <div class="chips" role="group" aria-labelledby="chips-${name}">
              ${slotValues(name).map(
                (value) =>
                  html`<button
                    type="button"
                    class="chip"
                    data-slot="${name}"
                    aria-pressed="${character[name] === value ? "true" : "false"}"
                    @click="${() => this._set(name, value)}"
                  >
                    ${value === "none" ? "-" : this._label(name, value)}
                  </button>`,
              )}
            </div>
          </div>`,
      )}
      <div class="rows">
        ${styleSelects.map((name) => this.renderSelect(name, character))}
      </div>
    `;
  }

  renderGear(character) {
    return html`<div class="rows">
      ${gearSlots.map((name) => this.renderSelect(name, character))}
      <div class="field">
        <label for="opt-flagText">${this.t.flagText}</label>
        <input
          type="text"
          id="opt-flagText"
          maxlength="4"
          data-slot="flagText"
          .value="${character.flagText}"
          @input="${(e) => this._set("flagText", e.target.value)}"
        />
      </div>
    </div>`;
  }

  renderExtras(character) {
    return html`<div class="toggles">
      ${toggleSlots.map(
        (name) =>
          html`<label
            ><input
              type="checkbox"
              data-slot="${name}"
              .checked="${character[name]}"
              @change="${(e) => this._set(name, e.target.checked)}"
            />
            ${name === "circle" ? this.t.circle : this._title(name)}</label
          >`,
      )}
      <label
        ><input
          type="checkbox"
          data-slot="walking"
          .checked="${this.walking}"
          @change="${(e) => {
            this.walking = e.target.checked;
          }}"
        />
        ${this.t.walking}</label
      >
    </div>`;
  }

  renderSelect(name, character) {
    const current = character[name];
    return html`<div class="field">
      <label for="opt-${name}">${this._title(name)}</label>
      <select
        id="opt-${name}"
        data-slot="${name}"
        @change="${(e) => this._set(name, e.target.value)}"
      >
        ${slotValues(name).map(
          (value) =>
            html`<option value="${value}" ?selected="${current === value}">
              ${value === "none" ? "-" : this._label(name, value)}
            </option>`,
        )}
      </select>
    </div>`;
  }

  renderUse() {
    const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareLink)}`;
    return html`<section class="use" id="use" aria-labelledby="use-title">
      <div>
        <h2 id="use-title">${this.t.useHeading}</h2>
        <p>${this.t.useText}</p>
        <span class="label" id="embed-label">${this.t.embedLabel}</span>
        <pre aria-labelledby="embed-label">${this.embedCode}</pre>
        <div class="buttons">
          <button
            type="button"
            class="btn"
            @click="${() => this._copy(this.embedCode)}"
          >
            ${this.t.copyEmbed}
          </button>
        </div>
      </div>
      <div class="note">
        <p>
          ${this.t.magicText}
          <a href="https://hax.cloud/magic-script">${this.t.magicLink}</a>.
        </p>
        <p><a href="${linkedIn}">${this.t.shareLinkedIn}</a></p>
      </div>
    </section>`;
  }
}

globalThis.customElements.define(RpgMe.tag, RpgMe);
