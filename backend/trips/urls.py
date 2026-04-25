from django.urls import path
from .views import ValidateEntryView, CalculateTotalsView

urlpatterns = [
    path('validate-entry/', ValidateEntryView.as_view(), name='validate-entry'),
    path('calculate-totals/', CalculateTotalsView.as_view(), name='calculate-totals'),
]
