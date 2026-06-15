from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import NjangiGroup, Membership
from .serializers import NjangiGroupSerializer, InteractiveGroupSerializer

from .services import GroupService
from django.core.exceptions import ValidationError

class NjangiGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return NjangiGroup.objects.filter(
            Q(is_private=False) | Q(memberships__user=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'join']:
            return InteractiveGroupSerializer
        return NjangiGroupSerializer

    @action(detail=False, methods=['get'])
    def public(self, request):
        limit = int(request.query_params.get('limit', 5))
        queryset = NjangiGroup.objects.filter(is_private=False).exclude(memberships__user=request.user).distinct()[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Transaction safety for group creation
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            group = serializer.save(admin=request.user)

            from .models import GroupPool
            GroupPool.objects.create(group=group)

            Membership.objects.create(
                group=group,
                user=request.user,
                payout_order=1
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        invite_code = request.data.get('invite_code')
        try:
            membership = GroupService.join_group(pk, request.user, invite_code=invite_code)
            return Response({
                "message": "You have successfully joined via the secure registry.",
                "status": membership.status,
                "group_name": membership.group.name
            }, status=status.HTTP_201_CREATED)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Failed to join group. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from authentication.models import User
            target_user = User.objects.get(id=user_id)
            GroupService.add_member(pk, request.user, target_user)
            return Response({"message": "Member added securely."}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except (PermissionError, ValidationError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def remove_member(self, request, pk=None):
        group = NjangiGroup.objects.select_for_update().get(id=pk)
        if group.admin != request.user:
            return Response({"error": "Unauthorized access attempt."}, status=status.HTTP_403_FORBIDDEN)
            
        user_id = request.data.get('user_id')
        try:
            membership = Membership.objects.get(group=group, user_id=user_id)
            if user_id == group.admin.id:
                return Response({"error": "Administrators cannot be removed for project continuity."}, status=status.HTTP_400_BAD_REQUEST)
            membership.delete()
            return Response({"message": "Registry updated."}, status=status.HTTP_200_OK)
        except Membership.DoesNotExist:
            return Response({"error": "No such registry entry found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def pending_contribution(self, request, pk=None):
        group = self.get_object()
        try:
            membership = Membership.objects.get(group=group, user=request.user)
            if membership.status != 'ACTIVE':
                return Response({"error": "You are not active in this cycle yet."}, status=status.HTTP_400_BAD_REQUEST)
                
            from .models import Contribution
            # Find existing unverified contribution or create one
            contribution, created = Contribution.objects.get_or_create(
                membership=membership,
                cycle_number=group.current_cycle_number,
                is_verified=False,
                defaults={
                    'amount': group.contribution_amount,
                    'payment_method': 'MOMO'
                }
            )
            
            base_amount = float(contribution.amount)
            fee = base_amount * 0.01  # 1% platform fee
            total_amount = base_amount + fee
            
            return Response({
                "contribution_id": contribution.id,
                "base_amount": base_amount,
                "fee": fee,
                "total_amount": total_amount,
                "group_name": group.name
            }, status=status.HTTP_200_OK)
            
        except Membership.DoesNotExist:
            return Response({"error": "You are not a member of this group."}, status=status.HTTP_403_FORBIDDEN)

