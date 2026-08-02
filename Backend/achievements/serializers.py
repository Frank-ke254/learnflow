from rest_framework import serializers
from .models import Certificate, Badge, UserStats


class CertificateSerializer(serializers.ModelSerializer):
    # Frontend expects 'date' not 'issued_date', and formatted as "Dec 2025"
    date = serializers.SerializerMethodField()
    type = serializers.CharField(source='cert_type')

    class Meta:
        model  = Certificate
        fields = ['id', 'title', 'date', 'status', 'type', 'pdf_url']

    def get_date(self, obj):
        return obj.issued_date.strftime('%b %Y')


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Badge
        fields = ['name', 'icon', 'description']


class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserStats
        fields = [
            'total_points',
            'current_streak',
            'longest_streak',
            'projects_validated',
            'courses_completed',
        ]