/**
 * Copyright 2026 The Pennsylvania State University
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";
import "@haxtheweb/rpg-character/lib/rpg-character-builder.js";

// RPG me's address handling lives in the builder (sync-url); re-exported so
// links keep working the same way everywhere
export { characterFromParams } from "@haxtheweb/rpg-character/lib/rpg-character-builder.js";

/**
 * `rpg-me`
 * rpg.art.hax.cloud (one of HAX Art's tools): the same rpg-character-builder
 * HAXcms uses for your character, with sync-url on so the address bar is
 * always a share link, plus how to use the code anywhere.
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
    this.walking = false;
    this.status = "";
    this.t = {
      eyebrow: "rpg-character",
      heading: "Build your character. Keep its code.",
      builderHeading: "Character builder",
      copied: "Copied!",
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
    this.registerLocalization({
      context: this,
      localesPath: new URL("./locales/", import.meta.url).href,
    });
    // walking is preview-only, so the builder reflects it instead of firing
    // value-changed; watch the attribute to keep the embed code in step
    this._walkWatch = new MutationObserver(() => {
      if (this.builder) {
        this.walking = this.builder.walking;
      }
    });
  }

  static get properties() {
    return {
      ...super.properties,
      /** The code on screen, as the builder reports it */
      code: { type: String },
      /** Preview walking, as the builder reports it */
      walking: { type: Boolean },
      status: { type: String, state: true },
    };
  }

  get builder() {
    return this.shadowRoot
      ? this.shadowRoot.querySelector("rpg-character-builder")
      : null;
  }

  firstUpdated(changed) {
    if (super.firstUpdated) {
      super.firstUpdated(changed);
    }
    const builder = this.builder;
    this._walkWatch.observe(builder, {
      attributes: true,
      attributeFilter: ["walking"],
    });
    builder.updateComplete.then(() => {
      this.code = builder.code;
      this.walking = builder.walking;
    });
  }

  disconnectedCallback() {
    this._walkWatch.disconnect();
    super.disconnectedCallback();
  }

  get shareLink() {
    const params = new URLSearchParams({ code: this.code });
    if (this.walking) {
      params.set("walking", "true");
    }
    return `${globalThis.location.origin}/?${params.toString()}`;
  }

  get embedCode() {
    return `<rpg-character code="${this.code}"${this.walking ? " walking" : ""}></rpg-character>`;
  }

  async _copy(text) {
    try {
      await globalThis.navigator.clipboard.writeText(text);
      this.status = this.t.copied;
    } catch {
      this.status = text;
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
        button {
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

        .builder-card {
          overflow: hidden;
        }
        .buttons {
          display: flex;
          flex-wrap: wrap;
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
          border-color: var(--rpgme-heading);
          background-color: var(--rpgme-bg);
          color: var(--rpgme-heading);
        }
        .btn:hover {
          background-color: var(--rpgme-band);
        }
        .btn:active {
          transform: translateY(1px);
        }
        .label {
          font-size: var(--ddd-font-size-4xs);
          font-weight: var(--ddd-font-weight-bold);
          color: var(--rpgme-heading);
        }
        .status {
          min-height: 1.5em;
          margin: 0;
          font-size: var(--ddd-font-size-4xs);
          color: var(--rpgme-heading);
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
        }
        @media (max-width: 600px) {
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
    return html`
      <main>
        <div class="wrap">
          <hgroup>
            <p class="eyebrow">${this.t.eyebrow}</p>
            <h1>${this.t.heading}</h1>
          </hgroup>
          <h2 class="visually-hidden" id="build-title">
            ${this.t.builderHeading}
          </h2>
          <div class="card builder-card" id="build">
            <rpg-character-builder
              sync-url
              @value-changed="${(e) => {
                this.code = e.detail.value;
              }}"
            ></rpg-character-builder>
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
        <p class="status" role="status" aria-live="polite">${this.status}</p>
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
