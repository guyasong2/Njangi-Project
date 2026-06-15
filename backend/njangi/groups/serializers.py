from rest_framework import serializers
from .models import NjangiGroup, Membership, Contribution, Payout
from authentication.models import User

class UserMinSerializer(serializers.ModelSerializer):
    masked_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'masked_phone']
        
    def get_masked_phone(self, obj):
        if not obj.phone_number:
            return "No phone set"
        phone = obj.phone_number
        if len(phone) >= 13: # +2376 and 8 more digits
            return f"{phone[:6]}****{phone[-3:]}"
        return phone

class MembershipSerializer(serializers.ModelSerializer):
    user = UserMinSerializer(read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'group', 'user', 'payout_order', 'join_date']

class NjangiGroupSerializer(serializers.ModelSerializer):
    total_members = serializers.SerializerMethodField()
    admin = UserMinSerializer(read_only=True)
    pool_balance = serializers.DecimalField(source='pool.balance', max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = NjangiGroup
        fields = ['id', 'name', 'description', 'rules', 'contribution_amount', 'cycle_length', 'frequency', 'is_private', 'invite_code', 'admin', 'pool_balance', 'current_cycle_number', 'created_at', 'total_members']
        
    def get_total_members(self, obj):
        return obj.memberships.count()

class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['id', 'amount', 'date_paid', 'is_late', 'cycle_number', 'payment_method', 'is_verified']

class InteractiveGroupSerializer(NjangiGroupSerializer):
    memberships = MembershipSerializer(many=True, read_only=True)
    my_contributions = serializers.SerializerMethodField()
    
    class Meta(NjangiGroupSerializer.Meta):
        fields = NjangiGroupSerializer.Meta.fields + ['memberships', 'my_contributions']

    def get_my_contributions(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            if membership:
                return ContributionSerializer(membership.contributions.all(), many=True).data
        return []
