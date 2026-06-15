from django.urls import path
from .views import WalletDetailView, DepositView, WithdrawView, MoMoWebhookView

urlpatterns = [
    path('', WalletDetailView.as_view(), name='wallet-detail'),
    path('deposit/', DepositView.as_view(), name='wallet-deposit'),
    path('withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
    path('momo-webhook/', MoMoWebhookView.as_view(), name='wallet-momo-webhook'),
]
