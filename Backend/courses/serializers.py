from rest_framework import serializers
from .models import Course, Enrollment, Cohort


class CourseSerializer(serializers.ModelSerializer):
    cohorts = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = ['id', 'title', 'description', 'category', 'level', 'duration', 'cohorts']

    def get_cohorts(self, obj):
        return [
            {'id': cohort.id, 'name': cohort.name}
            for cohort in obj.cohorts.filter(is_active=True).order_by('name')
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)

    class Meta:
        model  = Enrollment
        fields = ['id', 'course', 'cohort_name', 'enrolled_at', 'is_active']


class EnrollRequestSerializer(serializers.Serializer):
    """Validates the POST body for /api/courses/enroll/"""
    course_id = serializers.IntegerField()
    cohort_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_course_id(self, value):
        if not Course.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Course not found or is no longer available.")
        return value

    def validate(self, attrs):
        course_id = attrs.get('course_id')
        cohort_id = attrs.get('cohort_id')
        if cohort_id is not None:
            if not Cohort.objects.filter(id=cohort_id, course_id=course_id, is_active=True).exists():
                raise serializers.ValidationError({"cohort_id": "Cohort not found for selected course."})
        return attrs