"""List PortAudio input devices so you can set config.json input_device."""

from __future__ import annotations

import sounddevice as sd


def main() -> None:
    print("Available audio devices:\n")
    print(sd.query_devices())
    print("\nDefault input device index:", sd.default.device[0])
    print(
        "\nPut the device index (number) or a unique name substring into "
        'config.json as "input_device".'
    )


if __name__ == "__main__":
    main()
