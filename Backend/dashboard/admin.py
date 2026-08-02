from django.contrib import admin
from .models import SkillWeek, SkillTopic, TopicCompletion


@admin.register(SkillWeek)
class SkillWeekAdmin(admin.ModelAdmin):
    list_display = ['number', 'title', 'topic_count']
    search_fields = ['title', 'description']
    
    def topic_count(self, obj):
        return obj.topics.count()
    topic_count.short_description = 'Topics'


@admin.register(SkillTopic)
class SkillTopicAdmin(admin.ModelAdmin):
    list_display = ['title', 'week', 'order', 'duration', 'is_published', 'completion_count']
    list_filter = ['week', 'is_published', 'content_type']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['week__number', 'order']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('week', 'title', 'slug', 'description', 'duration', 'order')
        }),
        ('Content', {
            'fields': ('content_type', 'content', 'sections', 'key_points')
        }),
        ('Settings', {
            'fields': ('is_published',)
        }),
    )
    
    def completion_count(self, obj):
        return obj.completed_by.count()
    completion_count.short_description = 'Completions'


@admin.register(TopicCompletion)
class TopicCompletionAdmin(admin.ModelAdmin):
    list_display = ['user', 'topic', 'progress_percentage', 'completed_at']
    list_filter = ['completed_at', 'progress_percentage']
    search_fields = ['user__username', 'topic__title']
    date_hierarchy = 'completed_at'