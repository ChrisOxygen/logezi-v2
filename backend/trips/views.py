from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ValidateEntrySerializer, CalculateTotalsSerializer
from .hos_engine import validate_entry, calculate_totals


class ValidateEntryView(APIView):
    def post(self, request):
        serializer = ValidateEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        result = validate_entry(
            entries_so_far=data['entries_so_far'],
            new_entry=data['new_entry'],
            cycle_hours_used=data['cycle_hours_used'],
            total_miles_today=data['total_miles_today'],
        )

        return Response({
            'success': True,
            'data': result,
        }, status=status.HTTP_200_OK)


class CalculateTotalsView(APIView):
    def post(self, request):
        serializer = CalculateTotalsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = calculate_totals(serializer.validated_data['entries'])

        return Response({
            'success': True,
            'data': result,
        }, status=status.HTTP_200_OK)
