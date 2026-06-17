import unittest
from pathlib import Path


class BotButtonLabelsTest(unittest.TestCase):
    def test_main_webapp_button_is_open_app(self):
        backend_main = Path(__file__).resolve().parents[1] / "main.py"
        root_main = Path(__file__).resolve().parents[2] / "main.py"

        self.assertIn('text="open app"', backend_main.read_text(encoding="utf-8"))
        self.assertIn('text="open app"', root_main.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
