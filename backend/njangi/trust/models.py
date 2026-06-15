from django.db import models
from django.conf import settings

class TrustScore(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trust_score')
    score = models.IntegerField(default=100)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trust Score of {self.user.phone_number}: {self.score}"
