import unittest
from pathlib import Path


class BotButtonLabelsTest(unittest.TestCase):
    def test_main_inline_webapp_button_is_open_eric_cole(self):
        backend_main = Path(__file__).resolve().parents[1] / "main.py"
        root_main = Path(__file__).resolve().parents[2] / "main.py"

        self.assertIn('text="Open ERIC COLE"', backend_main.read_text(encoding="utf-8"))
        self.assertIn('text="Open ERIC COLE"', root_main.read_text(encoding="utf-8"))

    def test_telegram_menu_button_is_open_app(self):
        backend_main = Path(__file__).resolve().parents[1] / "main.py"
        source = backend_main.read_text(encoding="utf-8")

        self.assertIn("set_chat_menu_button", source)
        self.assertIn("MenuButtonWebApp", source)
        self.assertIn('text="Open APP"', source)

    def test_channel_gate_continue_button_is_go_to_trading(self):
        backend_main = Path(__file__).resolve().parents[1] / "main.py"
        source = backend_main.read_text(encoding="utf-8")

        self.assertIn('text="Go to trading"', source)
        self.assertNotIn('text="Check subscription"', source)
        self.assertNotIn('text="Продолжить"', source)


if __name__ == "__main__":
    unittest.main()
