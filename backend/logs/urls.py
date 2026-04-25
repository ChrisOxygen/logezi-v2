from django.urls import path
from .views import GenerateLogView

urlpatterns = [
    path('generate/', GenerateLogView.as_view(), name='generate-log'),
]
