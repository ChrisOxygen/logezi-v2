from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse

from .serializers import GenerateLogSerializer
from .pdf_generator import generate_log_pdf
from trips.hos_engine import calculate_totals


class GenerateLogView(APIView):
    def post(self, request):
        serializer = GenerateLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        days = serializer.validated_data['days']

        totals_per_day = [calculate_totals(day['entries']) for day in days]

        days_data = []
        for day in days:
            day_copy = dict(day)
            day_copy['date'] = str(day['date'])
            day_copy['entries'] = list(day['entries'])
            days_data.append(day_copy)

        try:
            pdf_bytes = generate_log_pdf(days_data, totals_per_day)
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'pdf_generation_failed',
                    'message': f'Failed to generate PDF: {str(e)}',
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="driver_log.pdf"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response
