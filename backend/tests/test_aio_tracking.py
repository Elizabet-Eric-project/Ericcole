import unittest

from aio_tracking import (
    build_aio_postback_url,
    extract_aio_visit_uuid_from_start_text,
    normalize_aio_event_slug,
    normalize_aio_revenue,
    normalize_aio_visit_uuid,
)


class AioTrackingTest(unittest.TestCase):
    def test_extracts_uuid_from_start_payload(self):
        self.assertEqual(
            extract_aio_visit_uuid_from_start_text("/start 10ac5afb-cbce-4465-95dc-d22a2f735574"),
            "10ac5afb-cbce-4465-95dc-d22a2f735574",
        )

    def test_extracts_uuid_without_command_prefix(self):
        self.assertEqual(
            extract_aio_visit_uuid_from_start_text("10AC5AFB-CBCE-4465-95DC-D22A2F735574"),
            "10ac5afb-cbce-4465-95dc-d22a2f735574",
        )

    def test_ignores_invalid_payload(self):
        self.assertIsNone(extract_aio_visit_uuid_from_start_text("/start not-a-valid-uuid"))
        self.assertIsNone(normalize_aio_visit_uuid(""))
        self.assertIsNone(normalize_aio_visit_uuid(None))

    def test_normalizes_event_slug(self):
        self.assertEqual(normalize_aio_event_slug(" Bot Start "), "bot_start")
        self.assertIsNone(normalize_aio_event_slug("bad/slug"))

    def test_normalizes_revenue(self):
        self.assertEqual(normalize_aio_revenue("12.345"), "12.35")
        self.assertEqual(normalize_aio_revenue(None), "0.00")

    def test_builds_postback_url(self):
        url = build_aio_postback_url(
            "10ac5afb-cbce-4465-95dc-d22a2f735574",
            "bot_start",
            revenue="0",
        )

        self.assertEqual(
            url,
            "https://app.aio.tech/api/v1/trigger/conversion-request"
            "?visit_uuid=10ac5afb-cbce-4465-95dc-d22a2f735574"
            "&conversion_type_uuid=bot_start"
            "&arrived_revenue=0.00",
        )

    def test_builds_postback_url_with_optional_params(self):
        url = build_aio_postback_url(
            "10ac5afb-cbce-4465-95dc-d22a2f735574",
            "dep",
            revenue="50",
            currency="USD",
            unique_key="deposit-42",
        )

        self.assertEqual(
            url,
            "https://app.aio.tech/api/v1/trigger/conversion-request"
            "?visit_uuid=10ac5afb-cbce-4465-95dc-d22a2f735574"
            "&conversion_type_uuid=dep"
            "&arrived_revenue=50.00"
            "&currency=USD"
            "&unique=deposit-42",
        )


if __name__ == "__main__":
    unittest.main()
