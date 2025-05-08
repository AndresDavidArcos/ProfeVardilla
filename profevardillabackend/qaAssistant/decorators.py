from functools import wraps
from firebase_admin import auth
from rest_framework.response import Response
from rest_framework import status
from django_ratelimit.decorators import ratelimit

def firebase_auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response({'error': 'Token no proporcionado'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split('Bearer ')[1]
        print("token received: ", token)
        try:
            decoded_token = auth.verify_id_token(token)
            request.firebase_user = decoded_token
            return view_func(request, *args, **kwargs)
        except auth.ExpiredIdTokenError:
            return Response({'error': 'Token expirado'}, status=status.HTTP_401_UNAUTHORIZED)
        except auth.InvalidIdTokenError:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper

def firebase_rate_limit(rate='10/m'):
    return ratelimit(
        key=lambda req: f"fb_{req.firebase_user['uid']}",
        rate=rate,
        block=True
    )