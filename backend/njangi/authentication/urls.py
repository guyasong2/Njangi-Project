from django.urls import path
from .views import FirebaseLoginView, DashboardView, ProfileView, RegisterView, LoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('firebase-login/', FirebaseLoginView.as_view(), name='firebase-login'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
