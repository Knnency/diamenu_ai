#!/usr/bin/env python
"""Apply Django migrations manually for SavedRecipe model."""
import os
import sys

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(__file__))
sys.path.insert(0, backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'diamenu.settings')

try:
    import django
    django.setup()
    print("✅ Django setup successful")
    
    from django.db import connection
    from django.core.management import execute_from_command_line
    
    # Apply the migration
    print("Applying migration 0004_savedrecipe...")
    execute_from_command_line(['manage.py', 'migrate', 'accounts', '0004'])
    
    print("✅ Migration applied successfully!")
    
except ImportError as e:
    print(f"❌ Django import error: {e}")
    print("This is expected if Django is not installed in the current environment.")
except Exception as e:
    print(f"❌ Error applying migration: {e}")
    import traceback
    traceback.print_exc()