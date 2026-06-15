from rest_framework import serializers
from .models import Wallet, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'transaction_type', 'transaction_type_display', 'timestamp', 'description']

class WalletDetailSerializer(serializers.ModelSerializer):
    available_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    locked_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ['id', 'available_balance', 'locked_balance', 'recent_transactions']

    def get_recent_transactions(self, obj):
        transactions = obj.transactions.all().order_by('-timestamp')[:20]
        return TransactionSerializer(transactions, many=True).data
