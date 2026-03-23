from rest_framework_simplejwt.tokens import Token
from datetime import timedelta

class MFAToken(Token):
    token_type = 'mfa'
    lifetime = timedelta(minutes=5)

    @classmethod
    def for_user(cls, user):
        token = cls()
        token['user_id'] = user.id
        return token

class PasswordResetToken(Token):
    token_type = 'password_reset'
    lifetime = timedelta(minutes=10)

    @classmethod
    def for_user(cls, user):
        token = cls()
        token['user_id'] = user.id
        return token
