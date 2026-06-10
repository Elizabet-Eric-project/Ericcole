import unittest

from aio_tracking import extract_aio_visit_uuid_from_start_text, normalize_aio_visit_uuid


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


if __name__ == "__main__":
    unittest.main()
