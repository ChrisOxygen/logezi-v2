import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError, APIException

METERS_TO_MILES = 0.000621371
SECONDS_TO_HOURS = 1 / 3600


def get_route(waypoints: list) -> dict:
    if len(waypoints) < 2:
        raise ValidationError({'waypoints': 'At least 2 waypoints are required.'})

    # OSRM expects coordinates as lng,lat
    coords = ';'.join(
        f"{point['lng']},{point['lat']}" for point in waypoints
    )

    try:
        response = requests.get(
            f'{settings.OSRM_BASE_URL}/route/v1/driving/{coords}',
            params={
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'false',
                'annotations': 'false',
            },
            timeout=15,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise APIException(
            detail='Routing service timed out. Please try again.',
            code='routing_timeout',
        )
    except requests.exceptions.ConnectionError:
        raise APIException(
            detail='Could not reach routing service. Check your internet connection.',
            code='routing_connection_error',
        )
    except requests.exceptions.HTTPError as e:
        raise APIException(
            detail=f'Routing service returned an error: {str(e)}',
            code='routing_http_error',
        )

    data = response.json()

    if data.get('code') != 'Ok':
        raise APIException(
            detail=f"Routing failed: {data.get('message', 'Unknown OSRM error')}",
            code='routing_failed',
        )

    route = data['routes'][0]
    legs = route.get('legs', [])

    return {
        'total_miles': round(route['distance'] * METERS_TO_MILES, 2),
        'total_duration_hrs': round(route['duration'] * SECONDS_TO_HOURS, 2),
        'geometry': route['geometry'],  # GeoJSON LineString for map rendering
        'legs': [
            {
                'miles': round(leg['distance'] * METERS_TO_MILES, 2),
                'duration_hrs': round(leg['duration'] * SECONDS_TO_HOURS, 2),
            }
            for leg in legs
        ],
    }
