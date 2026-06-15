from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import random
from datetime import timedelta

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

from django.core.validators import RegexValidator

class User(AbstractBaseUser, PermissionsMixin):
    CAMEROON_PHONE_REGEX = r'^\+2376\d{8}$'
    phone_validator = RegexValidator(
        regex=CAMEROON_PHONE_REGEX,
        message="Phone number must be in Cameroon format: '+2376XXXXXXXX'"
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(
        max_length=15, 
        unique=True, 
        null=True, 
        blank=True,
        validators=[phone_validator]
    )
    google_uid = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    kyc_document = models.ImageField(upload_to='kyc/', null=True, blank=True)
    kyc_status = models.CharField(
        max_length=20, 
        choices=[('unverified', 'Unverified'), ('pending', 'Pending'), ('verified', 'Verified')],
        default='unverified'
    )
    
    is_verified = models.BooleanField(default=False)
    referral_bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

def default_expiry():
    return timezone.now() + timedelta(minutes=10)

class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    phone_number = models.CharField(max_length=15)
    code = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)
    is_verified = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_verified and timezone.now() < self.expires_at

    def generate_code(self):
        self.code = f"{random.randint(1000, 9999)}"
        self.save()
        return self.code
