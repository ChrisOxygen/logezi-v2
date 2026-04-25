from rest_framework import serializers
from trips.serializers import LogEntrySerializer


class PostTripSerializer(serializers.Serializer):
    defects = serializers.CharField(
        max_length=500,
        required=False,
        default='none',
    )


class DayLogSerializer(serializers.Serializer):
    date = serializers.DateField(
        error_messages={'invalid': 'Date must be in YYYY-MM-DD format.'}
    )
    driver_name = serializers.CharField(max_length=200)
    driver_number = serializers.CharField(max_length=50, required=False, default='')
    co_driver = serializers.CharField(max_length=200, required=False, default='N/A')
    home_terminal = serializers.CharField(max_length=300, required=False, default='')
    tractor = serializers.CharField(max_length=100)
    trailer = serializers.CharField(max_length=100)
    shipper = serializers.CharField(max_length=300, required=False, default='')
    commodity = serializers.CharField(max_length=300, required=False, default='')
    load_number = serializers.CharField(max_length=200, required=False, default='')
    total_miles = serializers.FloatField(min_value=0, default=0)
    entries = LogEntrySerializer(many=True)
    post_trip = PostTripSerializer(required=False, default={'defects': 'none'})

    def validate_entries(self, entries):
        if not entries:
            raise serializers.ValidationError(
                'At least one log entry is required per day.'
            )
        return entries


class GenerateLogSerializer(serializers.Serializer):
    days = DayLogSerializer(many=True)

    def validate_days(self, days):
        if not days:
            raise serializers.ValidationError('At least one day of logs is required.')
        if len(days) > 14:
            raise serializers.ValidationError(
                'Maximum 14 days per trip. Split into multiple submissions if needed.'
            )
        return days
