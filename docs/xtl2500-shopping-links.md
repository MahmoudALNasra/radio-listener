# XTL 2500 station — where to buy (Amazon / Walmart / elsewhere)

Matches parts **A–J** in [`xtl2500-build-guide.pdf`](xtl2500-build-guide.pdf).
Checked Oct 2026. Prices move; open the link and confirm before ordering.

**Short answer:** Amazon has the generic audio/power bits. The Motorola-specific plugs (HLN6863B, crimp pins, sometimes the power cable) are on Amazon *or* radio shops — Walmart only helps for the isolator, USB sound card, and maybe a cheap power supply.

---

## Buy on Amazon / Walmart (easy)

| # | Part | Amazon | Walmart | ~Price |
|---|------|--------|---------|--------|
| **A** | 13.8 V / 20 A+ power supply | [Samlex SEC-1223 23 A](https://www.amazon.com/dp/B0002D6KOU) (~$165–180). Cheaper search: `13.8V 30A power supply ham radio` (TekPower / Pyramid style). | [TekPower TP30SWI 30 A](https://business.walmart.com/ip/TekPower-TP30SWI-13-8V-30A-DC-13-8V-Switching-Power-Supply-for-Ham-CB-Radio/17304064630) (marketplace). Tripp Lite PR20 often out of stock. | $70–180 |
| **E** | 2.2 µF bipolar 50 V capacitor | [20-pack NP bipolar 2.2 µF 50 V](https://www.amazon.com/dp/B09TQXKPRJ) | Not needed — Amazon bag is fine | ~$6 |
| **F** | 3.5 mm TRS male–male shielded cable 6 ft | [Monoprice 6 ft](https://www.amazon.com/dp/B00ANAUIMC) or [StarTech 6 ft](https://www.amazon.com/dp/B00TGP4ZGK). Search: `3.5mm male to male audio cable 6ft` | Search Walmart: `3.5mm aux cable` — any shielded male–male works; you cut one end | ~$5–10 |
| **G** | Ground-loop isolator | [Cable Matters 3.5 mm](https://www.amazon.com/dp/B08G9J74VX) ($11.99) | [Same Cable Matters](https://www.walmart.com/ip/Cable-Matters-Ground-Loop-Isolator-3-5mm-Noise-Isolator-Hum-Eliminator-for-Car-Audio-and-More/241161410) (~$10) | ~$10–12 |
| **H** | USB sound card (UGREEN 30724) | [UGREEN USB Audio Adapter](https://www.amazon.com/dp/B01N905VOY) | [UGREEN USB to 3.5 mm dual jack](https://www.walmart.com/c/kp/usb-audio-adapters) (~$12) — confirm it has **separate red/pink mic jack**, not only one headset jack | ~$10–12 |
| **J** | 700/800 MHz antenna + mini-UHF | [Tram-Browning multiband mag-mount + mini-UHF](https://www.amazon.com/dp/B08274QV96) (covers 698–960 MHz, mini-UHF plug — fits XTL). Dedicated 800 MHz: search Amazon `BR-813` or `800 MHz mag mount`. | Unlikely in store | ~$25–45 |

Also grab from Amazon/Walmart if you don't have them: heat-shrink, electrical tape, cheap multimeter, cookie sheet (antenna ground plane).

---

## Not really on Walmart (radio-shop / Amazon specialty)

| # | Part | Best buy | Amazon? | Walmart? |
|---|------|----------|---------|----------|
| **B** | Motorola power cable **HKN4191C** (10 ft, 12 AWG, 20 A fuse) | [Atlantic Radio HKN4191C](https://www.atlanticradiocorp.com/products/motorola-hkn4191c-mobile-power-cable) or [radioparts.com ~$26](https://www.radioparts.com/motorola-hkn4191c) | [HKN4191B OEM listing](https://www.amazon.com/dp/B00JPK6SPC) (older letter; same plug, OK) | No |
| **C** | Motorola **HLN6863B** rear accessory connector | [North Georgia Comms $38.95](https://northgeorgiacommunications.com/product/hln6863a-hln6863b-apx-xtl-mobile-accessory-speaker-power-and-rear-ignition-cable/) · [Atlantic Radio](https://www.atlanticradiocorp.com/products/motorola-hln6863b) · eBay used ~$12 | [Amazon HLN6863B ~$47](https://www.amazon.com/dp/B09CQDBW22) | No |
| **D** | Crimp pins **3980034F04** (need 2–4) | [Wiscomm ~$1.40 ea](https://shopwiscomm.com/products/2047867) · [radioparts 25-pack](https://www.radioparts.com/motorola-3980034f04) · eBay `HLN6961 XTL APX accessory connector pins` | Rare / overpriced if listed | No |

---

## Suggested cart (one-trip style)

**Amazon cart (do these first):**
1. Samlex SEC-1223 — [B0002D6KOU](https://www.amazon.com/dp/B0002D6KOU)
2. HLN6863B — [B09CQDBW22](https://www.amazon.com/dp/B09CQDBW22) *(or skip and buy cheaper from North Georgia / eBay)*
3. HKN4191B/C power cable — [B00JPK6SPC](https://www.amazon.com/dp/B00JPK6SPC)
4. Capacitor bag — [B09TQXKPRJ](https://www.amazon.com/dp/B09TQXKPRJ)
5. Isolator — [B08G9J74VX](https://www.amazon.com/dp/B08G9J74VX)
6. UGREEN sound card — [B01N905VOY](https://www.amazon.com/dp/B01N905VOY)
7. 3.5 mm cable — [B00ANAUIMC](https://www.amazon.com/dp/B00ANAUIMC)
8. Antenna with mini-UHF — [B08274QV96](https://www.amazon.com/dp/B08274QV96)

**Then separately (small order):** 3–4 crimp pins from Wiscomm or eBay — Amazon rarely sells singles cheaply.

**Walmart only if convenient:** isolator + UGREEN-style USB adapter + aux cable. Do **not** expect the Motorola plugs or a good 20 A radio supply on the shelf.

---

## Reminder from the PDF

- Power and audio are separate: supply → HKN4191 → radio POWER; J2 pin 21/14 → HLN6863B → cap → cable → isolator → **red** jack on USB sound card → PC.
- Never ground speaker pins 20/26.
- Antenna on a steel plate by a window (cookie sheet works).
