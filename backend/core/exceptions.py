from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError,
    MethodNotAllowed,
    APIException,
    ParseError,
    UnsupportedMediaType,
)
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'success': False,
            'error': {},
        }

        if isinstance(exc, ValidationError):
            error_payload['error'] = {
                'code': 'validation_error',
                'message': 'One or more fields failed validation.',
                'fields': _flatten_errors(response.data),
            }
            response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

        elif isinstance(exc, ParseError):
            error_payload['error'] = {
                'code': 'parse_error',
                'message': 'Request body is malformed or not valid JSON.',
            }

        elif isinstance(exc, MethodNotAllowed):
            error_payload['error'] = {
                'code': 'method_not_allowed',
                'message': 'HTTP method not allowed on this endpoint.',
            }

        elif isinstance(exc, UnsupportedMediaType):
            error_payload['error'] = {
                'code': 'unsupported_media_type',
                'message': 'Content-Type must be application/json.',
            }

        elif isinstance(exc, APIException):
            error_payload['error'] = {
                'code': getattr(exc, 'default_code', 'api_error'),
                'message': str(exc.detail),
            }

        else:
            error_payload['error'] = {
                'code': 'error',
                'message': str(response.data.get('detail', 'An error occurred.')),
            }

        response.data = error_payload

    else:
        logger.exception('Unhandled exception in view: %s', str(exc))
        response = Response(
            {
                'success': False,
                'error': {
                    'code': 'server_error',
                    'message': 'An unexpected server error occurred. Please try again.',
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _flatten_errors(data, prefix='') -> dict:
    result = {}
    if isinstance(data, dict):
        for key, value in data.items():
            full_key = f'{prefix}.{key}' if prefix else key
            result.update(_flatten_errors(value, full_key))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            full_key = f'{prefix}.{i}' if prefix else str(i)
            if isinstance(item, (dict, list)):
                result.update(_flatten_errors(item, full_key))
            else:
                result[prefix] = str(item)
    else:
        result[prefix] = str(data)
    return result
