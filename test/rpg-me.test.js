import { html, fixture, expect } from "@open-wc/testing";
import { decodeCharacter } from "@haxtheweb/rpg-character/rpg-character.js";
import { characterFromParams, PAGE_SIZE } from "../rpg-me.js";

describe("characterFromParams", () => {
  it("loads a character code", () => {
    const code = "1-0103000000000000000a0000000000000a~PSU";
    expect(
      characterFromParams(`?code=${encodeURIComponent(code)}`).code,
    ).to.equal(code);
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
    const c = decodeCharacter(
      characterFromParams("?seed=11111111&hat=pirate&fire=true").code,
    );
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

  const tile = (key) =>
    element.shadowRoot.querySelector(`button.tile[data-option="${key}"]`);

  it("changes the code when a tile is picked", async () => {
    const before = element.code;
    element.tab = "character";
    await element.updateComplete;
    // ready-made characters page 12 at a time; wizard is on a later page
    const index = element.tabDef.sections[0].options.findIndex(
      (o) => o.key === "preset-wizard",
    );
    element.page = Math.floor(index / PAGE_SIZE);
    await element.updateComplete;
    tile("preset-wizard").click();
    await element.updateComplete;
    expect(element.code).to.not.equal(before);
    expect(decodeCharacter(element.code).preset).to.equal("wizard");
  });

  it("flips an effect on and off from the same tile", async () => {
    element.tab = "effects";
    await element.updateComplete;
    expect(decodeCharacter(element.code).circle).to.equal(false);
    tile("circle").click();
    await element.updateComplete;
    expect(decodeCharacter(element.code).circle).to.equal(true);
    expect(tile("circle").getAttribute("aria-pressed")).to.equal("true");
    tile("circle").click();
    await element.updateComplete;
    expect(decodeCharacter(element.code).circle).to.equal(false);
    expect(tile("circle").getAttribute("aria-pressed")).to.equal("false");
  });

  it("takes a chosen hat off when its tile is clicked again", async () => {
    element.tab = "hat";
    await element.updateComplete;
    tile("hat-bunny").click();
    await element.updateComplete;
    expect(decodeCharacter(element.code).hat).to.equal("bunny");
    tile("hat-bunny").click();
    await element.updateComplete;
    expect(decodeCharacter(element.code).hat).to.equal("none");
  });

  it("shows how many options there are and pages through them", async () => {
    element.tab = "hat";
    await element.updateComplete;
    const total = element.tabDef.sections[0].options.length;
    const count = () =>
      element.shadowRoot.querySelector(".pager .count").textContent.trim();
    expect(count()).to.equal(`1-${PAGE_SIZE} of ${total}`);
    const dots = element.shadowRoot.querySelectorAll(".pager .dot");
    expect(dots.length).to.equal(Math.ceil(total / PAGE_SIZE));
    dots[1].click();
    await element.updateComplete;
    expect(count()).to.equal(`${PAGE_SIZE + 1}-${PAGE_SIZE * 2} of ${total}`);
    expect(
      element.shadowRoot
        .querySelectorAll(".pager .dot")[1]
        .getAttribute("aria-current"),
    ).to.equal("true");
  });

  it("undoes the last change", async () => {
    const before = element.code;
    element.tab = "hat";
    await element.updateComplete;
    tile("hat-bunny").click();
    await element.updateComplete;
    element.undo();
    await element.updateComplete;
    expect(element.code).to.equal(before);
  });

  it("passes the a11y audit", async () => {
    await expect(element).shadowDom.to.be.accessible();
  });

  it("passes the a11y audit on a paged tab with colors", async () => {
    element.tab = "hair";
    await element.updateComplete;
    await expect(element).shadowDom.to.be.accessible();
    element.tab = "hat";
    await element.updateComplete;
    await expect(element).shadowDom.to.be.accessible();
  });
});
