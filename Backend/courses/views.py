from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Course, Enrollment, Cohort
from .serializers import CourseSerializer, EnrollmentSerializer, EnrollRequestSerializer


class CourseListView(APIView):
    """
    GET /api/courses/
        Returns all active courses.
        If the user is already enrolled in one, that course has
        an extra 'enrolled' flag so the frontend can show it differently.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        courses = Course.objects.filter(is_active=True)

        # Get IDs of courses this user is already enrolled in
        enrolled_ids = set(
            Enrollment.objects.filter(user=request.user, is_active=True)
            .values_list('course_id', flat=True)
        )

        data = []
        for course in courses:
            serialized = CourseSerializer(course).data
            serialized['enrolled'] = course.id in enrolled_ids
            data.append(serialized)

        return Response(data)


class CourseEnrollView(APIView):
    """
    POST /api/courses/enroll/
        Body: { "course_id": <int> }

        Enrolls the user in the requested course.
        Deactivates any previous active enrollment first —
        a user can only have one active learning path at a time,
        matching the dashboard's single-course design.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EnrollRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_id = serializer.validated_data['course_id']
        cohort_id = serializer.validated_data.get('cohort_id')
        course    = Course.objects.get(id=course_id)

        if cohort_id is not None:
            cohort = Cohort.objects.get(id=cohort_id, course=course, is_active=True)
        else:
            cohort = Cohort.objects.filter(course=course, is_active=True).first()
            if cohort is None:
                cohort = Cohort.objects.create(course=course, name='General Cohort', is_active=True)

        # Deactivate any existing active enrollment for this user
        Enrollment.objects.filter(
            user=request.user,
            is_active=True
        ).update(is_active=False)

        # Create new enrollment (or reactivate if they enrolled before)
        enrollment, created = Enrollment.objects.get_or_create(
            user=request.user,
            course=course,
            defaults={'is_active': True, 'cohort': cohort}
        )

        if not created:
            # They previously enrolled — just reactivate
            enrollment.is_active = True
            enrollment.cohort = cohort
            enrollment.save()

        return Response(
            {
                'message':  f"Successfully enrolled in {course.title}!",
                'course':   CourseSerializer(course).data,
            },
            status=status.HTTP_201_CREATED
        )


class UserEnrollmentsView(APIView):
    """
    GET /api/courses/my-enrollments/
        Returns all courses the current user is or was enrolled in.
        Useful for a "My Courses" view in future.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = Enrollment.objects.filter(user=request.user).select_related('course')
        serializer  = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)