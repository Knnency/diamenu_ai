import os
import django
from django.conf import settings
from django.core.mail import send_mail
from dotenv import load_dotenv

# Load .env from the root directory
load_dotenv('../.env')

# Minimal Django setup to run the test
if not settings.configured:
    settings.configure(
        DEBUG=False,
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
        EMAIL_HOST='smtp.resend.com',
        EMAIL_PORT=587,
        EMAIL_USE_TLS=True,
        EMAIL_HOST_USER='resend',
        EMAIL_HOST_PASSWORD=os.environ.get('RESEND_API_KEY', ''),
        DEFAULT_FROM_EMAIL=os.environ.get('DEFAULT_FROM_EMAIL', 'DiaMenu <noreply@diamenu.online>'),
    )
    django.setup()

def test_production_email():
    recipient = input("Enter recipient email for test: ")
    print(f"Sending test email to {recipient} via Resend SMTP...")
    
    try:
        send_mail(
            subject='DiaMenu Production Email Test',
            message='This is a test email from the DiaMenu production configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

if __name__ == "__main__":
    if not os.environ.get('RESEND_API_KEY'):
        print("⚠️  Warning: RESEND_API_KEY environment variable is not set.")
    test_production_email()
