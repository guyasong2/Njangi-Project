import logging
from django.db import models
from django.conf import settings
from django.db.models import Sum
from decimal import Decimal

logger = logging.getLogger(__name__)

from django.core.cache import cache

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def available_balance(self):
        cache_key = f"wallet_{self.id}_available"
        cached_balance = cache.get(cache_key)
        if cached_balance is not None:
            return cached_balance

        balance = self.transactions.filter(
            transaction_type__in=['DEPOSIT', 'WITHDRAW', 'CONTRIBUTION', 'PAYOUT_AVAILABLE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        cache.set(cache_key, balance, timeout=3600)
        return balance

    @property
    def locked_balance(self):
        cache_key = f"wallet_{self.id}_locked"
        cached_balance = cache.get(cache_key)
        if cached_balance is not None:
            return cached_balance

        balance = self.transactions.filter(
            transaction_type='PAYOUT_LOCKED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        cache.set(cache_key, balance, timeout=3600)
        return balance

    def __str__(self):
        return f"Wallet of {self.user.phone_number}"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAW', 'Withdraw'),
        ('CONTRIBUTION', 'Contribution'),
        ('PAYOUT_AVAILABLE', 'Payout Available'),
        ('PAYOUT_LOCKED', 'Payout Locked'),
        ('LOAN_DISBURSEMENT', 'Loan Disbursement'),
        ('LOAN_REPAYMENT', 'Loan Repayment'),
    )
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Positive for credits, negative for debits")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Invalidate Redis cache instantly
        cache.delete(f"wallet_{self.wallet.id}_available")
        cache.delete(f"wallet_{self.wallet.id}_locked")

    def __str__(self):
        return f"{self.transaction_type}: {self.amount} for {self.wallet.user.phone_number}"
