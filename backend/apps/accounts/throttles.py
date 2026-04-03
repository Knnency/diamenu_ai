from rest_framework.throttling import AnonRateThrottle

class OTPSendThrottle(AnonRateThrottle):
    scope = 'otp_send'

class OTPVerifyThrottle(AnonRateThrottle):
    scope = 'otp_verify'
