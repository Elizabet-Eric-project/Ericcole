import unittest

from access_policy import (
    ACCESS_POLICY_ALL,
    ACCESS_POLICY_REGISTRATION,
    ACCESS_POLICY_REGISTRATION_DEPOSIT,
    normalize_access_policy,
    system_policy_grants_signal_access,
)


class AccessPolicyTest(unittest.TestCase):
    def test_normalizes_aliases(self):
        self.assertEqual(normalize_access_policy("after-registration"), ACCESS_POLICY_REGISTRATION)
        self.assertEqual(normalize_access_policy("registration and deposit"), ACCESS_POLICY_REGISTRATION_DEPOSIT)
        self.assertEqual(normalize_access_policy("everyone"), ACCESS_POLICY_ALL)

    def test_all_policy_grants_access_without_registration(self):
        self.assertTrue(system_policy_grants_signal_access({"policy": "all"}, {}))

    def test_registration_policy_requires_registration(self):
        settings = {"policy": "registration"}
        self.assertFalse(system_policy_grants_signal_access(settings, {"pocket_registered": 0}))
        self.assertTrue(system_policy_grants_signal_access(settings, {"pocket_registered": 1}))

    def test_registration_deposit_policy_requires_min_total_deposit(self):
        settings = {"policy": "registration_deposit", "min_deposit_amount": "100"}
        self.assertFalse(
            system_policy_grants_signal_access(
                settings,
                {"pocket_registered": 1, "pocket_deposited": 1, "pocket_deposit_amount": "99.99"},
            )
        )
        self.assertTrue(
            system_policy_grants_signal_access(
                settings,
                {"pocket_registered": 1, "pocket_deposited": 1, "pocket_deposit_amount": "100.00"},
            )
        )


if __name__ == "__main__":
    unittest.main()
