from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit

from .models import User
from .utils.firebase_auth import verify_firebase_id_token
from wallet.models import Wallet
from groups.models import Membership
from groups.serializers import InteractiveGroupSerializer

import time
import logging

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name', '')
        phone_number = request.data.get('phone_number')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            return Response({"error": "User with this phone number already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate username
        base_username = full_name if full_name else email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                phone_number=phone_number,
                username=username,
                full_name=full_name
            )
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Account created successfully.",
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "username": user.username,
                    "full_name": user.full_name
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful.",
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "username": user.username,
                    "full_name": user.full_name
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

class FirebaseLoginView(APIView):
    permission_classes = [] 
    authentication_classes = [] 
    
    # @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        # Add a slight delay to prevent timing attacks
        time.sleep(0.1)
        
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response({"error": "Verified ID token is strictly required for authentication."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # ZERO TRUST: Only trust claims from verified Firebase token
            decoded_token = verify_firebase_id_token(id_token)
            phone_number = decoded_token.get('phone_number')
            name = decoded_token.get('name', 'Njangi Member')
            email = decoded_token.get('email')
            google_uid = decoded_token.get('uid')
            
            # 1. Safely standardize phone number format (+237)
            if phone_number:
                if not phone_number.startswith('+'):
                    phone_number = f"+237{phone_number}"

            # 2. Advanced Multi-Factor Identity Selection
            # Rank: 1. Google UID, 2. Email, 3. Phone Number
            user = None
            if google_uid:
                user = User.objects.filter(google_uid=google_uid).first()
            
            if not user and email:
                user = User.objects.filter(email=email).first()
            
            if not user and phone_number:
                user = User.objects.filter(phone_number=phone_number).first()
            
            # 3. Secure User Provisioning
            if not user:
                base_username = name if name != 'Njangi Member' else (phone_number or email or google_uid[:10])
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = User.objects.create_user(
                    email=email or f"{google_uid[:15]}@njangi.internal",
                    phone_number=phone_number,
                    username=username,
                    full_name=name if name != 'Njangi Member' else '',
                    google_uid=google_uid
                )
            else:
                # Update metadata if existing user logs in with new identifier
                if google_uid and not user.google_uid:
                    user.google_uid = google_uid
                if phone_number and not user.phone_number:
                    user.phone_number = phone_number
                if not user.full_name and name != 'Njangi Member':
                    user.full_name = name
                user.save()
                
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Security Verification Successful",
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "user": {
                    "id": user.id,
                    "phone_number": user.phone_number,
                    "username": user.username
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f"Authentication failure: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({"error": f"Authentication failed: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        # Implementation for GET /groups/{id}/members
        memberships = Membership.objects.filter(group_id=group_id).select_related('user')
        from groups.serializers import MembershipSerializer
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

from wallet.services import WalletService

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Get Wallet Summary via secure Service layer
        wallet_summary = WalletService.get_wallet_summary(request.user)

        # 2. Extract all memberships tied to this user natively
        memberships = Membership.objects.filter(user=request.user).select_related('group')
        groups_data = []
        
        for mem in memberships:
            group_data = InteractiveGroupSerializer(mem.group).data
            groups_data.append(group_data)

        # 3. Discovery logic: Fetch public groups the user has not joined yet
        from groups.models import NjangiGroup
        discovery_groups = NjangiGroup.objects.filter(is_private=False).exclude(memberships__user=request.user).distinct()[:5]
        discovery_data = InteractiveGroupSerializer(discovery_groups, many=True).data

        return Response({
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "name": request.user.username,
            },
            "wallet": {
                "available_balance": str(wallet_summary['available_balance']),
                "locked_balance": str(wallet_summary['locked_balance']),
            },
            "memberships": groups_data,
            "discovery_groups": discovery_data
        }, status=status.HTTP_200_OK)
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    from rest_framework.parsers import MultiPartParser, FormParser
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        
        # Handle regular fields
        if 'username' in request.data:
            user.username = request.data['username']
        if 'full_name' in request.data:
            user.full_name = request.data['full_name']
            
        # Handle file uploads
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
            
        if 'kyc_document' in request.FILES:
            user.kyc_document = request.FILES['kyc_document']
            user.kyc_status = 'pending'
            
        # Handle password change
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])
            
        user.save()
        
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
