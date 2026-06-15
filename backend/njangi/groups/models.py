from django.db import models
from django.conf import settings
from decimal import Decimal

import string
import random

def generate_njangi_code():
    return 'NJANGI-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

class NjangiGroup(models.Model):
    FREQUENCY_CHOICES = (
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
    )
    name = models.CharField(max_length=100)
    contribution_amount = models.DecimalField(max_digits=10, decimal_places=2)
    cycle_length = models.IntegerField(help_text="Number of members/cycles")
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    is_private = models.BooleanField(default=False)
    invite_code = models.CharField(max_length=20, unique=True, db_index=True, blank=True)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='administered_groups')
    description = models.TextField(blank=True, help_text="About this Njangi")
    rules = models.TextField(blank=True, help_text="Group rules and conduct")
    current_cycle_number = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            # Ensure uniqueness
            code = generate_njangi_code()
            while NjangiGroup.objects.filter(invite_code=code).exists():
                code = generate_njangi_code()
            self.invite_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class GroupPool(models.Model):
    group = models.OneToOneField(NjangiGroup, on_delete=models.CASCADE, related_name='pool')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def recalculate_balance(self):
        # Calculate balance based only on verified MOMO or BANK contributions
        verified_sum = Contribution.objects.filter(
            membership__group=self.group,
            is_verified=True,
            payment_method__in=['MOMO', 'BANK']
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        self.balance = verified_sum
        self.save()

    def __str__(self):
        return f"Pool for {self.group.name} - Balance: {self.balance}"

class Membership(models.Model):
    ROLE_CHOICES = (
        ('MEMBER', 'Member'),
        ('ADMIN', 'Admin'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('PENDING_NEXT_CYCLE', 'Pending Next Cycle'),
        ('REMOVED', 'Removed'),
    )
    group = models.ForeignKey(NjangiGroup, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    payout_order = models.IntegerField()
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    cycle_start_index = models.PositiveIntegerField(default=1)
    join_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.phone_number} in {self.group.name}"

class Contribution(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('MOMO', 'Mobile Money'),
        ('BANK', 'Bank Transfer'),
        ('WALLET', 'Internal Wallet'),
    )
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_paid = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    cycle_number = models.IntegerField()
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, default='WALLET')
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate the associated pool balance whenever a contribution is saved
        if hasattr(self.membership.group, 'pool'):
            self.membership.group.pool.recalculate_balance()

    def __str__(self):
        return f"Contribution by {self.membership.user.phone_number} for cycle {self.cycle_number}"

class Payout(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='payouts')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    available_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="60% of total")
    locked_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="40% of total")
    date_disbursed = models.DateTimeField(auto_now_add=True)
    cycle_number = models.IntegerField()

    def save(self, *args, **kwargs):
        if not self.pk:
            # Enforce 60/40 rule
            self.available_amount = self.total_amount * Decimal('0.60')
            self.locked_amount = self.total_amount * Decimal('0.40')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payout for {self.membership.user.phone_number}"
