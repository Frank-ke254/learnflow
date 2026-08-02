from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from courses.models import Enrollment
from dashboard.models import Activity, UserStats
from community.models import CommunityProject
from .models import Week, Lesson, Quiz, QuizAttempt, UserProgress, QuizAnswer, ProjectSubmission
from .serializers import WeekSerializer, QuizAttemptSerializer, ProjectSubmissionSerializer


class WeekContentView(APIView):
    """
    GET /api/lessons/week/<week_number>/
    Returns all content for a specific week (lessons, quiz, project status).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, week_number):
        # Get user's active enrollment
        enrollment = Enrollment.objects.filter(user=request.user, is_active=True).first()
        if not enrollment:
            return Response({'error': 'No active enrollment.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create progress tracker
        progress, _ = UserProgress.objects.get_or_create(
            user=request.user,
            course=enrollment.course,
            defaults={'current_week': 1}
        )

        # Check if week is unlocked
        if not progress.can_access_week(week_number):
            return Response({
                'error': 'This week is locked. Complete the previous week first.',
                'current_week': progress.current_week
            }, status=status.HTTP_403_FORBIDDEN)

        # Get week content
        try:
            week = Week.objects.get(course=enrollment.course, week_number=week_number)
        except Week.DoesNotExist:
            return Response({'error': 'Week not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = WeekSerializer(week, context={'request': request})
        return Response(serializer.data)


class QuizSubmitView(APIView):
    """
    POST /api/lessons/quiz/<quiz_id>/submit/
    Body: { "answers": { "question_id": "choice_id", ... } }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

        answers = request.data.get('answers', {})
        
        # Calculate score
        total_questions = quiz.questions.count()
        correct_count = 0

        for question_id, choice_id in answers.items():
            try:
                choice = QuizAnswer.objects.get(id=choice_id, question_id=question_id)
                if choice.is_correct:
                    correct_count += 1
            except QuizAnswer.DoesNotExist:
                continue

        score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        passed = score >= quiz.passing_score

        # Check if submission is late (after week deadline)
        is_late = not quiz.week.is_on_time()
        
        # Apply late penalty: 70% weight if late
        weighted_score = score * 0.7 if is_late else score

        # Save attempt
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=score,
            weighted_score=weighted_score,
            passed=passed,
            is_late=is_late
        )

        # If passed, check if project is also submitted to unlock next week
        if passed:
            self._check_week_completion(request.user, quiz.week)

        return Response({
            'score': score,
            'passed': passed,
            'passing_score': quiz.passing_score,
            'correct': correct_count,
            'total': total_questions
        })

    def _check_week_completion(self, user, week):
        """Unlock next week if both quiz passed AND project submitted."""
        quiz_passed = QuizAttempt.objects.filter(user=user, quiz=week.quiz, passed=True).exists()
        project_submitted = ProjectSubmission.objects.filter(user=user, week=week).exists()

        if quiz_passed and project_submitted:
            progress = UserProgress.objects.get(user=user, course=week.course)
            if progress.current_week == week.week_number:
                progress.unlock_next_week()


class ProjectSubmitView(APIView):
    """
    POST /api/lessons/project/submit/
    Body: { "week_id": <int>, "github_url": "...", "notes": "..." }
    
    Creates ProjectSubmission + CommunityProject for peer review.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        week_id = request.data.get('week_id')
        github_url = request.data.get('github_url')
        notes = request.data.get('notes', '')

        if not week_id or not github_url:
            return Response({'error': 'week_id and github_url are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            week = Week.objects.get(id=week_id)
        except Week.DoesNotExist:
            return Response({'error': 'Week not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if already submitted
        if ProjectSubmission.objects.filter(user=request.user, week=week).exists():
            return Response({'error': 'Project already submitted for this week.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if submission is late
        is_late = not week.is_on_time()

        # Create community project for peer review
        community_project = CommunityProject.objects.create(
            author=request.user,
            title=f"{week.title} - {request.user.username}",
            category=week.course.category,
            description=notes or f"Week {week.week_number} project submission",
            github_url=github_url,
            status='approved'  # Auto-approve lesson projects for peer review
        )

        # Create project submission
        submission = ProjectSubmission.objects.create(
            user=request.user,
            week=week,
            github_url=github_url,
            notes=notes,
            is_late=is_late,
            community_project=community_project
        )

        # Check if week is complete (quiz + project)
        self._check_week_completion(request.user, week)

        return Response({
            'message': 'Project submitted! It has been posted to the community for review.',
            'submission_id': submission.id,
            'community_project_id': community_project.id
        }, status=status.HTTP_201_CREATED)

    def _check_week_completion(self, user, week):
        """Unlock next week if both quiz passed AND project submitted."""
        quiz_passed = QuizAttempt.objects.filter(user=user, quiz=week.quiz, passed=True).exists()
        project_submitted = ProjectSubmission.objects.filter(user=user, week=week).exists()

        if quiz_passed and project_submitted:
            progress = UserProgress.objects.get(user=user, course=week.course)
            if progress.current_week == week.week_number:
                progress.unlock_next_week()


class UserProgressView(APIView):
    """
    GET /api/lessons/progress/
    Returns user's current week and resume URL.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollment = Enrollment.objects.filter(user=request.user, is_active=True).first()
        if not enrollment:
            return Response({'error': 'No active enrollment.'}, status=status.HTTP_400_BAD_REQUEST)

        progress, _ = UserProgress.objects.get_or_create(
            user=request.user,
            course=enrollment.course,
            defaults={'current_week': 1}
        )

        return Response({
            'current_week': progress.current_week,
            'resume_url': f'/lesson.html?week={progress.current_week}',
            'course_title': enrollment.course.title
        })


# -----------------------------------------------------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_detail(request, quiz_id):
    """
    Get quiz details with all questions
    GET /api/lessons/quiz/<id>/
    """
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id)
        
        # Get all questions for this quiz
        questions = Quiz.objects.filter(quiz=quiz).order_by('order')
        
        questions_data = [{
            'id': q.id,
            'text': q.text,
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            # Don't send correct_answer to frontend yet
        } for q in questions]
        
        quiz_data = {
            'id': quiz.id,
            'title': quiz.title,
            'week_number': quiz.week.week_number,
            'passing_score': quiz.passing_score,
            'time_limit': getattr(quiz, 'time_limit', None),  # Optional field
            'questions': questions_data,
            'total_questions': len(questions_data)
        }
        
        return Response(quiz_data)
        
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found'},
            status=status.HTTP_404_NOT_FOUND
        )
 
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    """
    Submit quiz answers and get results
    POST /api/lessons/quiz/<id>/submit/
    Body: {
        "answers": [
            {"question_id": 1, "selected_answer": "A"},
            {"question_id": 2, "selected_answer": "C"},
            ...
        ],
        "time_taken": 450  // seconds
    }
    """
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id)
        
        answers_data = request.data.get('answers', [])
        time_taken = request.data.get('time_taken', 0)
        
        if not answers_data:
            return Response(
                {'error': 'No answers provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create quiz attempt
        quiz_attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=0,  # Will be calculated
            time_taken=time_taken
        )
        
        # Process each answer
        correct_count = 0
        detailed_answers = []
        
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_answer = answer_data.get('selected_answer')
            
            if not question_id or not selected_answer:
                continue
            
            try:
                question = Quiz.objects.get(id=question_id, quiz=quiz)
                is_correct = selected_answer.upper() == question.correct_answer.upper()
                
                # Create quiz answer record
                QuizAnswer.objects.create(
                    attempt=quiz_attempt,
                    question=question,
                    selected_answer=selected_answer.upper(),
                    is_correct=is_correct
                )
                
                if is_correct:
                    correct_count += 1
                
                detailed_answers.append({
                    'question_id': question.id,
                    'selected_answer': selected_answer.upper(),
                    'correct_answer': question.correct_answer,
                    'is_correct': is_correct,
                    'explanation': getattr(question, 'explanation', None)
                })
                
            except Quiz.DoesNotExist:
                continue
        
        # Update quiz attempt score
        quiz_attempt.score = correct_count
        quiz_attempt.save()
        
        # Calculate percentage
        total_questions = len(answers_data)
        score_percent = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        # Check if passed
        passed = score_percent >= quiz.passing_score
        
        # Award points
        points_awarded = 0
        if passed:
            # Award points based on score
            if score_percent == 100:
                points_awarded = 20  # Perfect score
            elif score_percent >= 90:
                points_awarded = 15  # Excellent
            elif score_percent >= quiz.passing_score:
                points_awarded = 10  # Passed
            
            # Update user stats
            stats, _ = UserStats.objects.get_or_create(user=request.user)
            stats.total_points += points_awarded
            stats.save()
            
            # Create activity
            Activity.objects.create(
                user=request.user,
                activity_type='quiz_completed',
                title=f'Completed {quiz.title}',
                description=f'Score: {int(score_percent)}%'
            )
        
        return Response({
            'quiz_id': quiz.id,
            'score': correct_count,
            'total_questions': total_questions,
            'score_percent': round(score_percent, 1),
            'passed': passed,
            'passing_score': quiz.passing_score,
            'points_awarded': points_awarded,
            'answers': detailed_answers,
            'time_taken': time_taken
        })
        
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_attempts(request, quiz_id):
    """
    Get user's previous attempts for a quiz
    GET /api/lessons/quiz/<id>/attempts/
    """
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id)
        
        attempts = QuizAttempt.objects.filter(
            user=request.user,
            quiz=quiz
        ).order_by('-submitted_at')
        
        attempts_data = [{
            'id': attempt.id,
            'score': attempt.score,
            'total_questions': Quiz.objects.filter(quiz=quiz).count(),
            'score_percent': round((attempt.score / Quiz.objects.filter(quiz=quiz).count()) * 100, 1),
            'time_taken': attempt.time_taken,
            'submitted_at': attempt.submitted_at.isoformat()
        } for attempt in attempts]
        
        return Response({
            'quiz_id': quiz.id,
            'attempts': attempts_data,
            'total_attempts': len(attempts_data),
            'best_score': max([a['score_percent'] for a in attempts_data]) if attempts_data else 0
        })
        
    except Quiz.DoesNotExist:
        return Response(
            {'error': 'Quiz not found'},
            status=status.HTTP_404_NOT_FOUND
        )
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_week_quiz(request, week_number):
    """
    Get quiz for a specific week
    GET /api/lessons/week/<number>/quiz/
    """
    from .models import Week
    
    try:
        week = get_object_or_404(Week, week_number=week_number)
        
        # Check if quiz exists for this week
        if hasattr(week, 'quiz'):
            quiz = week.quiz
            return Response({
                'id': quiz.id,
                'title': quiz.title,
                'week_number': week.week_number,
                'passing_score': quiz.passing_score,
                'has_quiz': True
            })
        else:
            return Response({
                'has_quiz': False,
                'message': 'No quiz available for this week'
            })
            
    except Week.DoesNotExist:
        return Response(
            {'error': 'Week not found'},
            status=status.HTTP_404_NOT_FOUND
        )
 