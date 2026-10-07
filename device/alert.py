"""Alert backends: simulate (Lenovo) or gpio (Pi later)."""

from __future__ import annotations

import threading
import time


class SimulateAlert:
    """Flash a blue on-screen window + console banner."""

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
            # Fallback terminal bell
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
    """Placeholder for Raspberry Pi GPIO blue LED."""

    def __init__(self, pin: int = 17, duration_sec: float = 4.0) -> None:
        self.pin = pin
        self.duration_sec = duration_sec

    def trigger(self, keyword: str, transcript: str) -> None:
        try:
            from gpiozero import LED
        except Exception as exc:
            print(f"GPIO unavailable ({exc}); falling back to simulate.")
            SimulateAlert(self.duration_sec).trigger(keyword, transcript)
            return

        led = LED(self.pin)
        print(f"GPIO LED pin {self.pin} ON — keyword={keyword}")
        led.on()
        time.sleep(self.duration_sec)
        led.off()
        print(f"GPIO LED pin {self.pin} OFF")


def make_alert(backend: str, duration_sec: float = 4.0):
    if backend == "gpio":
        return GpioAlert(duration_sec=duration_sec)
    return SimulateAlert(duration_sec=duration_sec)
