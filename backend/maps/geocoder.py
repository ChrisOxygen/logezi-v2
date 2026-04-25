import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError, APIException


def geocode_address(address: str) -> dict:
    if not address or not address.strip():
        raise ValidationError({'address': 'Address cannot be empty.'})

    params = {
        'q': address.strip(),
        'format': 'json',
        'limit': 1,
        'addressdetails': 1,
        'countrycodes': 'us',
    }

    headers = {
        'User-Agent': settings.NOMINATIM_USER_AGENT,
    }

    try:
        response = requests.get(
            f'{settings.NOMINATIM_BASE_URL}/search',
            params=params,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise APIException(
            detail='Geocoding service timed out. Please try again.',
            code='geocoding_timeout',
        )
    except requests.exceptions.ConnectionError:
        raise APIException(
            detail='Could not reach geocoding service. Check your internet connection.',
            code='geocoding_connection_error',
        )
    except requests.exceptions.HTTPError as e:
        raise APIException(
            detail=f'Geocoding service returned an error: {str(e)}',
            code='geocoding_http_error',
        )

    data = response.json()

    if not data:
        raise ValidationError({
            'address': f'Location "{address}" could not be found. Please be more specific.'
        })

    result = data[0]
    return {
        'lat': float(result['lat']),
        'lng': float(result['lon']),
        'display_name': result.get('display_name', address),
        'city': result.get('address', {}).get('city') or result.get('address', {}).get('town', ''),
        'state': result.get('address', {}).get('state', ''),
    }
