from django.contrib import admin

from .models import User, OTP

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id','email','username','phone_number', 'is_active', 'is_staff')
    search_fields = ('phone_number','id','email','username')

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'code', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('phone_number', 'code')

