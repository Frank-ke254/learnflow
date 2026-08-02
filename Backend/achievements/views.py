from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Certificate, Badge, UserStats
from .serializers import CertificateSerializer, BadgeSerializer, UserStatsSerializer


class AchievementsView(APIView):
    """
    GET /api/achievements/
        Returns the user's certificates, badges, and aggregated stats.
        Frontend (achievements.js) expects:
        {
            "certificates": [...],
            "badges": [...],
            "stats": { ... }
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Certificates earned by this user
        certificates = Certificate.objects.filter(user=user)
        cert_data    = CertificateSerializer(certificates, many=True).data

        # 2. Badges earned by this user
        # Fetch manually awarded badges
        badges       = user.badges.all()
        badge_data   = BadgeSerializer(badges, many=True).data
        
        # Fetch dynamically earned badges (from activity feed)
        from dashboard.views import DashboardWidgetsView
        dynamic_badges = DashboardWidgetsView()._get_user_achievements(user)
        
        # Combine them
        badge_data.extend(dynamic_badges)

        # 3. User stats (create if doesn't exist)
        stats, _ = UserStats.objects.get_or_create(user=user)
        stats_data = UserStatsSerializer(stats).data

        return Response({
            'certificates': cert_data,
            'badges':       badge_data,
            'stats':        stats_data,
        })


class IssueCertificateView(APIView):
    """
    POST /api/achievements/issue-certificate/
        Body: { "user_id": <int>, "title": "...", "course_name": "..." }

        Admin/mentor endpoint to manually issue a certificate.
        In production, this would be triggered automatically
        when a course is completed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only staff or mentors can issue certificates
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'mentor'):
            return Response(
                {'error': 'Only staff/mentors can issue certificates.'},
                status=403
            )

        user_id     = request.data.get('user_id')
        title       = request.data.get('title')
        course_name = request.data.get('course_name', '')

        if not user_id or not title:
            return Response({'error': 'user_id and title are required.'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        cert = Certificate.objects.create(
            user=user,
            title=title,
            course_name=course_name,
            cert_type='Full Course',
            status='Verified',
        )

        return Response({
            'message': f'Certificate issued to {user.username}',
            'certificate': CertificateSerializer(cert).data,
        }, status=201)


class AwardBadgeView(APIView):
    """
    POST /api/achievements/award-badge/
        Body: { "user_id": <int>, "badge_id": <int> }

        Staff/mentor endpoint to award a badge to a user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or getattr(request.user, 'role', '') == 'mentor'):
            return Response({'error': 'Only staff/mentors can award badges.'}, status=403)

        user_id  = request.data.get('user_id')
        badge_id = request.data.get('badge_id')

        if not user_id or not badge_id:
            return Response({'error': 'user_id and badge_id are required.'}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user  = User.objects.get(id=user_id)
            badge = Badge.objects.get(id=badge_id)
        except (User.DoesNotExist, Badge.DoesNotExist):
            return Response({'error': 'User or Badge not found.'}, status=404)

        badge.awarded_to.add(user)

        return Response({
            'message': f'{badge.name} awarded to {user.username}',
        }, status=200)