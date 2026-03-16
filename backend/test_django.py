# Simple test to check if Django is available
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'diamenu.settings')

try:
    import django
    django.setup()
    print("Django setup successful")
    
    # Try to import our model
    from apps.accounts.models import SavedRecipe
    print("SavedRecipe model imported successfully")
    
    # Check if table exists
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'accounts_savedrecipe'
            );
        """)
        result = cursor.fetchone()
        table_exists = result[0] if result else False
        
        if table_exists:
            print("SavedRecipe table already exists")
        else:
            print("SavedRecipe table does not exist - needs to be created")
            
except ImportError as e:
    print(f"Import error (expected): {e}")
except Exception as e:
    print(f"Other error: {e}")
    import traceback
    traceback.print_exc()