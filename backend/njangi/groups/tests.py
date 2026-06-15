from django.test import TestCase
from decimal import Decimal
from authentication.models import User
from .models import NjangiGroup, Membership, Payout

class PayoutTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create(phone_number='+123456789')
        self.group = NjangiGroup.objects.create(
            name="Test Group", 
            contribution_amount=Decimal('100.00'), 
            cycle_length=10, 
            frequency='WEEKLY'
        )
        self.membership = Membership.objects.create(
            group=self.group, 
            user=self.user, 
            payout_order=1
        )

    def test_payout_split(self):
        payout = Payout.objects.create(
            membership=self.membership,
            total_amount=Decimal('1000.00'),
            cycle_number=1
        )
        
        # Verify 60% available
        self.assertEqual(payout.available_amount, Decimal('600.00'))
        
        # Verify 40% locked
        self.assertEqual(payout.locked_amount, Decimal('400.00'))
class InviteCodeTestCase(TestCase):
    def setUp(self):
        self.admin = User.objects.create(
            phone_number='+237611111111', 
            email='admin@njangi.com'
        )
        self.member = User.objects.create(
            phone_number='+237622222222', 
            email='member@njangi.com'
        )
        self.private_group = NjangiGroup.objects.create(
            name="Secret Njangi",
            contribution_amount=Decimal('500.00'),
            cycle_length=5,
            frequency='MONTHLY',
            is_private=True,
            admin=self.admin
        )
        self.public_group = NjangiGroup.objects.create(
            name="Public Njangi",
            contribution_amount=Decimal('100.00'),
            cycle_length=10,
            frequency='WEEKLY',
            is_private=False,
            admin=self.admin
        )

    def test_invite_code_generation(self):
        self.assertTrue(self.private_group.invite_code.startswith('NJANGI-'))
        self.assertEqual(len(self.private_group.invite_code), 15) # NJANGI- + 8 chars

    def test_join_public_no_code(self):
        from .services import GroupService
        membership = GroupService.join_group(self.public_group.id, self.member)
        self.assertEqual(membership.user, self.member)

    def test_join_private_failure(self):
        from .services import GroupService
        with self.assertRaises(PermissionError):
            GroupService.join_group(self.private_group.id, self.member)
        
        with self.assertRaises(PermissionError):
            GroupService.join_group(self.private_group.id, self.member, invite_code='WRONG-CODE')

    def test_join_private_success(self):
        from .services import GroupService
        membership = GroupService.join_group(
            self.private_group.id, 
            self.member, 
            invite_code=self.private_group.invite_code
        )
        self.assertEqual(membership.user, self.member)
