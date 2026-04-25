from rest_framework import serializers
from .hos_engine import ALL_STATUSES


class LogEntrySerializer(serializers.Serializer):
    time = serializers.RegexField(
        regex=r'^\d{2}:\d{2}$',
        error_messages={
            'invalid': 'Time must be in HH:MM format (e.g., 06:30).',
        }
    )
    status = serializers.ChoiceField(
        choices=ALL_STATUSES,
        error_messages={
            'invalid_choice': (
                'Invalid duty status. Must be one of: '
                'OFF_DUTY, SLEEPER_BERTH, DRIVING, ON_DUTY.'
            )
        }
    )
    location = serializers.CharField(
        max_length=300,
        error_messages={'blank': 'Location is required for each status change.'}
    )
    remarks = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default='',
    )
    bracket = serializers.BooleanField(
        default=False,
    )

    def validate_time(self, value):
        parts = value.split(':')
        hour, minute = int(parts[0]), int(parts[1])
        if not (0 <= hour <= 23):
            raise serializers.ValidationError('Hour must be between 00 and 23.')
        if minute not in [0, 15, 30, 45]:
            raise serializers.ValidationError(
                'Minutes must be 00, 15, 30, or 45 (15-minute increments only).'
            )
        return value


class ValidateEntrySerializer(serializers.Serializer):
    entries_so_far = LogEntrySerializer(many=True, default=[])
    new_entry = LogEntrySerializer()
    cycle_hours_used = serializers.FloatField(
        min_value=0,
        max_value=70,
        error_messages={
            'min_value': 'Cycle hours used cannot be negative.',
            'max_value': 'Cycle hours used cannot exceed 70 (the maximum cycle limit).',
        }
    )
    total_miles_today = serializers.FloatField(
        min_value=0,
        default=0,
    )


class CalculateTotalsSerializer(serializers.Serializer):
    entries = LogEntrySerializer(many=True)

    def validate_entries(self, entries):
        if not entries:
            raise serializers.ValidationError('At least one log entry is required.')
        return entries
