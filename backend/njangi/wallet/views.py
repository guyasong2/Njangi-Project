from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Wallet
from .serializers import WalletDetailSerializer
from .services import WalletService

class WalletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet_summary = WalletService.get_wallet_summary(request.user)
        wallet = Wallet.objects.get(id=wallet_summary['wallet_id'])
        serializer = WalletDetailSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DepositView(APIView):
    """
    Endpoint for adding funds to the user's wallet.
    Ties the deposit to the authenticated user's personal account.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        provider = request.data.get('provider', 'UNKNOWN')
        if not amount or float(amount) <= 0:
            return Response({"error": "Valid amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        txn = WalletService.add_transaction(
            user=request.user,
            amount=float(amount),
            transaction_type='DEPOSIT',
            description=f"Deposit via {provider}"
        )
        return Response({
            "message": "Deposit successful",
            "transaction_id": txn.id,
            "new_balance": request.user.wallet.available_balance
        }, status=status.HTTP_201_CREATED)

class WithdrawView(APIView):
    """
    Endpoint for withdrawing/sending funds from the user's wallet.
    Ties the withdrawal to the authenticated user's personal account.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        provider = request.data.get('provider', 'UNKNOWN')
        if not amount or float(amount) <= 0:
            return Response({"error": "Valid amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Send/Withdraw means subtracting from the balance
            txn = WalletService.add_transaction(
                user=request.user,
                amount=-float(amount),
                transaction_type='WITHDRAW',
                description=f"Send to {provider}"
            )
            return Response({
                "message": "Send successful",
                "transaction_id": txn.id,
                "new_balance": request.user.wallet.available_balance
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            # Insufficient funds error from WalletService
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MoMoWebhookView(APIView):
    """
    Simulated Webhook endpoint for MTN MoMo / Orange Money.
    Expects payload: { "contribution_id": 123, "status": "SUCCESSFUL", "amount": 5000 }
    """
    permission_classes = [] # In production, verify webhook signature from provider

    def post(self, request):
        contribution_id = request.data.get('contribution_id')
        status_code = request.data.get('status')
        amount = request.data.get('amount')

        if not contribution_id or status_code != "SUCCESSFUL":
            return Response({"error": "Invalid payload or unsuccessful payment"}, status=status.HTTP_400_BAD_REQUEST)

        from groups.models import Contribution
        try:
            contribution = Contribution.objects.get(id=contribution_id, is_verified=False)
            
            # 1. Mark Contribution as Verified
            contribution.is_verified = True
            contribution.payment_method = 'MOMO'
            contribution.save()

            # 2. Add Transaction to Wallet (Debit from their internal Wallet if they pay directly, 
            # or just register as a contribution deposit if money goes directly to pool. 
            # For Njangi, we'll log it as a DEPOSIT and then immediately a CONTRIBUTION deduction
            # to keep the ledger balanced).
            
            # Step A: Deposit total MoMo funds to Wallet
            WalletService.add_transaction(
                user=contribution.membership.user,
                amount=float(amount),
                transaction_type='DEPOSIT',
                description=f"MoMo Deposit for Cycle {contribution.cycle_number}"
            )

            # Step B: Deduct base amount for Group Contribution
            base_amount = float(contribution.amount)
            WalletService.add_transaction(
                user=contribution.membership.user,
                amount=-base_amount,
                transaction_type='CONTRIBUTION',
                description=f"Contribution to {contribution.membership.group.name}"
            )
            
            # Step C: Deduct Platform Fee (if applicable)
            if float(amount) > base_amount:
                fee = float(amount) - base_amount
                WalletService.add_transaction(
                    user=contribution.membership.user,
                    amount=-fee,
                    transaction_type='WITHDRAW',
                    description="Platform Fee (1%)"
                )

            return Response({"message": "Webhook processed successfully"}, status=status.HTTP_200_OK)
        except Contribution.DoesNotExist:
            return Response({"error": "Pending contribution not found"}, status=status.HTTP_404_NOT_FOUND)

