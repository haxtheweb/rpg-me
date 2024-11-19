import { html, fixture, expect } from '@open-wc/testing';
import "../rpg-me.js";

describe("RpgMe test", () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`
      <rpg-me
        title="title"
      ></rpg-me>
    `);
  });

  it("basic will it blend", async () => {
    expect(element).to.exist;
  });

  it("passes the a11y audit", async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
