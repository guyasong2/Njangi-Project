from celery import shared_task
from django.utils import timezone
from .models import NjangiGroup, Membership, Contribution
from notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)

@shared_task
def trigger_cycle_contributions():
    """
    Scheduled task that runs periodically (e.g. daily) to trigger contributions
    for the current cycle of active groups.
    """
    groups = NjangiGroup.objects.all()
    logger.info(f"Triggering cycle contributions for {groups.count()} groups.")
    
    for group in groups:
        # Get active members
        active_memberships = group.memberships.filter(status='ACTIVE')
        
        for membership in active_memberships:
            # Check if contribution already exists for this cycle
            contribution_exists = Contribution.objects.filter(
                membership=membership,
                cycle_number=group.current_cycle_number
            ).exists()
            
            if not contribution_exists:
                # Create pending contribution
                contribution = Contribution.objects.create(
                    membership=membership,
                    amount=group.contribution_amount,
                    cycle_number=group.current_cycle_number,
                    payment_method='MOMO',  # Default pending method
                    is_verified=False
                )
                logger.info(f"Created pending contribution {contribution.id} for {membership.user.username} in group {group.name}")
                
                # Notify User via simulated Push/SMS
                NotificationService.send_payment_prompt(
                    user=membership.user,
                    amount=group.contribution_amount,
                    group_name=group.name,
                    cycle_number=group.current_cycle_number
                )
