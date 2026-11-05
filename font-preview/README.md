# Font comparison previews

Static captures of the current invitation at 390×844 and 1440×1000, covering the cover, introduction, and event details. The comparison page does not change production typography or distribute the supplied font binaries.

- Adelio Darmanto: user-supplied OTF; Latin glyphs, current LXGW WenKai TC fallback for Chinese.
- Kaisei Opti Regular: user-supplied TTF; current LXGW WenKai TC fallback for missing Chinese glyphs (including 鑫).
- GenWanMin2TW-R: upstream ButTaiwan/genwan-font commit 25e718615173a3b51099ecc9a6bf4fa558c03fbc; retrieved from upstream because the uploaded archive exceeds the attachment transfer size limit. This may differ from the uploaded archive's revision.

All captures use the same font-size and layout rules, with the selected face set as the primary font and LXGW WenKai TC as fallback. Preview images are WebP; select a device/section and open the image for full resolution.

## Round two

The comparison page now shows two user-supplied Chinese faces paired with Autery:
- ChenYuluoyan-2.0-Thin.ttf (辰宇落雁體 2.0).
- StarPandaKidsBeta2.1.otf (星光小熊貓幼兒體 2.1).
- Autery.otf applies to English A–Z / a–z and ampersands in both variants; it does not contain numerals. Numbers and remaining glyphs use the respective Chinese face. Existing LXGW WenKai TC remains the fallback.

The original font binaries remain outside this repository; only rendered previews are published. The production font configuration is unchanged.

## Round three

`maoken-naikai-autery.html` compares user-supplied MaokenAssortedSans-TC.otf with NaikaiFont-Regular.ttf (TW), both paired with Autery English. The Naikai archive exceeds the transfer limit; its Regular face was retrieved from max32002/naikaifont at commit 7baa43a6adad4a82eab6fd27c9612b316f69d7c9, which may differ from the uploaded archive revision. These screenshots include the production +2px typography layer. Font binaries are not redistributed; only previews are added.
