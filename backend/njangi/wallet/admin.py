from django.contrib import admin
from .models import Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at', 'get_available_balance', 'get_locked_balance')
    search_fields = ('user__username', 'user__phone_number', 'user__email')
    readonly_fields = ('created_at',)
    
    def get_available_balance(self, obj):
        return obj.available_balance
    get_available_balance.short_description = 'Available Balance'

    def get_locked_balance(self, obj):
        return obj.locked_balance
    get_locked_balance.short_description = 'Locked Balance'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'amount', 'transaction_type', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('wallet__user__username', 'wallet__user__phone_number', 'description')
    readonly_fields = ('timestamp',)
