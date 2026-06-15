from django.contrib import admin
from .models import NjangiGroup, Membership, GroupPool, Contribution, Payout

@admin.register(NjangiGroup)
class NjangiGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'contribution_amount', 'is_private', 'invite_code', 'created_at')
    list_filter = ('is_private', 'frequency', 'created_at')
    search_fields = ('name', 'description', 'invite_code')

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'payout_order', 'role', 'status', 'join_date')
    list_filter = ('role', 'status', 'join_date')
    search_fields = ('user__phone_number', 'group__name')

admin.site.register(GroupPool)
admin.site.register(Contribution)
admin.site.register(Payout)