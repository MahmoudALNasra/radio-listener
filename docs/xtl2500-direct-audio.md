# Direct audio from the Motorola XTL 2500 (no cabin mic)

Radio: **Motorola XTL 2500**, model `M21URM9PW1AN` (700/800 MHz, 35 W, P25 digital + analog, mobile).

Goal: feed what the radio *receives* straight into the listener (Lenovo PC for testing,
Raspberry Pi in the truck) instead of listening through a microphone. The radio decodes
P25 itself, so what comes out is normal analog speech. `device/listener.py` does not change;
only `input_device` in `device/config.json` points at the USB sound card.

Two ways to get the audio out. **Option B is the one to build.** Option A is a fallback if the
connector is hard to get.

---

## Option B (recommended): rear 26-pin accessory jack, fixed-level RX audio

The transceiver's rear accessory connector (J2, 26 pins) has a **filtered receive audio
output that ignores the volume knob**. Driver can turn the speaker down or off and the
listener still hears everything.

### Pins used

| Pin | Signal | Use |
|-----|--------|-----|
| 21 | RX filtered audio (fixed level, has DC bias) | audio to sound card (tip) |
| 14 | AGND (analog ground) | audio ground (sleeve) |
| 20 / 26 | Speaker + / − (bridged amp) | **never ground these** – leave to the speaker |
| 16 / 23 | Aux PTT / TX audio | not used (only if the box should ever transmit) |
| 24 | SW B+ 13.8 V switched | later: 12→5 V buck to power the Pi with the radio |
| 9 | BUSY | later: squelch/COR signal if we want hardware "channel active" |

Source: XTL 2500 install manual (Table 3-3 rear accessory jack) and Batboard XTL threads.

### Shopping list

| # | Part | Where / price (Oct 2026) | Notes |
|---|------|--------------------------|-------|
| 1 | **Motorola HLN6863B** rear accessory connector kit (26-pin housing + ignition/speaker leads) | [North Georgia Communications $38.95](https://northgeorgiacommunications.com/product/hln6863a-hln6863b-apx-xtl-mobile-accessory-speaker-power-and-rear-ignition-cable/), [Atlantic Radio $39.95](https://www.atlanticradiocorp.com/products/motorola-hln6863b), eBay used ~$12 (search `HLN6863B XTL`) | Fits XTL1500/2500/5000 and APX. It comes pre-wired for speaker + ignition; we add two pins. |
| 2 | **Crimp pins 3980034F01 / 3980034F04** (need 2, buy 3–4) | [Wiscomm $1.40 each](https://shopwiscomm.com/products/2047867) | 18–20 AWG pins for the HLN6863 housing. 25-packs exist (~$37) but not needed. |
| 3 | **2.2 µF non-polarized (bipolar) capacitor**, 50 V | Amazon search `2.2uF bipolar capacitor 50V` (~$6 for a bag) | In series on pin 21 to block the DC bias. If you use the isolator (item 4) it also blocks DC, but keep the cap anyway. |
| 4 | **3.5 mm ground-loop isolator** | [Cable Matters 3.5mm Ground Loop Isolator $11.99](https://www.amazon.com/dp/B08G9J74VX) (includes a 3.5 mm cable) | Radio is on truck battery ground; PC/Pi is on a cigarette USB adapter. This kills alternator whine. |
| 5 | **Shielded 3.5 mm TRS cable, 3–6 ft**, cut one end for the two pins | Amazon search `3.5mm TRS male to male shielded cable 6ft` (~$7) | Tip → pin 21 via cap, sleeve → pin 14. Bridge tip+ring at the plug end so a stereo input hears mono on both channels. |
| 6 | **USB sound card** with mic input | [UGREEN USB Audio Adapter, model 30724 (B01N905VOY) ~$10](https://www.amazon.com/dp/B01N905VOY) | Works on Windows and Raspberry Pi with no drivers. Mic jack is mono TRS, which is exactly what we deliver. Alternative with real line-in: Behringer UCA202 (~$30). |
| 7 | 22 AWG wire, heat shrink, crimp tool or fine pliers | hardware store | Only if you don't already have them. |

Total Option B: about $75 new, ~$45 if the HLN6863B is bought used.

### Wiring

```
XTL 2500 rear J2 (via HLN6863B housing)
  pin 21 ──[ 2.2 µF ]──┐
                        ├── 3.5 mm plug (tip+ring) ─► ground-loop isolator ─► USB sound card MIC (red)
  pin 14 ───────────────┘   3.5 mm plug (sleeve)
```

1. Unplug the radio from power before touching the accessory connector.
2. Crimp a pin on each of the two wires from the cut 3.5 mm cable (signal and shield).
3. Insert into the HLN6863B housing: signal into position **21**, shield into **14**. Positions are
   molded into the housing. Do not touch 20 or 26.
4. Put the 2.2 µF cap in-line on the signal wire (+ side toward the radio if it is polarized; a
   bipolar cap has no polarity). Heat shrink.
5. Plug HLN6863B onto the radio, isolator onto the 3.5 mm plug, isolator into the UGREEN mic jack,
   UGREEN into the PC/Pi.

### First power-on

- Windows: Sound settings → Input → `USB Audio Device`, mic level ~50 %, listen to it.
- Pi: `arecord -l` to find the card, then set `input_device` in `device/config.json`.
- Run `python listener.py` and check the level readout is not clipping during a transmission.
  If the level is too hot, lower the sound-card mic gain; if too low, raise it or try the radio's
  CPS *Accessory → Rear RX audio* gain.

If pin 21 is dead silent: in CPS, Radio Configuration → Radio Wide → Advanced, check the rear
accessory audio options (on most XTLs pin 21 is always live).

---

## Option A (fallback): tap the external speaker wires

Splice a car-audio **line output converter (LOC)** in parallel with the external speaker leads.
The LOC's transformer isolates the bridged speaker output and drops it to line level.

| # | Part | Where / price |
|---|------|---------------|
| 1 | **Scosche LOC2SL** line output converter | [Amazon $19.99 (B00LIAHSM4)](https://www.amazon.com/dp/B00LIAHSM4) |
| 2 | **RCA to 3.5 mm cable** | Amazon search `RCA to 3.5mm male cable 3ft` (~$7) |
| 3 | **USB sound card** | same UGREEN as above |
| 4 | T-taps or Posi-Taps for 18 AWG speaker wire | hardware store |

Chain: speaker wires → LOC input → RCA → 3.5 mm → USB sound card.

Rules: **never ground either speaker wire** (destroys the XTL audio amp). Keep the speaker
connected. Level follows the volume knob, so if the driver mutes the radio the listener goes deaf.
This is why Option B is preferred.

---

## Software to-do once the hardware is in

- Audio gate: ignore input below a threshold so Vosk doesn't transcribe squelch hiss.
- Use the gate to start/stop clips on actual transmissions instead of fixed ±5 s.
- Level-check script to set the sound-card gain.
- Optional: read J2 pin 9 (BUSY) on a Pi GPIO (via level shifter) as a hardware "channel active".
