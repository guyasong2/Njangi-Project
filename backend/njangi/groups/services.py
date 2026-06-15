from django.db import transaction
from django.core.exceptions import ValidationError
from .models import NjangiGroup, Membership
import logging

logger = logging.getLogger(__name__)

class GroupService:
    @staticmethod
    @transaction.atomic
    def join_group(group_id, user, invite_code=None):
        """
        Atomically handles a user joining a group.
        Private groups require a valid invite_code.
        """
        # 1. Lock the group row for editing capacity
        group = NjangiGroup.objects.select_for_update().get(id=group_id)
        
        # 2. Privacy & Invite Code Check
        if group.is_private:
            if not invite_code:
                raise PermissionError("Private groups require a valid invite code.")
            if invite_code != group.invite_code:
                raise PermissionError("The provided invite code is invalid.")
            
        # 3. Capacity Check (Atomic)
        current_count = group.memberships.count()
        if current_count >= group.cycle_length:
            raise ValidationError("This Njangi group has reached its maximum capacity.")
            
        # 4. Duplicate Check
        if Membership.objects.filter(group=group, user=user).exists():
            raise ValidationError("You are already a member or pending for this group.")
            
        # 5. Business Logic: Join for NEXT Cycle
        next_cycle = group.current_cycle_number + 1
        
        membership = Membership.objects.create(
            group=group,
            user=user,
            payout_order=current_count + 1,
            status='PENDING_NEXT_CYCLE',
            cycle_start_index=next_cycle,
            role='MEMBER'
        )
        
        logger.info(f"User {user.phone_number} joined Group {group.name} (Atomic Join)")
        return membership

    @staticmethod
    @transaction.atomic
    def add_member(group_id, admin_user, target_user):
        """
        Atomically allows an admin to add a member.
        """
        group = NjangiGroup.objects.select_for_update().get(id=group_id)
        
        if group.admin != admin_user:
            raise PermissionError("Only the group admin can add members.")
            
        if group.memberships.count() >= group.cycle_length:
            raise ValidationError("Group is full.")
            
        if Membership.objects.filter(group=group, user=target_user).exists():
            raise ValidationError("User is already a member.")
            
        return Membership.objects.create(
            group=group,
            user=target_user,
            payout_order=group.memberships.count() + 1
        )
