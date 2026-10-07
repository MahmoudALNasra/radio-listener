"""Alert backends: simulate (desktop) or gpio (Raspberry Pi LED)."""

from __future__ import annotations

import threading
import time


class SimulateAlert:
    """Console banner + optional window/beep (best on desktop)."""

    def __init__(self, duration_sec: float = 4.0) -> None:
        self.duration_sec = duration_sec
        self._lock = threading.Lock()

    def trigger(self, keyword: str, transcript: str) -> None:
        with self._lock:
            print("\n" + "=" * 50)
            print("  BLUE LED ON  (simulated)")
            print(f"  keyword: {keyword}")
            print(f"  heard:   {transcript}")
            print("=" * 50 + "\n")
        threading.Thread(target=self._beep, daemon=True).start()
        threading.Thread(
            target=self._flash_window, args=(keyword,), daemon=True
        ).start()

    def _beep(self) -> None:
        try:
            import winsound

            for freq in (880, 1175, 1397):
                winsound.Beep(freq, 180)
        except Exception:
            print("\a", end="", flush=True)

    def _flash_window(self, keyword: str) -> None:
        try:
            import tkinter as tk
        except Exception:
            time.sleep(self.duration_sec)
            print("BLUE LED OFF (simulated)\n")
            return

        root = tk.Tk()
        root.title("Listener Alert")
        root.attributes("-topmost", True)
        root.configure(bg="#1e90ff")
        root.geometry("420x220+80+80")
        label = tk.Label(
            root,
            text=f"BLUE LED\n\n{keyword.upper()}",
            fg="white",
            bg="#1e90ff",
            font=("Segoe UI", 28, "bold"),
        )
        label.pack(expand=True, fill="both")
        root.after(int(self.duration_sec * 1000), root.destroy)
        root.mainloop()
        print("BLUE LED OFF (simulated)\n")


class GpioAlert:
    """Drive a blue LED on a Raspberry Pi GPIO pin."""

    def __init__(self, pin: int = 17, duration_sec: float = 4.0) -> None:
        self.pin = pin
        self.duration_sec = duration_sec
        self._lock = threading.Lock()
        self._led = None
        self._init_error: Exception | None = None
        try:
            from gpiozero import LED

            self._led = LED(self.pin)
        except Exception as exc:
            self._init_error = exc

    def trigger(self, keyword: str, transcript: str) -> None:
        if self._led is None:
            print(
                f"GPIO unavailable ({self._init_error}); falling back to simulate."
            )
            SimulateAlert(self.duration_sec).trigger(keyword, transcript)
            return

        def _pulse() -> None:
            with self._lock:
                print(
                    f"GPIO LED pin {self.pin} ON — keyword={keyword} "
                    f"heard={transcript!r}"
                )
                self._led.on()
                time.sleep(self.duration_sec)
                self._led.off()
                print(f"GPIO LED pin {self.pin} OFF")

        threading.Thread(target=_pulse, daemon=True).start()


def make_alert(backend: str, *, pin: int = 17, duration_sec: float = 4.0):
    if backend == "gpio":
        return GpioAlert(pin=pin, duration_sec=duration_sec)
    return SimulateAlert(duration_sec=duration_sec)
