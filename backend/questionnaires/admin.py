# questionnaires/admin.py
from django.contrib import admin
from .models import (
   Questionnaire, Question, AnswerOption, UserAnswer, QuestionnaireCompletion,
   HabitQuestion, HabitOption, UserHabitAnswer
)

# Para mostrar opciones dentro de la pregunta
class AnswerOptionInline(admin.TabularInline):
   model = AnswerOption
   extra = 1 # Cuántos formularios de opción vacíos mostrar para añadir nuevos

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
   list_display = ('text', 'questionnaire', 'order')
   list_filter = ('questionnaire',)
   search_fields = ('text',)
   inlines = [AnswerOptionInline] # Añade las opciones aquí

# Para mostrar preguntas (y sus opciones) dentro del cuestionario
class QuestionInline(admin.StackedInline): # O admin.TabularInline si prefieres formato tabla
   model = Question
   extra = 1 # Cuántos formularios de pregunta vacíos mostrar
   show_change_link = True # Permite ir a la página de edición de la pregunta
   # Si usas StackedInline, puedes definir fieldsets para organizar mejor la pregunta
   # fieldsets = ( (None, { 'fields': ('text', 'order') }), )

@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
   list_display = ('title', 'name', 'type', 'created_at')
   list_filter = ('type',)
   search_fields = ('title', 'name')
   inlines = [QuestionInline] # Añade las preguntas aquí

# Registra los modelos restantes de forma sencilla (puedes personalizarlos más si quieres)
@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
   list_display = ('user', 'question', 'selected_option', 'answered_at')
   list_filter = ('user', 'question__questionnaire')
   search_fields = ('user__username', 'question__text')
   # Hacer campos de solo lectura porque no deberían editarse manualmente
   readonly_fields = ('user', 'question', 'selected_option', 'answered_at')

@admin.register(QuestionnaireCompletion)
class QuestionnaireCompletionAdmin(admin.ModelAdmin):
   list_display = ('user', 'questionnaire', 'score', 'completed_at', 'is_onboarding')
   list_filter = ('user', 'questionnaire', 'is_onboarding')
   search_fields = ('user__username', 'questionnaire__title')
   readonly_fields = ('user', 'questionnaire', 'score', 'completed_at', 'is_onboarding')

# ADMINS PARA HÁBITOS
class HabitOptionInline(admin.TabularInline):
   model = HabitOption
   extra = 1
   fields = ('text', 'value', 'order')

@admin.register(HabitQuestion)
class HabitQuestionAdmin(admin.ModelAdmin):
   list_display = ('id', 'habit_type', 'text', 'created_at')
   list_filter = ('habit_type',)
   search_fields = ('text', 'habit_type')
   fields = ('habit_type', 'text', 'description')
   inlines = [HabitOptionInline]

@admin.register(HabitOption)
class HabitOptionAdmin(admin.ModelAdmin):
   list_display = ('text', 'question', 'value', 'order')
   list_filter = ('question__habit_type',)
   search_fields = ('text', 'question__text')

@admin.register(UserHabitAnswer)
class UserHabitAnswerAdmin(admin.ModelAdmin):
   list_display = ('user', 'question', 'selected_option', 'answered_at', 'is_onboarding')
   list_filter = ('question__habit_type', 'is_onboarding')
   search_fields = ('user__username', 'question__text')
   readonly_fields = ('answered_at',)

# No registramos AnswerOption directamente porque lo manejamos via QuestionAdmin
# admin.site.register(AnswerOption) # Descomentar si quieres gestionarlo aparte