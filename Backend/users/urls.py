# urls.py
from django.urls import path
from .views import MyTokenObtainPairView, RegisterView, MeView, ChangePasswordView, PublicPortfolioView

urlpatterns = [
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', MeView.as_view(), name='user_me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('portfolio/<str:username>/', PublicPortfolioView.as_view(), name='public_portfolio'),
]

# from django.urls import path
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from .views import RegisterView, MeView

# urlpatterns = [
#     path('register/', RegisterView.as_view()),
#     path('login/', TokenObtainPairView.as_view()),
#     path('me/', MeView.as_view()),
#     path('token/refresh/', TokenRefreshView.as_view()),
# ]
