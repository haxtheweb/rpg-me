import { html, fixture, expect } from "@open-wc/testing";
import { decodeCharacter } from "@haxtheweb/rpg-character/rpg-character.js";
import { characterFromParams } from "../rpg-me.js";

describe("characterFromParams", () => {
  it("loads a character code", () => {
    const code = "1-0103000000000000000a0000000000000a~PSU";
    expect(characterFromParams(`?code=${encodeURIComponent(code)}`).code).to.equal(code);
  });

  it("reads the 8-digit seeds old rpg-me links carry", () => {
    const result = characterFromParams("?seed=05700899&hat=none&walking=true");
    const c = decodeCharacter(result.code);
    expect(c.face).to.equal(5);
    expect(c.faceItem).to.equal(7);
    expect(c.shirt).to.equal(8);
    expect(c.skin).to.equal(9);
    expect(c.hatColor).to.equal(9);
    expect(c.hat).to.equal("none");
    expect(result.walking).to.equal(true);
  });

  it("keeps an old link's hat and fire", () => {
    const c = decodeCharacter(characterFromParams("?seed=11111111&hat=pirate&fire=true").code);
    expect(c.hat).to.equal("pirate");
    expect(c.fire).to.equal(true);
  });

  it("treats any other seed as a name", () => {
    const result = characterFromParams("?seed=btopro");
    expect(result.seed).to.equal("btopro");
    expect(decodeCharacter(result.code)).to.not.equal(null);
  });

  it("ignores an address with no character", () => {
    expect(characterFromParams("")).to.equal(null);
  });
});

describe("rpg-me", () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<rpg-me></rpg-me>`);
  });

  it("starts with a valid character code", () => {
    expect(decodeCharacter(element.code)).to.not.equal(null);
  });

  it("changes the code when a choice changes", async () => {
    const before = element.code;
    element.tab = "style";
    await element.updateComplete;
    element.shadowRoot.querySelector('button.type[data-preset="wizard"]').click();
    await element.updateComplete;
    expect(element.code).to.not.equal(before);
    expect(decodeCharacter(element.code).preset).to.equal("wizard");
  });

  it("passes the a11y audit", async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
