import unittest

from bot_funnel import (
    CHANNEL_SUBSCRIBE_EVENT,
    DEFAULT_CHANNEL_ID,
    DEFAULT_CHANNEL_URL,
    QUIZ_COMPLETE_EVENT,
    get_aio_question_field,
    get_quiz_options,
    get_quiz_question,
    is_skip_answer,
    is_active_channel_member,
    map_quiz_answer_locally,
    normalize_channel_settings,
    normalize_quiz_answer,
)


class BotFunnelTest(unittest.TestCase):
    def test_quiz_questions_are_ordered(self):
        self.assertEqual(get_quiz_question("experience"), "What is your trading experience?")
        self.assertEqual(get_quiz_question("broker_experience"), "Have you worked with any of these brokers before?")
        self.assertEqual(
            get_quiz_question("capital"),
            "What is your trading capital (deposit)?\nThis helps us suggest a more relevant broker setup later.",
        )

    def test_normalizes_quiz_answers(self):
        self.assertEqual(normalize_quiz_answer("experience", "  Less than 1 year  "), "Less than 1 year")
        self.assertEqual(normalize_quiz_answer("broker_experience", "Other broker"), "Other broker")
        self.assertEqual(normalize_quiz_answer("capital", "$100-$1,000"), "$100-$1,000")

    def test_quiz_options_include_skip(self):
        self.assertIn("Skip", get_quiz_options("experience"))
        self.assertIn("I have not worked with a broker", get_quiz_options("broker_experience"))
        self.assertIn("$100,000+", get_quiz_options("capital"))

    def test_maps_free_text_answers_locally(self):
        self.assertEqual(map_quiz_answer_locally("experience", "I am a total beginner"), "I have no experience")
        self.assertEqual(map_quiz_answer_locally("experience", "about two years"), "1-2 years")
        self.assertEqual(map_quiz_answer_locally("capital", "500 dollars"), "$100-$1,000")
        self.assertEqual(map_quiz_answer_locally("broker_experience", "never used one"), "I have not worked with a broker")

    def test_detects_skip_answers(self):
        self.assertTrue(is_skip_answer("later"))
        self.assertTrue(is_skip_answer("just send the link"))
        self.assertTrue(is_skip_answer("Skip"))
        self.assertFalse(is_skip_answer("Less than 1 year"))

    def test_maps_steps_to_aio_question_fields(self):
        self.assertEqual(get_aio_question_field("experience"), "tg_question1")
        self.assertEqual(get_aio_question_field("broker_experience"), "tg_question2")
        self.assertEqual(get_aio_question_field("capital"), "tg_question3")

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
