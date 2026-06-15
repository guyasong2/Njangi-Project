from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NjangiGroupViewSet

router = DefaultRouter()
router.register(r'', NjangiGroupViewSet, basename='group')

from authentication.views import GroupMembersView

urlpatterns = [
    path('', include(router.urls)),
    path('<int:group_id>/members/', GroupMembersView.as_view(), name='group-members'),
]
