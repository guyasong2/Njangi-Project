from django.db import transaction
from .models import Wallet, Transaction
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class WalletService:
    @staticmethod
    @transaction.atomic
    def add_transaction(user, amount, transaction_type, description=""):
        """
        Safely adds a transaction to a user's wallet using row-level locking.
        'amount' should be positive for credits, negative for debits.
        """
        # 1. Get or create wallet with row-level lock
        wallet, created = Wallet.objects.select_for_update().get_or_create(user=user)
        
        # 2. For debits (negative amount), verify available balance
        if amount < 0:
            current_balance = wallet.available_balance
            if current_balance + Decimal(str(amount)) < 0:
                raise ValueError(f"Insufficient funds. Required: {abs(amount)}, Available: {current_balance}")
        
        # 3. Create transaction record (immutable ledger)
        txn = Transaction.objects.create(
            wallet=wallet,
            amount=amount,
            transaction_type=transaction_type,
            description=description
        )
        
        logger.info(f"Wallet transaction recorded: {txn}")
        return txn

    @staticmethod
    def get_wallet_summary(user):
        """
        Returns a computed summary of the user's wallet balances.
        """
        wallet, created = Wallet.objects.get_or_create(user=user)
        return {
            "available_balance": wallet.available_balance,
            "locked_balance": wallet.locked_balance,
            "wallet_id": wallet.id
        }
