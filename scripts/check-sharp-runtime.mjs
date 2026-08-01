import assert from "node:assert/strict";

import sharp from "sharp";

const { data, info } = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 4,
    background: { r: 24, g: 45, b: 38, alpha: 1 },
  },
})
  .png()
  .toBuffer({ resolveWithObject: true });

assert.equal(info.format, "png", "Sharp did not encode the runtime probe as PNG.");
assert.equal(info.width, 1, "Sharp changed the runtime probe width.");
assert.equal(info.height, 1, "Sharp changed the runtime probe height.");
assert.ok(data.length > 8, "Sharp returned an empty runtime probe.");
assert.equal(
  data.subarray(0, 8).toString("hex"),
  "89504e470d0a1a0a",
  "Sharp returned bytes without a PNG signature.",
);

const decoded = await sharp(data).metadata();
assert.equal(decoded.format, "png", "Sharp could not decode its runtime probe.");
assert.equal(decoded.width, 1, "Sharp decoded the wrong runtime probe width.");
assert.equal(decoded.height, 1, "Sharp decoded the wrong runtime probe height.");
assert.ok(sharp.versions.sharp, "Sharp did not expose its package version.");
assert.ok(sharp.versions.vips, "Sharp did not expose its libvips version.");

console.log(
  `PASS sharp runtime probe (sharp ${sharp.versions.sharp}, libvips ${sharp.versions.vips})`,
);
