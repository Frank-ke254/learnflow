from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from courses.models import Enrollment
from .models import Score, Notification, Skill, UserSkillTopic, SkillTopic, UserStats, TopicCompletion, SkillWeek, Activity
from .serializers import ScoreSerializer, SkillSerializer, UserStatsSerializer, SkillWeekSerializer, SkillTopicDetailSerializer, SkillTopicListSerializer

# ========================================
# NEW: Dashboard Widgets Endpoint
# ========================================
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_dashboard_widgets(request):
#     """
#     Get dashboard widget data - returns empty arrays for new users
#     """
#     user = request.user
    
#     # Recent Activity (empty if new user)
#     recent_activities = []
#     completed_count = TopicCompletion.objects.filter(user=user).count()
    
#     if completed_count > 0:
#         # Get recent completions
#         recent_completions = TopicCompletion.objects.filter(
#             user=user
#         ).select_related('topic', 'topic__week').order_by('-completed_at')[:5]
        
#         recent_activities = [{
#             'type': 'lesson_completed',
#             'title': f'Completed: {completion.topic.title}',
#             'description': f'Week {completion.topic.week.number}' if completion.topic.week else 'Lesson',
#             'timestamp': completion.completed_at.isoformat(),
#             'icon': 'check'
#         } for completion in recent_completions]
    
#     # Upcoming Deadlines (empty for now - implement when assignments are added)
#     upcoming_deadlines = []
    
#     # Achievements/Badges
#     achievements = []
#     if completed_count >= 1:
#         achievements.append({
#             'name': 'First Submission',
#             'description': 'Completed your first lesson!',
#             'icon': '🚀',
#             'earned_at': 'Recently'
#         })
    
#     if completed_count >= 5:
#         achievements.append({
#             'name': 'On Fire',
#             'description': 'Completed 5 lessons',
#             'icon': '🔥',
#             'earned_at': 'Recently'
#         })
    
#     if completed_count >= 10:
#         achievements.append({
#             'name': 'Perfect Score',
#             'description': 'Completed 10 lessons',
#             'icon': '💯',
#             'earned_at': 'Recently'
#         })
    
#     # Learning Journey Calendar (empty if no activity)
#     activity_calendar = {
#         'total_active_days': 0,
#         'current_streak': 0,
#         'longest_streak': 0,
#         'days': []
#     }
    
#     if completed_count > 0:
#         # Calculate unique active days
#         unique_dates = TopicCompletion.objects.filter(
#             user=user
#         ).values_list('completed_at__date', flat=True).distinct()
        
#         activity_calendar['total_active_days'] = unique_dates.count()
        
#         # Get streak from user stats
#         try:
#             user_stats = UserStats.objects.get(user=user)
#             activity_calendar['current_streak'] = user_stats.streak_days
#         except UserStats.DoesNotExist:
#             activity_calendar['current_streak'] = 0
    
#     # Mentor Feedback (empty until projects are submitted)
#     mentor_feedback = []
    
#     return Response({
#         'recent_activities': recent_activities,
#         'upcoming_deadlines': upcoming_deadlines,
#         'achievements': achievements,
#         'activity_calendar': activity_calendar,
#         'mentor_feedback': mentor_feedback
#     })


class DashboardView(APIView):
    """
    Main endpoint for dash.html frontend.
    Returns: user info, current learning path progress, and gamification stats.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get active enrollment
        active_enrollment = Enrollment.objects.filter(user=user, is_active=True).select_related('course').first()

        # Get or create user stats
        stats, _ = UserStats.objects.get_or_create(user=user)

        # Calculate total points
        total_score_val = Score.objects.filter(user=user, validated=True).aggregate(Sum('value'))['value__sum'] or 0
        display_points = stats.total_points if stats.total_points > 0 else total_score_val

        # Calculate current week properly
        if active_enrollment:
            # Get all weeks
            all_weeks = SkillWeek.objects.all().order_by('number')
            
            # Default to Week 1
            current_week = 1
            resume_topic_id = None
            
            # Find the first week with incomplete topics
            for week in all_weeks:
                total_topics = week.topics.filter(is_published=True).count()
                completed_topics = week.topics.filter(
                    is_published=True,
                    completed_by=user
                ).count()
                
                # If this week has incomplete topics, this is the current week
                if completed_topics < total_topics:
                    current_week = week.number
                    
                    # Find first incomplete topic in this week
                    first_incomplete = week.topics.filter(
                        is_published=True
                    ).exclude(
                        completed_by=user
                    ).order_by('order').first()  # ← Added order_by for consistency
                    
                    if first_incomplete:
                        resume_topic_id = first_incomplete.id
                    
                    break
                
                # If all topics complete, continue to next week
                # But keep this as fallback (user completed everything)
                current_week = week.number
                last_topic = week.topics.filter(is_published=True).last()
                if last_topic:
                    resume_topic_id = last_topic.id
            
            # NOW get the week title AFTER we know the current week number
            current_week_obj = SkillWeek.objects.filter(number=current_week).first()
            week_title = current_week_obj.title if current_week_obj else active_enrollment.course.title
            week_description = current_week_obj.description if current_week_obj else active_enrollment.course.description
            
            # Build resume URL
            if resume_topic_id:
                resume_url = f'lesson.html?week={current_week}&topic={resume_topic_id}'
            else:
                resume_url = 'skills.html'
            
            # Calculate overall progress
            total_all_topics = 0
            completed_all_topics = 0
            
            for week in all_weeks:
                week_topics = week.topics.filter(is_published=True)
                total_all_topics += week_topics.count()
                completed_all_topics += week_topics.filter(completed_by=user).count()
            
            avg_progress = (completed_all_topics / total_all_topics * 100) if total_all_topics > 0 else 0
            
        else:
            avg_progress = 0
            current_week = 1
            week_title = "Choose a Course"
            week_description = "No active path"
            resume_url = 'courses.html'

        return Response({
            "user_info": {
                "username": user.username,
                "full_name": getattr(user, 'first_name', user.username) or user.username,
                "role": getattr(user, 'role', 'Student').upper()
            },
            "learning_status": {
                "current_week": str(current_week).zfill(2),
                "course_title": week_title,
                "path_description": week_description,
                "progress_percentage": int(avg_progress),
                "resume_url": resume_url
            },
            "stats": {
                "streak": stats.streak_days,
                "points": display_points,
                "projects_validated": stats.projects_validated
            }
        })

class SkillsView(APIView):
    """
    GET /api/dashboard/skills/
    Returns all skills for the user's active enrollment.
    NOTE: This is for the OLD skill system - NEW system uses SkillWeek/SkillTopic
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get skills for the user's active course (OLD system)
        active_enrollment = Enrollment.objects.filter(user=request.user, is_active=True).first()

        if not active_enrollment:
            return Response([])

        skills = Skill.objects.filter(
            user=request.user,
            course=active_enrollment.course
        )

        serializer = SkillSerializer(
            skills, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ToggleSkillTopicView(APIView):
    """
    POST /api/dashboard/skills/topics/<int:topic_id>/toggle/
    Toggles topic completion. Capstone topics require mentor validation.
    NOTE: This works with the NEW SkillTopic (week-based)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_id):
        try:
            # Get the NEW SkillTopic (week-based)
            topic = SkillTopic.objects.get(id=topic_id, is_published=True)
        except SkillTopic.DoesNotExist:
            return Response({'error': 'Topic not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create UserSkillTopic
        obj, _ = UserSkillTopic.objects.get_or_create(
            user=request.user,
            topic=topic
        )

        # Toggle completion
        obj.completed = not obj.completed
        obj.save()

        # Also update TopicCompletion for consistency
        if obj.completed:
            TopicCompletion.objects.update_or_create(
                user=request.user,
                topic=topic,
                defaults={'progress_percentage': 100}
            )
        else:
            TopicCompletion.objects.filter(
                user=request.user,
                topic=topic
            ).update(progress_percentage=0)

        return Response({
            'message': 'Topic updated',
            'completed': obj.completed,
            'topic_id': topic.id
        })


class SkillTopicListView(APIView):
    """
    GET /api/dashboard/skills-topics/
    Returns all topics from the NEW SkillWeek/SkillTopic system
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = SkillTopic.objects.filter(
            is_published=True
        ).select_related('week').order_by('week__number', 'order')

        serializer = SkillTopicListSerializer(topics, many=True, context={"request": request})
        return Response(serializer.data)


# Keep this endpoint if needed, but courses/enroll/ already handles enrollment
class EnrollmentView(APIView):
    """
    POST /api/dashboard/enroll/
    Legacy endpoint - enrollment is now handled by /api/courses/enroll/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({
            "message": "Please use /api/courses/enroll/ instead"
        }, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# NEW LESSON API ENDPOINTS
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_weeks(request):
    """Get all skill weeks with topics"""
    weeks = SkillWeek.objects.prefetch_related('topics').all()
    serializer = SkillWeekSerializer(weeks, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_week_topics(request, week_number):
    """Get all topics for a specific week"""
    topics = SkillTopic.objects.filter(
        week__number=week_number,
        is_published=True
    ).select_related('week')
    
    serializer = SkillTopicListSerializer(topics, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lesson_content(request, week_number, topic_id):
    """
    Get full lesson content by week number and topic ID
    URL: /api/dashboard/lessons/{week_number}/{topic_id}/
    """
    try:
        topic = SkillTopic.objects.select_related('week').get(
            week__number=week_number,
            id=topic_id,
            is_published=True
        )
    except SkillTopic.DoesNotExist:
        return Response(
            {'error': 'Lesson not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = SkillTopicDetailSerializer(topic, context={'request': request})
    return Response(serializer.data)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def mark_lesson_complete(request):
#     """
#     Mark a lesson as complete
#     POST /api/dashboard/lessons/complete/
#     Body: {"topic_id": 5, "progress": 100}
#     """
#     topic_id = request.data.get('topic_id')
#     progress = request.data.get('progress', 100)
    
#     if not topic_id:
#         return Response(
#             {'error': 'topic_id is required'},
#             status=status.HTTP_400_BAD_REQUEST
#         )
    
#     try:
#         topic = SkillTopic.objects.get(id=topic_id, is_published=True)
#     except SkillTopic.DoesNotExist:
#         return Response(
#             {'error': 'Topic not found'},
#             status=status.HTTP_404_NOT_FOUND
#         )
    
#     # Update TopicCompletion
#     completion, created = TopicCompletion.objects.update_or_create(
#         user=request.user,
#         topic=topic,
#         defaults={'progress_percentage': progress}
#     )
    
#     # Also update UserSkillTopic for consistency
#     if progress >= 100:
#         UserSkillTopic.objects.update_or_create(
#             user=request.user,
#             topic=topic,
#             defaults={'completed': True}
#         )
    
#     return Response({
#         'message': 'Lesson progress updated successfully',
#         'topic_id': topic.id,
#         'progress': completion.progress_percentage,
#         'completed': completion.progress_percentage == 100,
#         'created': created
#     }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_lesson_complete(request):
    """
    Mark a lesson as complete and create activity log
    POST /api/skills/lessons/complete/
    Body: {"topic_id": 5, "progress": 100}
    """
    topic_id = request.data.get('topic_id')
    progress = request.data.get('progress', 100)
    
    if not topic_id:
        return Response(
            {'error': 'topic_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        topic = SkillTopic.objects.get(id=topic_id, is_published=True)
    except SkillTopic.DoesNotExist:
        return Response(
            {'error': 'Topic not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update or create topic completion
    completion, created = TopicCompletion.objects.update_or_create(
        user=request.user,
        topic=topic,
        defaults={'progress_percentage': progress}
    )
    
    # If lesson is 100% complete, create activity log
    if progress == 100:
        # Check if activity already exists to avoid duplicates
        existing_activity = Activity.objects.filter(
            user=request.user,
            activity_type='lesson_completed',
            related_topic_id=topic.id
        ).exists()
        
        if not existing_activity:
            # Create activity
            Activity.create_lesson_completed(
                user=request.user,
                topic_title=topic.title,
                score=None  # You can pass quiz score if available
            )
            
            # Award points
            stats, _ = UserStats.objects.get_or_create(user=request.user)
            stats.total_points += 10  # 10 points per lesson
            
            # Update streak
            today = timezone.now().date()
            if stats.last_login_date != today:
                if stats.last_login_date == today - timezone.timedelta(days=1):
                    stats.streak_days += 1
                else:
                    stats.streak_days = 1
                stats.last_login_date = today
            
            stats.save()
            
            # Check for milestone badges
            lesson_count = Activity.objects.filter(
                user=request.user,
                activity_type='lesson_completed'
            ).count()
            
            # Award badges at milestones
            if lesson_count in [1, 5, 10, 25, 50]:
                badge_names = {
                    1: 'First Steps',
                    5: 'Quick Learner',
                    10: 'Knowledge Seeker',
                    25: 'Dedicated Student',
                    50: 'Master Learner'
                }
                Activity.create_badge_earned(
                    user=request.user,
                    badge_name=badge_names[lesson_count],
                    badge_description=f'Completed {lesson_count} lessons'
                )
    
    return Response({
        'message': 'Lesson progress updated successfully',
        'topic_id': topic.id,
        'progress': completion.progress_percentage,
        'completed': completion.progress_percentage == 100,
        'created': created,
        'points_earned': 10 if progress == 100 and not existing_activity else 0
    }, status=status.HTTP_200_OK)
 
 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_progress(request):
    """Get user's overall learning progress"""
    weeks = SkillWeek.objects.prefetch_related('topics').all()
    
    progress_data = []
    total_completion = 0
    
    for week in weeks:
        total_topics = week.topics.filter(is_published=True).count()
        completed_topics = week.topics.filter(
            is_published=True,
            completed_by=request.user
        ).count()
        
        completion_percentage = (completed_topics / total_topics * 100) if total_topics > 0 else 0
        total_completion += completion_percentage
        
        progress_data.append({
            'week_number': week.number,
            'week_title': week.title,
            'total_topics': total_topics,
            'completed_topics': completed_topics,
            'completion_percentage': round(completion_percentage, 2)
        })
    
    overall_completion = total_completion / len(progress_data) if progress_data else 0
    
    return Response({
        'weeks': progress_data,
        'overall_completion': round(overall_completion, 2)
    })


class DashboardWidgetsView(APIView):
    """
    GET /api/dashboard/widgets/
    Returns data for all dashboard widgets including recent activities,
    achievements, mentor feedback, etc.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get recent activities (last 30 days, limit to 10)
        recent_activities = Activity.objects.filter(
            user=user,
            is_visible=True,
            created_at__gte=timezone.now() - timedelta(days=30)
        )[:10]
        
        activities_data = [{
            'type': activity.activity_type,
            'title': activity.title,
            'description': activity.description,
            'timestamp': activity.created_at.isoformat(),
            'icon': self._get_activity_icon(activity.activity_type)
        } for activity in recent_activities]
        
        # Get achievements/badges
        achievements_data = self._get_user_achievements(user)
        
        # Get mentor feedback (if you have a feedback model)
        mentor_feedback_data = self._get_mentor_feedback(user)
        
        # Activity calendar data (for streak visualization)
        activity_calendar = self._get_activity_calendar(user)
        
        # Upcoming deadlines (if you track them)
        upcoming_deadlines = self._get_upcoming_deadlines(user)
        
        return Response({
            'recent_activities': activities_data,
            'achievements': achievements_data,
            'mentor_feedback': mentor_feedback_data,
            'activity_calendar': activity_calendar,
            'upcoming_deadlines': upcoming_deadlines
        })
    
    def _get_activity_icon(self, activity_type):
        """Return emoji/icon for each activity type"""
        icon_map = {
            'lesson_completed': '✅',
            'quiz_completed': '📝',
            'project_submitted': '📤',
            'project_approved': '🎉',
            'project_rejected': '🔄',
            'badge_earned': '🏆',
            'discussion_posted': '💬',
            'discussion_reply': '↩️',
            'course_enrolled': '📚',
            'course_completed': '🎓',
            'streak_milestone': '🔥',
            'points_milestone': '⭐',
        }
        return icon_map.get(activity_type, '📌')
    
    def _get_user_achievements(self, user):
        """Get user's earned badges/achievements"""
        achievements = []
        
        try:
            stats = user.stats
            
            # Badge for first lesson completion
            if Activity.objects.filter(
                user=user, 
                activity_type='lesson_completed'
            ).count() >= 1:
                achievements.append({
                    'icon': '🚀',
                    'name': 'First Steps',
                    'description': 'Completed your first lesson',
                    'earned_at': 'Recently'
                })
            
            # Badge for 5 lessons completed
            lesson_count = Activity.objects.filter(
                user=user, 
                activity_type='lesson_completed'
            ).count()
            
            if lesson_count >= 5:
                achievements.append({
                    'icon': '📚',
                    'name': 'Quick Learner',
                    'description': 'Completed 5 lessons',
                    'earned_at': 'This week'
                })
            
            # Badge for 10 lessons completed
            if lesson_count >= 10:
                achievements.append({
                    'icon': '⭐',
                    'name': 'Knowledge Seeker',
                    'description': 'Completed 10 lessons',
                    'earned_at': 'This month'
                })
            
            # Badge for first project
            if Activity.objects.filter(
                user=user, 
                activity_type__in=['project_submitted', 'project_approved']
            ).count() >= 1:
                achievements.append({
                    'icon': '🎯',
                    'name': 'Project Pioneer',
                    'description': 'Submitted your first project',
                    'earned_at': 'Recently'
                })
            
            # Badge for 7-day streak
            if stats.streak_days >= 7:
                achievements.append({
                    'icon': '🔥',
                    'name': '7 Day Streak',
                    'description': 'Learned for 7 days straight',
                    'earned_at': 'Active'
                })
            
            # Badge for 1000 points
            if stats.total_points >= 1000:
                achievements.append({
                    'icon': '💯',
                    'name': 'Point Master',
                    'description': 'Earned 1000 points',
                    'earned_at': 'This month'
                })
                
        except UserStats.DoesNotExist:
            pass  # User has no stats yet
        
        return achievements
    
    def _get_mentor_feedback(self, user):
        """Get recent mentor feedback on projects"""
        try:
            from community.models import ProjectFeedback
            feedbacks = ProjectFeedback.objects.filter(project__author=user)[:5]
            return [{
                'project_name': f.project.title,
                'feedback_text': f.feedback_text,
                'mentor_name': f.mentor.username,
                'created_at': f.created_at.isoformat(),
                'rating': f.rating
            } for f in feedbacks]
        except ImportError:
            return []
    
    def _get_activity_calendar(self, user):
        """Get activity data for streak calendar visualization"""
        try:
            stats = user.stats
            
            # Get dates when user had activity (last 90 days)
            ninety_days_ago = timezone.now() - timedelta(days=90)
            active_dates = Activity.objects.filter(
                user=user,
                created_at__gte=ninety_days_ago
            ).dates('created_at', 'day')
            
            return {
                'current_streak': stats.streak_days,
                'longest_streak': stats.streak_days,  # You can add a field for this
                'total_active_days': len(active_dates),
                'active_dates': [date.isoformat() for date in active_dates]
            }
        except UserStats.DoesNotExist:
            return {
                'current_streak': 0,
                'longest_streak': 0,
                'total_active_days': 0,
                'active_dates': []
            }
    
    def _get_upcoming_deadlines(self, user):
        """Get upcoming project deadlines based on enrollment date (mock 2 week per week projection)"""
        deadlines = []
        try:
            # Get user's active enrollment
            enrollments = user.enrollments.filter(is_active=True)
            for enr in enrollments:
                # Add mock deadline for currently uncompleted project based on enrollment start date
                start_date = enr.enrolled_at
                current_stage_deadline = start_date + timedelta(days=14)
                
                # Determine urgency
                days_left = (current_stage_deadline.date() - timezone.now().date()).days
                urgency = 'normal'
                if days_left < 3:
                    urgency = 'urgent'
                elif days_left < 7:
                    urgency = 'soon'
                    
                deadlines.append({
                    'title': f'Upcoming Capstone Project',
                    'course': enr.course.title,
                    'due_date': current_stage_deadline.date().isoformat(),
                    'urgency': urgency
                })
        except Exception:
            pass
            
        return deadlines
        
        return deadlines