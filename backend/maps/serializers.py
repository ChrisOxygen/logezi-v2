from rest_framework import serializers


class GeocodeRequestSerializer(serializers.Serializer):
    address = serializers.CharField(
        max_length=500,
        error_messages={
            'blank': 'Address cannot be blank.',
            'max_length': 'Address is too long. Maximum 500 characters.',
        }
    )


class WaypointSerializer(serializers.Serializer):
    lat = serializers.FloatField(
        min_value=-90,
        max_value=90,
        error_messages={
            'min_value': 'Latitude must be between -90 and 90.',
            'max_value': 'Latitude must be between -90 and 90.',
        }
    )
    lng = serializers.FloatField(
        min_value=-180,
        max_value=180,
        error_messages={
            'min_value': 'Longitude must be between -180 and 180.',
            'max_value': 'Longitude must be between -180 and 180.',
        }
    )


class RouteRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=500)
    pickup = serializers.CharField(max_length=500)
    destination = serializers.CharField(max_length=500)
