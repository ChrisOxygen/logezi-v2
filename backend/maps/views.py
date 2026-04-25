from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import GeocodeRequestSerializer, RouteRequestSerializer
from .geocoder import geocode_address
from .router import get_route


class GeocodeView(APIView):
    def post(self, request):
        serializer = GeocodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = geocode_address(serializer.validated_data['address'])

        return Response({
            'success': True,
            'data': result,
        }, status=status.HTTP_200_OK)


class RouteView(APIView):
    def post(self, request):
        serializer = RouteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        current = geocode_address(data['current_location'])
        pickup = geocode_address(data['pickup'])
        destination = geocode_address(data['destination'])

        route = get_route([current, pickup, destination])

        return Response({
            'success': True,
            'data': {
                'locations': {
                    'current': current,
                    'pickup': pickup,
                    'destination': destination,
                },
                'route': route,
            },
        }, status=status.HTTP_200_OK)
