from django.urls import path, include

urlpatterns = [
    path('api/v1/maps/', include('maps.urls')),
    path('api/v1/trips/', include('trips.urls')),
    path('api/v1/logs/', include('logs.urls')),
]
