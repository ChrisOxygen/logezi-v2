from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def plan_trip(request):
    data = request.data
    # HOS calculation logic goes here
    return Response({"message": "Trip planned", "data": data})
