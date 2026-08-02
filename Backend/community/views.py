from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import CommunityProject
from .serializers import CommunityProjectSerializer, SubmitProjectSerializer, PeerProjectReviewSerializer


class CommunityProjectListView(APIView):
    """
    GET  /api/community/projects/
        Returns all projects (approved + pending) so users can see their own submissions.
        Mentors can filter/approve via the detail endpoint.

    POST /api/community/projects/
        Learner submits their own project for peer review.
        Sets status to 'pending' automatically.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = CommunityProject.objects.select_related('submitted_course', 'submitted_cohort').all().order_by('-submitted_at')

        # Mentors/admin can see all projects.
        if request.user.role not in ['mentor', 'admin']:
            from courses.models import Enrollment
            active_enrollment = Enrollment.objects.filter(user=request.user, is_active=True).select_related('course', 'cohort').first()
            if active_enrollment:
                projects = projects.filter(
                    Q(author=request.user) | Q(
                        submitted_course=active_enrollment.course,
                        submitted_cohort=active_enrollment.cohort
                    )
                )
            else:
                # Not enrolled users can only see their own submissions.
                projects = projects.filter(author=request.user)

        serializer = CommunityProjectSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = SubmitProjectSerializer(data=request.data)
        if serializer.is_valid():
            from courses.models import Enrollment
            active_enrollment = Enrollment.objects.filter(user=request.user, is_active=True).select_related('course', 'cohort').first()
            if not active_enrollment:
                return Response(
                    {'error': 'You must enroll in a course before submitting a project.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Auto-assign the authenticated user as author
            serializer.save(
                author=request.user,
                status='pending',
                submitted_course=active_enrollment.course,
                submitted_cohort=active_enrollment.cohort
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommunityProjectDetailView(APIView):
    """
    GET   /api/community/projects/<pk>/
    PATCH /api/community/projects/<pk>/
        Mentor-only: approve, reject, or request revisions.
    """
    permission_classes = [IsAuthenticated]

    def _get_project(self, pk):
        try:
            return CommunityProject.objects.get(pk=pk)
        except CommunityProject.DoesNotExist:
            return None

    def get(self, request, pk):
        project = self._get_project(pk)
        if not project:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role not in ['mentor', 'admin'] and project.author_id != request.user.id:
            from courses.models import Enrollment
            active_enrollment = Enrollment.objects.filter(user=request.user, is_active=True).select_related('course', 'cohort').first()
            if (
                not active_enrollment
                or project.submitted_course_id != active_enrollment.course_id
                or project.submitted_cohort_id != active_enrollment.cohort_id
            ):
                return Response({'error': 'You can only view projects from your enrolled cohort.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(CommunityProjectSerializer(project, context={'request': request}).data)

    def patch(self, request, pk):
        project = self._get_project(pk)
        if not project:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only mentors/admins can change status
        if request.user.role not in ['mentor', 'admin']:
            return Response(
                {'error': 'Only mentors can review projects.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Ignore any extra "feedback" field when updating the project itself.
        # Text feedback is handled via the ProjectFeedback model.
        data = request.data.copy()
        feedback_text = data.pop('feedback', None)
        mentor_rating = data.pop('mentor_rating', None)
        rubric = _extract_rubric_scores(data)

        serializer = CommunityProjectSerializer(project, data=data, partial=True)
        if serializer.is_valid():
            updated_project = serializer.save()
            
            # 🔥 NEW: Auto-complete capstone topic when project approved
            if updated_project.status == 'approved':
                self._complete_capstone_topic(updated_project)
            
            # Optionally create a ProjectFeedback record when feedback is provided
            if mentor_rating is not None:
                try:
                    mentor_rating = int(mentor_rating)
                except (TypeError, ValueError):
                    mentor_rating = 5
            else:
                mentor_rating = rubric['rating']
            mentor_rating = max(1, min(5, mentor_rating))

            if feedback_text:
                from .models import ProjectFeedback
                ProjectFeedback.objects.create(
                    project=updated_project,
                    mentor=request.user,
                    feedback_text=feedback_text,
                    rating=mentor_rating,
                    syntax_score=rubric['syntax_score'],
                    structure_score=rubric['structure_score'],
                    functionality_score=rubric['functionality_score'],
                    documentation_score=rubric['documentation_score'],
                )

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _complete_capstone_topic(self, project):
        """
        Placeholder hook for when a mentor approves a project.
        The previous implementation tried to link to a 'capstone' SkillTopic
        using fields that no longer exist on the current SkillTopic model,
        which caused runtime FieldError exceptions.

        For now this is a safe no-op so mentor approval works without 500s.
        If you later add a dedicated capstone/lesson mapping, implement it here.
        """
        return


class PeerProjectReviewView(APIView):
    """
    POST /api/community/projects/<pk>/peer-review/
        Peer feedback + rating by learners.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            project = CommunityProject.objects.get(pk=pk)
        except CommunityProject.DoesNotExist:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        if project.author_id == request.user.id:
            return Response({'error': 'You cannot review your own project.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role not in ['student', 'mentor', 'admin']:
            return Response({'error': 'Only authenticated learners/mentors can review.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role not in ['mentor', 'admin']:
            from courses.models import Enrollment
            active_enrollment = Enrollment.objects.filter(user=request.user, is_active=True).select_related('course', 'cohort').first()
            if (
                not active_enrollment
                or project.submitted_course_id != active_enrollment.course_id
                or project.submitted_cohort_id != active_enrollment.cohort_id
            ):
                return Response({'error': 'You can only review projects from peers in your cohort.'}, status=status.HTTP_403_FORBIDDEN)

        from .models import PeerProjectReview
        if PeerProjectReview.objects.filter(project=project).exists():
            return Response({'error': 'Peer feedback is locked for this project.'}, status=status.HTTP_400_BAD_REQUEST)

        if PeerProjectReview.objects.filter(project=project, reviewer=request.user).exists():
            return Response({'error': 'You already submitted peer feedback for this project.'}, status=status.HTTP_400_BAD_REQUEST)

        rubric = _extract_rubric_scores(request.data)
        rating = request.data.get('rating')
        if rating is None:
            rating = rubric['rating']
        else:
            try:
                rating = int(rating)
            except (TypeError, ValueError):
                rating = rubric['rating']
        feedback_text = request.data.get('feedback_text', '').strip()

        if rating < 1 or rating > 5:
            return Response({'error': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        review, _ = PeerProjectReview.objects.update_or_create(
            project=project,
            reviewer=request.user,
            defaults={
                'rating': rating,
                'feedback_text': feedback_text,
                'syntax_score': rubric['syntax_score'],
                'structure_score': rubric['structure_score'],
                'functionality_score': rubric['functionality_score'],
                'documentation_score': rubric['documentation_score'],
            }
        )

        return Response(PeerProjectReviewSerializer(review).data, status=status.HTTP_200_OK)

from .models import DiscussionThread, DiscussionReply
from .serializers import DiscussionThreadSerializer, DiscussionReplySerializer
from rest_framework.exceptions import PermissionDenied


def _clamp_score(value):
    try:
        numeric = int(value)
    except (TypeError, ValueError):
        numeric = 0
    return max(0, min(3, numeric))


def _extract_rubric_scores(data):
    syntax = _clamp_score(data.get('syntax_score'))
    structure = _clamp_score(data.get('structure_score'))
    functionality = _clamp_score(data.get('functionality_score'))
    documentation = _clamp_score(data.get('documentation_score'))
    total = syntax + structure + functionality + documentation
    # Convert 0..12 rubric total to 1..5 rating for compatibility
    rating = max(1, min(5, round((total / 12) * 5)))
    return {
        'syntax_score': syntax,
        'structure_score': structure,
        'functionality_score': functionality,
        'documentation_score': documentation,
        'rating': rating,
    }

class ThreadListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get('filter', 'all')
        if filter_type == 'solved':
            threads = DiscussionThread.objects.filter(status='solved')
        elif filter_type == 'active':
            threads = DiscussionThread.objects.filter(status='active')
        elif filter_type == 'my-threads':
            threads = DiscussionThread.objects.filter(author=request.user)
        else:
            threads = DiscussionThread.objects.all()

        threads = threads.order_by('-last_activity')
        serializer = DiscussionThreadSerializer(threads, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DiscussionThreadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ThreadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
            return Response(DiscussionThreadSerializer(thread).data)
        except DiscussionThread.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
        except DiscussionThread.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if thread.author != request.user and request.user.role not in ['mentor', 'admin']:
            return Response({'error': 'Only the author can modify this thread.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = DiscussionThreadSerializer(thread, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ThreadRepliesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
        except DiscussionThread.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        replies = thread.replies.all().order_by('created_at')
        return Response(DiscussionReplySerializer(replies, many=True).data)

    def post(self, request, pk):
        try:
            thread = DiscussionThread.objects.get(pk=pk)
        except DiscussionThread.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DiscussionReplySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, thread=thread)
            # Update last activity
            thread.save() # Saves Auto_Now field
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)