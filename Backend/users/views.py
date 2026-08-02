from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import RegisterSerializer, UserSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth import get_user_model


# 1. Create a custom serializer to include the role in the login response
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add the user's role to the response data
        data['role'] = self.user.role
        return data

# 2. Use the custom serializer in your Login View
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Necessary for file uploads

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # partial=True allows updating just the bio or just the picture
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password") # Added field
        user = request.user

        # 1. Verify old password
        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if new passwords match
        if new_password != confirm_password:
            return Response({"error": "New passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Basic validation (optional but recommended)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters long"}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Update password
        user.set_password(new_password)
        user.save()
        
        # Keep the user logged in after password change
        update_session_auth_hash(request, user)
        
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)


class PublicPortfolioView(APIView):
    """
    GET /api/users/portfolio/<username>/
    Public endpoint for shareable user portfolio pages.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        from community.models import CommunityProject
        from achievements.models import Badge, Certificate, UserStats

        approved_projects = CommunityProject.objects.filter(
            author=user,
            status='approved',
        ).order_by('-submitted_at')

        latest_feedback = {}
        for project in approved_projects:
            latest = project.feedbacks.order_by('-created_at').first()
            latest_feedback[project.id] = {
                "text": latest.feedback_text,
                "mentor": latest.mentor.username,
                "created_at": latest.created_at,
            } if latest else None

        projects_payload = []
        for project in approved_projects:
            feedback = latest_feedback.get(project.id)
            projects_payload.append({
                "id": project.id,
                "title": project.title,
                "category": project.category,
                "description": project.description,
                "github_url": project.github_url,
                "submitted_at": project.submitted_at,
                "feedback": feedback["text"] if feedback else None,
                "mentor_name": feedback["mentor"] if feedback else None,
            })

        badges = user.badges.all()
        certificates = Certificate.objects.filter(user=user, status='Verified').order_by('-issued_date')
        stats, _ = UserStats.objects.get_or_create(user=user)

        return Response({
            "user": {
                "username": user.username,
                "role": user.role,
                "bio": user.bio,
                "profile_picture": user.profile_picture.url if user.profile_picture else None,
            },
            "stats": {
                "total_points": stats.total_points,
                "courses_completed": stats.courses_completed,
                "projects_validated": stats.projects_validated,
                "current_streak": stats.current_streak,
            },
            "projects": projects_payload,
            "badges": [
                {"name": b.name, "icon": b.icon, "description": b.description}
                for b in badges
            ],
            "certificates": [
                {"title": c.title, "course_name": c.course_name, "issued_date": c.issued_date}
                for c in certificates
            ],
        })