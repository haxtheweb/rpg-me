/**
 * Copyright 2026 The Pennsylvania State University
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";
import "@haxtheweb/simple-fields/lib/simple-fields-field.js";
import "@haxtheweb/simple-tooltip/simple-tooltip.js";
import {
  RpgCharacter,
  traitsFromSeed,
  encodeCharacter,
  decodeCharacter,
  codeSlots,
} from "@haxtheweb/rpg-character/rpg-character.js";

// numeric look traits a name (seed) picks; other choices are kept
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
// slots Surprise me fills about a third of the time
const extraSlots = [
  "hat",
  "mask",
  "makeup",
  "expression",
  "pose",
  "item",
  "offhand",
  "feet",
  "pet",
  "preset",
];
// hats that are really hairstyles, offered in the Hair tab
const hairHats = ["messy-hair", "wild-hair", "flat-top", "wig"];
// on / off effects, each one tile that flips when clicked
const toggleSlots = ["fire", "circle", "seasonal"];
// tiles per page of the option grid
export const PAGE_SIZE = 12;

// regions of rpg-character's 113 x 142 art space, [x, y, w, h], that a tile zooms to
const R = {
  full: [0, 0, 113, 142],
  head: [8, 0, 97, 97],
  face: [20, 42, 73, 56],
  torso: [8, 70, 97, 72],
  legs: [16, 92, 81, 50],
  hands: [10, 40, 103, 102],
  pet: [0, 56, 113, 86],
};
// swatch colors, read from rpg-character's own art (lib/skin, lib/hatColor, lib/hair)
const swatches = {
  skin: [
    "#F7DECE",
    "#F3D2A2",
    "#A7A7A7",
    "#D5AB88",
    "#AF7E57",
    "#7C533E",
    "#FFDC5D",
    "#5DB1FF",
    "#66DE52",
    "#D772C7",
  ],
  hatColor: [
    "#979797",
    "#E40101",
    "#1390EB",
    "#484848",
    "#89EDD5",
    "#E6EB13",
    "#8C13EB",
    "#13EB1B",
    "#E46001",
    "#EB1387",
  ],
  hair: [
    "#F8F8F8",
    "#282828",
    "#A42424",
    "#C47328",
    "#D5EF38",
    "#32923B",
    "#3DAAB1",
    "#46299B",
    "#745336",
    "#E3CE96",
  ],
};
// English names for numbered art; each becomes a this.t key (e.g. shirt3)
const artNames = {
  face: ["Plain", "Frown", "Straight", "Smirk", "Mustache", "Grin"],
  faceItem: [
    "None",
    "Monocle, tinted",
    "Monocle, right",
    "Monocle, left",
    "Eye patch",
    "Eye patch, left",
    "Brown shades",
    "Silver glasses",
    "Gold glasses",
    "Sunglasses",
  ],
  accessories: [
    "None",
    "Gold necklace",
    "Red bow tie",
    "Black bow tie",
    "Blue bow tie",
    "Blue tie",
    "Red tie",
    "Purple tie",
    "Gold chain",
    "Silver chain",
  ],
  shirt: [
    "Black tee",
    "Lace top",
    "White button-up",
    "Red tee",
    "Red long sleeve",
    "Blue long sleeve",
    "White long sleeve",
    "Blue tee",
    "White tee",
    "Black long sleeve",
  ],
  pants: [
    "Black pants",
    "Denim",
    "Charcoal",
    "White pants",
    "White cuffed",
    "Black cuffed",
    "Denim cuffed",
    "Faded denim",
    "Black worn",
    "White worn",
  ],
  skin: [
    "Porcelain",
    "Sand",
    "Stone",
    "Tan",
    "Bronze",
    "Umber",
    "Sunny",
    "Sky",
    "Leaf",
    "Orchid",
  ],
  hatColor: [
    "Gray",
    "Red",
    "Blue",
    "Black",
    "Mint",
    "Yellow",
    "Purple",
    "Green",
    "Orange",
    "Pink",
  ],
  hair: [
    "White",
    "Black",
    "Red",
    "Copper",
    "Lime",
    "Green",
    "Teal",
    "Indigo",
    "Brown",
    "Blonde",
  ],
};
const artKey = (slot, i) => `${slot}${i}`;

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
 * rpg.art.hax.cloud (one of HAX Art's tools): build an rpg-character, keep its code, share a link that
 * recreates it, and drop it into any page that loads HAX.
 *
 * The builder works the way the Wii's Mii editor did: picture tabs (named on
 * hover / focus), a paged grid of picture tiles that show each option on your
 * own character, colors in a column beside the shapes, and a big preview that
 * tries an option on while you hover or focus it.
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
    this.tab = "hair";
    this.section = 0;
    this.page = 0;
    this.status = "";
    this.trying = "";
    this.preview = "";
    this.history = [];
    this.share = false;
    this.tileSize = 84;
    this._labels = {};
    this._slide = 0;
    this.t = {
      eyebrow: "rpg-character",
      heading: "Build your character. Keep its code.",
      preview: "Character preview",
      name: "Name",
      nameHelp: "A name picks a look. Your other choices stay.",
      code: "Character code",
      codeHelp: "Paste a code to load that character.",
      invalidCode: "That is not a character code.",
      copyCode: "Copy code",
      copyLink: "Copy share link",
      copied: "Copied!",
      randomize: "Surprise me",
      undo: "Undo",
      undid: "Undid the last change.",
      walk: "Walk",
      stopWalking: "Stop walking",
      done: "Done, share it",
      builder: "What to change",
      trying: "Trying on: {name}",
      picked: "{section}: {name}",
      removed: "{section}: took off {name}",
      showing: "{first}-{last} of {total}",
      page: "Page {page} of {pages}",
      previousPage: "Previous page",
      nextPage: "Next page",
      on: "On",
      off: "Off",
      none: "None",
      takeOffHint: "Click a chosen one again to take it off.",
      presetHint:
        "You're wearing the {preset} outfit. Picking your own {part} swaps it for your own clothes.",
      hatHint: "Picking a hairstyle takes off your {hat} so you can see it.",
      longHairHint: "Pick Long in Hairstyle to color it.",
      seasonalHint: "Seasonal look changes with the time of year.",
      tabCharacters: "Characters",
      readyMade: "Ready-made characters",
      noneType: "Your own look",
      tabBody: "Body and skin",
      pose: "Pose",
      skin: "Skin",
      hair: "Hair",
      hairstyle: "Hairstyle",
      short: "Short",
      long: "Long",
      shaved: "Shaved",
      hairColor: "Hair color",
      longHairColor: "Long hair color",
      face: "Face",
      mouth: "Mouth",
      expression: "Expression",
      glasses: "Glasses",
      hats: "Hats",
      disguise: "Masks and makeup",
      masks: "Masks",
      makeup: "Makeup",
      outfit: "Outfit",
      shirt: "Shirt",
      pants: "Pants",
      neckwear: "Neckwear",
      heldItems: "Held items",
      rightHand: "Right hand",
      leftHand: "Left hand",
      flagText: "Flag text",
      flagTextHelp: "Up to 4 letters on the flag.",
      feet: "Feet",
      pets: "Pets",
      effects: "Effects",
      fire: "Fire",
      circle: "Circle background",
      seasonal: "Seasonal look",
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
      network: "Part of HAX Art, in the HAX network.",
      art: "HAX Art",
    };
    Object.keys(artNames).forEach((slot) => {
      artNames[slot].forEach((name, i) => {
        this.t[artKey(slot, i)] = name;
      });
    });
    this.registerLocalization({
      context: this,
      localesPath: new URL("./locales/", import.meta.url).href,
    });
    this._resize = () => {
      // four tiles must fit across a phone's card
      const width = globalThis.innerWidth;
      const size = width < 420 ? 58 : width < 600 ? 68 : 84;
      if (size !== this.tileSize) {
        this.tileSize = size;
      }
    };
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
      /** Builder tab on screen */
      tab: { type: String },
      section: { type: Number, state: true },
      page: { type: Number, state: true },
      status: { type: String, state: true },
      trying: { type: String, state: true },
      preview: { type: String, state: true },
      history: { type: Array, state: true },
      share: { type: Boolean, state: true },
      tileSize: { type: Number, state: true },
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
    this._resize();
    globalThis.addEventListener("resize", this._resize);
    this._loadLabels();
  }

  disconnectedCallback() {
    globalThis.removeEventListener("resize", this._resize);
    super.disconnectedCallback();
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
    if (this._slide) {
      // slide the new page of tiles in from the side it came from, so it
      // reads as more options and not the same grid changing
      const grid = this.shadowRoot.querySelector(".grid");
      const still =
        globalThis.matchMedia &&
        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (grid && grid.animate && !still) {
        grid.animate(
          [
            { transform: `translateX(${this._slide * 48}px)`, opacity: 0 },
            { transform: "translateX(0)", opacity: 1 },
          ],
          { duration: 220, easing: "ease-out" },
        );
      }
      this._slide = 0;
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
      // labels fall back to option names
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

  _label(name, value) {
    const entry = this._labels[name];
    if (entry && entry.options && entry.options[value]) {
      return entry.options[value];
    }
    if (value === "none") {
      return this.t.none;
    }
    const text = String(value).replace(/-/g, " ");
    return text.charAt(0).toUpperCase() + text.substring(1);
  }

  _fill(text, values) {
    return Object.keys(values).reduce(
      (out, key) => out.replace(`{${key}}`, () => values[key]),
      text,
    );
  }

  /** the code with some slots changed (and one slot cleared, if asked) */
  _with(set, clears) {
    const character = { ...this.character, ...set };
    if (clears) {
      character[clears] = "none";
    }
    return encodeCharacter(character);
  }

  _isOn(option) {
    const character = this.character;
    return Object.keys(option.set).every((k) => character[k] === option.set[k]);
  }

  /** what a slot goes back to when its chosen tile is clicked again, if anything */
  _offValue(slot) {
    const values = slotValues(slot);
    if (values[0] === "none" || typeof values[0] === "boolean") {
      return values[0];
    }
    if (slot === "faceItem" || slot === "accessories") {
      return 0;
    }
    return null;
  }

  _commit(code) {
    if (code !== this.code) {
      this.history = [...this.history.slice(-29), this.code];
      this.code = code;
    }
    this.preview = "";
    this.trying = "";
  }

  undo() {
    if (this.history.length) {
      this.code = this.history[this.history.length - 1];
      this.history = this.history.slice(0, -1);
      this.status = this.t.undid;
    }
  }

  _seedChanged(e) {
    const value = e.detail.value || "";
    if (value === this.seed) {
      return;
    }
    this.seed = value;
    // a new name gives a new look; every other choice is kept
    const character = this.character;
    const traits = traitsFromSeed(this.seed || "hax");
    lookSlots.forEach(([slot]) => {
      character[slot] = Number(traits[slot]);
    });
    this._commit(encodeCharacter(character));
  }

  _codeTyped(e) {
    const value = (e.detail.value || "").trim();
    if (value === this.code) {
      return;
    }
    if (decodeCharacter(value)) {
      this._commit(value);
      this.status = "";
    } else {
      this.status = this.t.invalidCode;
    }
  }

  randomize() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const character = traitsFromSeed(Math.random().toString(36).substring(2));
    character.base = Number(character.base);
    extraSlots.forEach((name) => {
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

  // ---------- builder model ----------

  _slotOptions(slot, region, named) {
    return slotValues(slot).map((value, i) => ({
      key: `${slot}-${value}`,
      slot,
      label: named ? this.t[artKey(slot, i)] : this._label(slot, value),
      set: { [slot]: value },
      region,
    }));
  }

  /** the tabs, in order: id, label, icon (a character code + region), sections of tiles, side swatches */
  get tabs() {
    const t = this.t;
    const icon = (set, region) => ({
      code: encodeCharacter({
        base: 0,
        skin: 0,
        hatColor: 3,
        shirt: 7,
        pants: 1,
        ...set,
      }),
      region,
    });
    const styles = [
      {
        key: "short",
        label: t.short,
        set: { base: 0, shaved: false, hat: "none" },
      },
      {
        key: "long",
        label: t.long,
        set: { base: 1, shaved: false, hat: "none" },
      },
      { key: "shaved", label: t.shaved, set: { shaved: true, hat: "none" } },
      ...hairHats.map((hat) => ({
        key: hat,
        label: this._label("hat", hat),
        set: { hat, shaved: false },
      })),
    ].map((o) => ({ ...o, region: R.head }));
    return [
      {
        id: "character",
        label: t.tabCharacters,
        icon: icon({ preset: "knight" }, R.full),
        sections: [
          {
            name: t.readyMade,
            options: slotValues("preset").map((preset) => ({
              key: `preset-${preset}`,
              slot: "preset",
              label:
                preset === "none" ? t.noneType : this._label("preset", preset),
              set: { preset },
              region: R.full,
            })),
          },
        ],
      },
      {
        id: "body",
        label: t.tabBody,
        icon: icon({}, R.full),
        sections: [
          { name: t.pose, options: this._slotOptions("pose", R.full) },
        ],
        side: [{ slot: "skin", name: t.skin }],
      },
      {
        id: "hair",
        label: t.hair,
        icon: icon({ base: 1, hair: 3 }, [8, 40, 97, 70]),
        sections: [{ name: t.hairstyle, options: styles, fixed: true }],
        side: [
          { slot: "hatColor", name: t.hairColor },
          { slot: "hair", name: t.longHairColor, long: true },
        ],
      },
      {
        id: "face",
        label: t.face,
        icon: icon({ face: 5 }, [14, 46, 85, 50]),
        sections: [
          { name: t.mouth, options: this._slotOptions("face", R.face, true) },
          {
            name: t.expression,
            options: this._slotOptions("expression", R.face),
          },
        ],
      },
      {
        id: "glasses",
        label: t.glasses,
        icon: icon({ faceItem: 9 }, [20, 52, 73, 36]),
        sections: [
          {
            name: t.glasses,
            options: this._slotOptions("faceItem", R.face, true),
          },
        ],
      },
      {
        id: "hat",
        label: t.hats,
        icon: icon({ hat: "top-hat" }, [8, 0, 97, 62]),
        sections: [{ name: t.hats, options: this._slotOptions("hat", R.head) }],
      },
      {
        id: "disguise",
        label: t.disguise,
        icon: icon({ mask: "theater" }, R.head),
        sections: [
          { name: t.masks, options: this._slotOptions("mask", R.head) },
          { name: t.makeup, options: this._slotOptions("makeup", R.face) },
        ],
      },
      {
        id: "outfit",
        label: t.outfit,
        icon: icon({ shirt: 3, accessories: 6 }, [18, 78, 77, 40]),
        sections: [
          {
            name: t.shirt,
            options: this._slotOptions("shirt", R.torso, true),
            clears: "preset",
            fixed: true,
          },
          {
            name: t.pants,
            options: this._slotOptions("pants", R.legs, true),
            clears: "preset",
            fixed: true,
          },
          {
            name: t.neckwear,
            options: this._slotOptions("accessories", R.torso, true),
          },
        ],
      },
      {
        id: "hands",
        label: t.heldItems,
        icon: icon({ item: "sword" }, [56, 36, 57, 90]),
        sections: [
          { name: t.rightHand, options: this._slotOptions("item", R.hands) },
          { name: t.leftHand, options: this._slotOptions("offhand", R.hands) },
        ],
      },
      {
        id: "feet",
        label: t.feet,
        icon: icon({ feet: "skateboard" }, [12, 100, 89, 42]),
        sections: [
          { name: t.feet, options: this._slotOptions("feet", R.legs) },
        ],
      },
      {
        id: "pet",
        label: t.pets,
        icon: icon({ pet: "cat" }, [0, 90, 52, 52]),
        sections: [{ name: t.pets, options: this._slotOptions("pet", R.pet) }],
      },
      {
        id: "effects",
        label: t.effects,
        icon: icon({ fire: true }, R.full),
        sections: [
          {
            name: t.effects,
            toggles: true,
            options: [
              ...toggleSlots.map((slot) => ({
                key: slot,
                slot,
                label: t[slot],
                set: { [slot]: true },
                region: R.full,
              })),
              {
                key: "walking",
                label: t.walking,
                walking: true,
                region: R.full,
              },
            ],
          },
        ],
      },
    ];
  }

  get tabDef() {
    const tabs = this.tabs;
    return tabs.find((tab) => tab.id === this.tab) || tabs[0];
  }

  _setTab(id) {
    this.tab = id;
    this.section = 0;
    this.page = 0;
    this._untry();
  }

  _tabKey(e) {
    const ids = this.tabs.map((tab) => tab.id);
    const at = ids.indexOf(this.tab);
    let next = null;
    if (e.key === "ArrowRight") next = ids[(at + 1) % ids.length];
    if (e.key === "ArrowLeft") next = ids[(at - 1 + ids.length) % ids.length];
    if (e.key === "Home") next = ids[0];
    if (e.key === "End") next = ids[ids.length - 1];
    if (next) {
      e.preventDefault();
      this._setTab(next);
      this.updateComplete.then(() => {
        const button = this.shadowRoot.querySelector(`#tab-${next}`);
        if (button) {
          button.focus();
        }
      });
    }
  }

  _goPage(page) {
    if (page === this.page) {
      return;
    }
    this._slide = page > this.page ? 1 : -1;
    this.page = page;
    this._untry();
  }

  /**
   * What clicking (or trying) a tile does: a toggle flips; a chosen tile of a
   * slot that can be empty goes back to empty; anything else is picked.
   */
  _result(option, section) {
    if (option.walking) {
      return { code: this.code, walking: !this.walking, on: !this.walking };
    }
    if (section.toggles) {
      const on = !this.character[option.slot];
      return { code: this._with({ [option.slot]: on }), on };
    }
    if (this._isOn(option) && option.slot && !section.fixed) {
      const off = this._offValue(option.slot);
      if (off !== null && option.set[option.slot] !== off) {
        return { code: this._with({ [option.slot]: off }), removed: true };
      }
    }
    return { code: this._with(option.set, section.clears) };
  }

  _optionOn(option) {
    if (option.walking) {
      return this.walking;
    }
    return this._isOn(option);
  }

  _try(option, section) {
    const result = this._result(option, section);
    this.preview = result.code;
    this.trying = option.label;
    if (option.walking) {
      this.preview = "";
    }
  }

  _untry() {
    this.preview = "";
    this.trying = "";
  }

  _pick(option, section) {
    const result = this._result(option, section);
    if (option.walking) {
      this.walking = result.walking;
    } else {
      this._commit(result.code);
    }
    let text = this._fill(this.t.picked, {
      section: section.name,
      name: option.label,
    });
    if (section.toggles) {
      text = this._fill(this.t.picked, {
        section: option.label,
        name: result.on ? this.t.on : this.t.off,
      });
    } else if (result.removed) {
      text = this._fill(this.t.removed, {
        section: section.name,
        name: option.label,
      });
    }
    this.status = text;
  }

  _swatchTry(side, i) {
    this.preview = this._with({ [side.slot]: i });
    this.trying = `${side.name}: ${this.t[artKey(side.slot, i)]}`;
  }

  /** a square window onto a character, zoomed to a region of its art */
  _crop(code, region, size) {
    const [x, y, w, h] = region;
    const most = Math.max(w, h);
    const scale = size / most;
    const left = (-x + (most - w) / 2) * scale;
    const top = (-y + (most - h) / 2) * scale;
    return html`<span class="crop" style="width:${size}px;height:${size}px"
      ><rpg-character
        aria-hidden="true"
        code="${code}"
        width="${Math.round(113 * scale)}"
        height="${Math.round(142 * scale)}"
        style="left:${left}px;top:${top}px"
      ></rpg-character
    ></span>`;
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
          --rpgme-on: light-dark(
            var(--ddd-theme-default-opportunityGreen),
            var(--ddd-theme-default-futureLime)
          );
          --rpgme-on-ink: light-dark(
            var(--ddd-theme-default-white),
            var(--ddd-theme-default-coalyGray)
          );
          --rpgme-on-bg: light-dark(
            var(--ddd-theme-default-successLight),
            var(--ddd-theme-default-success)
          );
          --rpgme-tile-a: light-dark(
            var(--ddd-theme-default-white),
            var(--ddd-theme-default-slateGray)
          );
          --rpgme-tile-b: light-dark(
            var(--ddd-theme-default-limestoneLight),
            var(--ddd-theme-default-potentialMidnight)
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
          flex: 1 1 300px;
          max-width: 400px;
          padding: var(--ddd-spacing-5);
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-3);
        }
        .stage {
          position: relative;
          margin: 0;
          width: 100%;
          aspect-ratio: 1 / 1.05;
          border-radius: var(--ddd-radius-xl);
          border: var(--ddd-border-xs);
          border-color: var(--rpgme-line);
          background: radial-gradient(
            circle at 50% 42%,
            var(--rpgme-bg) 0,
            var(--rpgme-band) 64%
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trying {
          position: absolute;
          bottom: var(--ddd-spacing-3);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          max-width: 92%;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: var(--ddd-font-size-4xs);
          background-color: var(--rpgme-heading);
          color: var(--rpgme-bg);
          padding: 2px var(--ddd-spacing-3);
          border-radius: var(--ddd-radius-rounded);
        }
        simple-fields-field {
          --simple-fields-color: var(--rpgme-fg);
          --simple-fields-background-color: var(--rpgme-bg);
          --simple-fields-border-color: var(--rpgme-muted);
          --simple-fields-border-color-light: var(--rpgme-line);
          --simple-fields-accent-color: var(--rpgme-accent);
          --simple-fields-font-size: var(--ddd-font-size-4xs);
          --simple-fields-detail-font-size: var(--ddd-font-size-4xs);
          padding: var(--ddd-spacing-2) var(--ddd-spacing-3);
          background-color: var(--rpgme-bg);
          border: var(--ddd-border-xs);
          border-color: var(--rpgme-line);
          border-radius: var(--ddd-radius-md);
        }
        .buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--ddd-spacing-2);
        }
        .btn {
          min-height: var(--ddd-spacing-11);
          padding: 0 var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-rounded);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          cursor: pointer;
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-heading);
        }
        .btn:hover {
          border-color: var(--rpgme-heading);
        }
        .btn:active {
          transform: translateY(1px);
        }
        .btn.primary {
          border-color: var(--rpgme-heading);
          background-color: var(--rpgme-heading);
          color: var(--rpgme-bg);
        }
        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }
        .sharebox {
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-2);
          padding: var(--ddd-spacing-3);
          border-radius: var(--ddd-radius-md);
          border: var(--ddd-border-xs);
          border-style: dashed;
          border-color: var(--rpgme-line);
        }
        .status {
          min-height: 1.5em;
          margin: 0;
          text-align: center;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-heading);
        }
        .status.error {
          color: var(--ddd-theme-default-error);
        }

        .label {
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          color: var(--rpgme-heading);
        }

        /* picture tabs */
        .tabs {
          border-block: var(--ddd-border-xs);
          border-color: var(--rpgme-line);
          background-color: var(--rpgme-band);
          margin-bottom: var(--ddd-spacing-6);
        }
        .tabs .wrap {
          overflow-x: auto;
          scrollbar-width: thin;
        }
        [role="tablist"] {
          display: flex;
          gap: var(--ddd-spacing-2);
          padding-block: var(--ddd-spacing-3);
        }
        [role="tab"] {
          flex: none;
          width: 60px;
          height: 56px;
          padding: 0;
          display: grid;
          place-items: center;
          border-radius: var(--ddd-radius-md);
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background: linear-gradient(var(--rpgme-tile-a), var(--rpgme-tile-b));
          cursor: pointer;
          transition: transform 0.12s ease;
        }
        [role="tab"]:hover {
          transform: translateY(-2px);
          border-color: var(--rpgme-muted);
        }
        [role="tab"][aria-selected="true"] {
          background: var(--rpgme-on);
          border-color: var(--rpgme-on);
        }
        [role="tab"][aria-selected="true"] .crop {
          background-color: var(--ddd-theme-default-white);
          border-radius: var(--ddd-radius-sm);
        }

        /* option board */
        .builder {
          flex: 999 1 560px;
          min-width: 0;
          padding: var(--ddd-spacing-5);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--ddd-spacing-5);
          align-content: start;
        }
        .builder.noside {
          grid-template-columns: minmax(0, 1fr);
        }
        .board-head {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--ddd-spacing-2);
        }
        .board-head h2 {
          margin-right: auto;
        }
        .seg {
          min-height: var(--ddd-spacing-9);
          padding: 0 var(--ddd-spacing-3);
          border-radius: var(--ddd-radius-rounded);
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background-color: transparent;
          color: var(--rpgme-fg);
          font-family: var(--ddd-font-navigation);
          font-size: var(--ddd-font-size-4xs);
          cursor: pointer;
        }
        .seg[aria-pressed="true"] {
          background-color: var(--rpgme-on-bg);
          border-color: var(--rpgme-on);
          font-weight: var(--ddd-font-weight-bold);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, max-content);
          gap: var(--ddd-spacing-3);
          padding-bottom: var(--ddd-spacing-6);
        }
        .tile {
          position: relative;
          display: block;
          padding: var(--ddd-spacing-1);
          border-radius: var(--ddd-radius-md);
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background: linear-gradient(var(--rpgme-tile-a), var(--rpgme-tile-b));
          cursor: pointer;
          transition:
            transform 0.14s ease,
            box-shadow 0.14s ease;
        }
        .tile[aria-pressed="true"] {
          background: var(--rpgme-on-bg);
          border-color: var(--rpgme-on);
          box-shadow: inset 0 0 0 2px var(--rpgme-on);
        }
        .tile .check {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          border-radius: var(--ddd-radius-circle);
          background-color: var(--rpgme-on);
          color: var(--rpgme-on-ink);
          display: grid;
          place-items: center;
        }
        .tile .state {
          position: absolute;
          top: var(--ddd-spacing-1);
          left: var(--ddd-spacing-1);
          padding: 0 6px;
          border-radius: var(--ddd-radius-rounded);
          font-size: 11px;
          font-weight: var(--ddd-font-weight-bold);
          background-color: var(--rpgme-line);
          color: var(--rpgme-fg);
          z-index: 1;
        }
        .tile[aria-pressed="true"] .state {
          background-color: var(--rpgme-on);
          color: var(--rpgme-on-ink);
        }
        .tile:hover,
        .tile:focus-visible {
          transform: scale(1.28);
          z-index: 3;
          box-shadow: var(--ddd-boxShadow-lg);
        }
        .lbl {
          position: absolute;
          left: 50%;
          top: calc(100% + 4px);
          transform: translateX(-50%) scale(0.8);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          background-color: var(--rpgme-heading);
          color: var(--rpgme-bg);
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          padding: 2px var(--ddd-spacing-2);
          border-radius: var(--ddd-radius-rounded);
          transition: opacity 0.12s ease;
          z-index: 4;
        }
        .tile:hover .lbl,
        .tile:focus-visible .lbl,
        .sw:hover .lbl,
        .sw:focus-visible .lbl {
          opacity: 1;
        }
        .crop {
          position: relative;
          display: block;
          overflow: hidden;
        }
        .crop rpg-character {
          position: absolute;
          pointer-events: none;
        }
        .pager {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--ddd-spacing-2);
          margin-top: var(--ddd-spacing-2);
        }
        .count {
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-muted);
          font-variant-numeric: tabular-nums;
          margin-right: var(--ddd-spacing-2);
        }
        .arrow {
          width: var(--ddd-spacing-11);
          height: var(--ddd-spacing-11);
          border-radius: var(--ddd-radius-circle);
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background: linear-gradient(var(--rpgme-tile-a), var(--rpgme-tile-b));
          color: var(--rpgme-heading);
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .dots {
          display: flex;
          gap: 2px;
        }
        .dot {
          width: 28px;
          height: 28px;
          padding: 0;
          border: 0;
          background: transparent;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .dot span {
          width: 10px;
          height: 10px;
          border-radius: var(--ddd-radius-circle);
          border: 2px solid var(--rpgme-muted);
        }
        .dot[aria-current="true"] span {
          width: 22px;
          border-radius: var(--ddd-radius-rounded);
          background-color: var(--rpgme-on);
          border-color: var(--rpgme-on);
        }
        .hint {
          margin: 0 0 var(--ddd-spacing-2);
          max-width: 60ch;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-muted);
        }

        /* colors beside the shapes */
        .side {
          display: flex;
          flex-direction: column;
          gap: var(--ddd-spacing-4);
        }
        .side h3 {
          margin-bottom: var(--ddd-spacing-2);
          font-size: var(--ddd-font-size-4xs);
        }
        .swatches {
          display: grid;
          grid-template-columns: repeat(5, 44px);
          gap: 6px;
        }
        .sw {
          position: relative;
          width: 44px;
          height: 44px;
          padding: 5px;
          border-radius: var(--ddd-radius-sm);
          border: var(--ddd-border-sm);
          border-color: var(--rpgme-line);
          background-color: var(--rpgme-bg);
          cursor: pointer;
          transition: transform 0.12s ease;
        }
        .sw .c {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.14);
        }
        .sw[aria-pressed="true"] {
          border-color: var(--rpgme-on);
          box-shadow: 0 0 0 2px var(--rpgme-on);
        }
        .sw:hover,
        .sw:focus-visible {
          transform: scale(1.18);
          z-index: 3;
        }
        .sw:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }

        /* use it */
        .use {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 380px), 1fr)
          );
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
          h1 {
            font-size: var(--ddd-font-size-l);
          }
          .builder {
            grid-template-columns: minmax(0, 1fr);
            padding: var(--ddd-spacing-4);
          }
          .preview {
            max-width: none;
          }
        }
        @media (max-width: 600px) {
          .stage {
            aspect-ratio: auto;
            height: 268px;
          }
          .grid {
            gap: var(--ddd-spacing-2);
          }
          footer .note {
            margin-left: 0;
          }
        }
        @media (min-width: 1200px) {
          .builder.noside .grid {
            grid-template-columns: repeat(6, max-content);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none;
          }
          .tile:hover,
          .tile:focus-visible,
          .sw:hover,
          .sw:focus-visible,
          [role="tab"]:hover {
            transform: none;
          }
        }
      `,
    ];
  }

  render() {
    const character = this.character;
    const invalid = this.status === this.t.invalidCode;
    const tabs = this.tabs;
    return html`
      <main>
        <div class="wrap">
          <hgroup>
            <p class="eyebrow">${this.t.eyebrow}</p>
            <h1>${this.t.heading}</h1>
          </hgroup>
        </div>
        <nav class="tabs" aria-label="${this.t.builder}">
          <div class="wrap">
            <div
              role="tablist"
              aria-label="${this.t.builder}"
              @keydown="${this._tabKey}"
            >
              ${tabs.map(
                (tab) =>
                  html`<button
                    type="button"
                    role="tab"
                    id="tab-${tab.id}"
                    aria-controls="panel"
                    aria-label="${tab.label}"
                    aria-selected="${this.tab === tab.id ? "true" : "false"}"
                    tabindex="${this.tab === tab.id ? "0" : "-1"}"
                    @click="${() => this._setTab(tab.id)}"
                  >
                    ${this._crop(tab.icon.code, tab.icon.region, 40)}
                  </button>`,
              )}
            </div>
            ${tabs.map(
              (tab) =>
                html`<simple-tooltip
                  for="tab-${tab.id}"
                  position="bottom"
                  offset="4"
                  >${tab.label}</simple-tooltip
                >`,
            )}
          </div>
        </nav>
        <div class="wrap">
          <div class="columns" id="build">
            ${this.renderPreview(invalid)} ${this.renderBuilder(character)}
          </div>
          ${this.renderUse()}
        </div>
      </main>
      <footer>
        <div class="wrap">
          <a href="https://github.com/haxtheweb/rpg-me">${this.t.source}</a>
          <a href="https://webcomponents.hax.cloud">${this.t.element}</a>
          <a href="https://art.hax.cloud/">${this.t.art}</a>
          <span class="note">${this.t.network}</span>
        </div>
      </footer>
    `;
  }

  renderPreview(invalid) {
    const big = this.tileSize > 70;
    return html`<section class="card preview" aria-label="${this.t.preview}">
      <figure class="stage">
        <rpg-character
          code="${this.preview || this.code}"
          ?walking="${this.walking}"
          width="${big ? 226 : 190}"
          height="${big ? 284 : 239}"
        ></rpg-character>
        ${
          this.trying
            ? html`<figcaption class="trying">
                ${this._fill(this.t.trying, { name: this.trying })}
              </figcaption>`
            : ""
        }
      </figure>
      <simple-fields-field
        id="seed"
        label="${this.t.name}"
        description="${this.t.nameHelp}"
        .value="${this.seed}"
        @value-changed="${this._seedChanged}"
      ></simple-fields-field>
      <div class="buttons">
        <button
          type="button"
          class="btn"
          ?disabled="${!this.history.length}"
          @click="${this.undo}"
        >
          ${this.t.undo}
        </button>
        <button type="button" class="btn" @click="${this.randomize}">
          ${this.t.randomize}
        </button>
        <button
          type="button"
          class="btn"
          aria-pressed="${this.walking ? "true" : "false"}"
          @click="${() => {
            this.walking = !this.walking;
          }}"
        >
          ${this.walking ? this.t.stopWalking : this.t.walk}
        </button>
        <button
          type="button"
          class="btn primary"
          aria-expanded="${this.share ? "true" : "false"}"
          aria-controls="sharebox"
          @click="${() => {
            this.share = !this.share;
          }}"
        >
          ${this.t.done}
        </button>
      </div>
      ${
        this.share
          ? html`<div class="sharebox" id="sharebox">
              <simple-fields-field
                id="code"
                label="${this.t.code}"
                description="${this.t.codeHelp}"
                .value="${this.code}"
                @value-changed="${this._codeTyped}"
              ></simple-fields-field>
              <div class="buttons">
                <button
                  type="button"
                  class="btn"
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
                <button
                  type="button"
                  class="btn"
                  @click="${() => this._copy(this.embedCode)}"
                >
                  ${this.t.copyEmbed}
                </button>
              </div>
            </div>`
          : ""
      }
      <p
        class="status ${invalid ? "error" : ""}"
        id="code-status"
        role="status"
        aria-live="polite"
      >
        ${this.status}
      </p>
    </section>`;
  }

  renderBuilder(character) {
    const tab = this.tabDef;
    const section = tab.sections[this.section] || tab.sections[0];
    const total = section.options.length;
    const pages = Math.ceil(total / PAGE_SIZE);
    const page = Math.min(this.page, pages - 1);
    const first = page * PAGE_SIZE;
    const options = section.options.slice(first, first + PAGE_SIZE);
    const removable = section.options.some(
      (o) =>
        o.slot &&
        !section.fixed &&
        !section.toggles &&
        this._offValue(o.slot) !== null,
    );
    const flag = ["flag", "sparkle-flag"].includes(character.item);
    const hasSide = tab.side || (tab.id === "hands" && flag);
    return html`<section
      class="card builder ${hasSide ? "" : "noside"}"
      role="tabpanel"
      id="panel"
      aria-labelledby="tab-${tab.id}"
    >
      <div class="board-head">
        <h2>${tab.label}</h2>
        ${
          tab.sections.length > 1
            ? tab.sections.map(
                (s, i) =>
                  html`<button
                    type="button"
                    class="seg"
                    aria-pressed="${i === this.section ? "true" : "false"}"
                    @click="${() => {
                      this.section = i;
                      this.page = 0;
                      this._untry();
                    }}"
                  >
                    ${s.name}
                  </button>`,
              )
            : ""
        }
      </div>
      <div>
        <div class="grid" role="group" aria-label="${section.name}">
          ${options.map((option) => this.renderTile(option, section))}
        </div>
        ${pages > 1 ? this.renderPager(page, pages, first, options.length, total) : ""}
        ${this.renderHints(tab, section, character, removable)}
      </div>
      ${
        hasSide
          ? html`<div class="side">
              ${(tab.side || []).map((side) => this.renderSwatches(side, character))}
              ${
                tab.id === "hands" && flag
                  ? html`<simple-fields-field
                      id="flag-text"
                      label="${this.t.flagText}"
                      description="${this.t.flagTextHelp}"
                      maxlength="4"
                      .value="${character.flagText}"
                      @value-changed="${(e) => {
                        const value = (e.detail.value || "").substring(0, 4);
                        if (value !== this.character.flagText) {
                          this._commit(this._with({ flagText: value }));
                        }
                      }}"
                    ></simple-fields-field>`
                  : ""
              }
            </div>`
          : ""
      }
    </section>`;
  }

  renderTile(option, section) {
    const on = this._optionOn(option);
    // toggles always show the effect on, so the tile says what it does
    const code =
      section.toggles && option.slot
        ? this._with({ [option.slot]: true })
        : this._with(option.set || {}, section.clears);
    return html`<button
      type="button"
      class="tile"
      data-option="${option.key}"
      aria-label="${option.label}"
      aria-pressed="${on ? "true" : "false"}"
      @pointerenter="${() => this._try(option, section)}"
      @pointerleave="${this._untry}"
      @focus="${() => this._try(option, section)}"
      @blur="${this._untry}"
      @click="${() => this._pick(option, section)}"
    >
      ${
        section.toggles
          ? html`<span class="state" aria-hidden="true"
              >${on ? this.t.on : this.t.off}</span
            >`
          : ""
      }
      ${this._crop(code, option.region, this.tileSize)}
      ${
        on && !section.toggles
          ? html`<span class="check" aria-hidden="true"
              ><svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M2 6.5 5 9.5 10 3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ></path></svg
            ></span>`
          : ""
      }
      <span class="lbl" aria-hidden="true">${option.label}</span>
    </button>`;
  }

  renderPager(page, pages, first, shown, total) {
    const showing = this._fill(this.t.showing, {
      first: first + 1,
      last: first + shown,
      total,
    });
    return html`<div class="pager">
      <span class="count" aria-live="polite">${showing}</span>
      <button
        type="button"
        class="arrow"
        aria-label="${this.t.previousPage}"
        ?disabled="${page === 0}"
        @click="${() => this._goPage(page - 1)}"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M10 2 4 8l6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          ></path>
        </svg>
      </button>
      <span class="dots">
        ${Array.from({ length: pages }, (_, i) => i).map(
          (i) =>
            html`<button
              type="button"
              class="dot"
              aria-label="${this._fill(this.t.page, { page: i + 1, pages })}"
              aria-current="${i === page ? "true" : "false"}"
              @click="${() => this._goPage(i)}"
            >
              <span></span>
            </button>`,
        )}
      </span>
      <button
        type="button"
        class="arrow"
        aria-label="${this.t.nextPage}"
        ?disabled="${page >= pages - 1}"
        @click="${() => this._goPage(page + 1)}"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="m6 2 6 6-6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          ></path>
        </svg>
      </button>
    </div>`;
  }

  renderHints(tab, section, character, removable) {
    const hints = [];
    if (removable) {
      hints.push(this.t.takeOffHint);
    }
    if (section.clears && character.preset !== "none") {
      hints.push(
        this._fill(this.t.presetHint, {
          preset: this._label("preset", character.preset),
          part: section.name.toLowerCase(),
        }),
      );
    }
    if (
      tab.id === "hair" &&
      character.hat !== "none" &&
      !hairHats.includes(character.hat)
    ) {
      hints.push(
        this._fill(this.t.hatHint, {
          hat: this._label("hat", character.hat).toLowerCase(),
        }),
      );
    }
    if (tab.id === "effects") {
      hints.push(this.t.seasonalHint);
    }
    return hints.map((hint) => html`<p class="hint">${hint}</p>`);
  }

  renderSwatches(side, character) {
    const off = side.long && character.base !== 1;
    return html`<div role="group" aria-labelledby="side-${side.slot}">
      <h3 id="side-${side.slot}">${side.name}</h3>
      <div class="swatches">
        ${swatches[side.slot].map((hex, i) => {
          const name = this.t[artKey(side.slot, i)];
          return html`<button
            type="button"
            class="sw"
            data-swatch="${side.slot}-${i}"
            aria-label="${side.name}: ${name}"
            aria-pressed="${Number(character[side.slot]) === i ? "true" : "false"}"
            ?disabled="${off}"
            @pointerenter="${() => {
              if (!off) this._swatchTry(side, i);
            }}"
            @pointerleave="${this._untry}"
            @focus="${() => this._swatchTry(side, i)}"
            @blur="${this._untry}"
            @click="${() => {
              this._commit(this._with({ [side.slot]: i }));
              this.status = this._fill(this.t.picked, {
                section: side.name,
                name,
              });
            }}"
          >
            <span class="c" style="background-color:${hex}"></span
            ><span class="lbl" aria-hidden="true">${name}</span>
          </button>`;
        })}
      </div>
      ${off ? html`<p class="hint">${this.t.longHairHint}</p>` : ""}
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
