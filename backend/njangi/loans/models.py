from django.db import models
from groups.models import NjangiGroup, Membership

class LoanRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REPAID', 'Repaid')
    )
    group = models.ForeignKey(NjangiGroup, on_delete=models.CASCADE, related_name='loan_requests')
    requester = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name='loans')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    votes_for = models.IntegerField(default=0)
    votes_against = models.IntegerField(default=0)

    def __str__(self):
        return f"Loan {self.amount} for {self.requester.user.phone_number}"
