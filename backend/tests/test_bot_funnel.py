import unittest

from bot_funnel import (
    CHANNEL_SUBSCRIBE_EVENT,
    DEFAULT_CHANNEL_ID,
    DEFAULT_CHANNEL_URL,
    QUIZ_COMPLETE_EVENT,
    get_quiz_question,
    is_active_channel_member,
    normalize_channel_settings,
    normalize_quiz_answer,
)


class BotFunnelTest(unittest.TestCase):
    def test_quiz_questions_are_ordered(self):
        self.assertEqual(get_quiz_question("name"), "Как вас зовут?")
        self.assertEqual(get_quiz_question("age"), "Сколько вам лет?")
        self.assertEqual(get_quiz_question("experience"), "Есть ли у вас опыт в трейдинге?")

    def test_normalizes_quiz_answers(self):
        self.assertEqual(normalize_quiz_answer("name", "  Codex  "), "Codex")
        self.assertEqual(normalize_quiz_answer("age", "25"), 25)
        self.assertEqual(normalize_quiz_answer("experience", "  Есть  "), "Есть")

    def test_rejects_invalid_age(self):
        with self.assertRaises(ValueError):
            normalize_quiz_answer("age", "abc")
        with self.assertRaises(ValueError):
            normalize_quiz_answer("age", "8")

    def test_normalizes_channel_settings_with_defaults(self):
        settings = normalize_channel_settings({})

        self.assertEqual(settings["channel_id"], DEFAULT_CHANNEL_ID)
        self.assertEqual(settings["channel_url"], DEFAULT_CHANNEL_URL)
        self.assertEqual(settings["check_subscription_enabled"], 1)

    def test_normalizes_channel_settings_from_db_row(self):
        settings = normalize_channel_settings(
            {
                "channel_id": "-1001",
                "channel_url": " https://t.me/test ",
                "check_subscription_enabled": "0",
                "support_url": " https://t.me/support ",
            }
        )

        self.assertEqual(settings["channel_id"], -1001)
        self.assertEqual(settings["channel_url"], "https://t.me/test")
        self.assertEqual(settings["check_subscription_enabled"], 0)
        self.assertEqual(settings["support_url"], "https://t.me/support")

    def test_detects_active_channel_memberships(self):
        for status in ("member", "administrator", "creator"):
            self.assertTrue(is_active_channel_member(status))

        for status in ("left", "kicked", "", None):
            self.assertFalse(is_active_channel_member(status))

    def test_event_slugs_are_stable(self):
        self.assertEqual(QUIZ_COMPLETE_EVENT, "quiz_complete")
        self.assertEqual(CHANNEL_SUBSCRIBE_EVENT, "channel_subscribe")


if __name__ == "__main__":
    unittest.main()
