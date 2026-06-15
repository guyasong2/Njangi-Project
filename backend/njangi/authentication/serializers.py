from rest_framework import serializers
from .models import User, OTP
import re

class SendOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

    def validate_phone_number(self, value):
        if not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
        return value

class VerifyOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=4)

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'phone_number', 'password')

    def validate_phone_number(self, value):
        if not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
        return value

class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

class FirebaseSyncSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    google_uid = serializers.CharField(max_length=100)

class UserProfileSerializer(serializers.ModelSerializer):
    trust_score = serializers.SerializerMethodField()
    total_saved = serializers.SerializerMethodField()
    groups_led = serializers.SerializerMethodField()
    member_since = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'phone_number', 
            'is_verified', 'trust_score', 'referral_bonus',
            'total_saved', 'groups_led', 'member_since',
            'profile_picture', 'kyc_document', 'kyc_status'
        ]

    def get_trust_score(self, obj):
        try:
            return obj.trust_score.score
        except Exception:
            return 500 # Default trust score for new active members

    def get_total_saved(self, obj):
        from groups.models import Contribution
        from django.db.models import Sum
        total = Contribution.objects.filter(
            membership__user=obj, 
            is_verified=True
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        return str(total)

    def get_groups_led(self, obj):
        from groups.models import NjangiGroup
        return NjangiGroup.objects.filter(admin=obj).count()

    def get_member_since(self, obj):
        return obj.date_joined.year
