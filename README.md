# rpg-me

[rpg-me.hax.cloud](https://rpg-me.hax.cloud): build an [`rpg-character`](https://github.com/haxtheweb/webcomponents/tree/master/elements/rpg-character), keep its character code, share a link that recreates it, and drop it into any page that loads HAX. It is part of the HAX network of sites (hax.cloud, the element portfolio, the live HAXcms demo) and shares their header strip, `hax-network-bar`.

## What it does

- Everything `rpg-character-builder` can pick: the look (body, skin, hair, hair color, face, glasses, neckwear, shirt, pants), the character type, expression, pose, hat, mask, makeup, gear (item, offhand, feet, pet, flag text) and extras (shaved, seasonal, fire, circle background).
- A character code (`1-0103...~PSU`) that `<rpg-character code="...">` turns back into the same character anywhere.
- Links: `?code=<code>` opens a character, `&walking=true` makes it walk. Old links still work: `?seed=05700899&hat=none` (the 8 digits are body, face, glasses, hair, pants, shirt, skin and hair color), as does `?seed=<a name>`.

## Develop

- `npm install`
- `npm start` runs it locally
- `npm run build` writes the site to `public/` (Vercel runs this, see `vercel.json`)
- `npm test` runs the tests

Option labels come from `rpg-character`'s own HAX settings, so they stay in step with the element. English strings are in `rpg-me.js` (`this.t`) and `locales/rpg-me.en.json`.

## License

Apache-2.0
