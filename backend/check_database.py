#!/usr/bin/env python
"""Check if SavedRecipe table exists in the database."""
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
    
    # Check if SavedRecipe table exists
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
            print("✅ SavedRecipe table exists in the database!")
            
            # Check table structure
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'accounts_savedrecipe'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("\nTable structure:")
            for col in columns:
                print(f"  {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                
            # Check if there are any existing records
            cursor.execute("SELECT COUNT(*) FROM accounts_savedrecipe;")
            count = cursor.fetchone()[0]
            print(f"\n📊 Current record count: {count}")
            
        else:
            print("❌ SavedRecipe table does not exist in the database.")
            print("The migration may need to be applied manually.")
    
except ImportError as e:
    print(f"❌ Django import error: {e}")
    print("This is expected if Django is not installed in the current environment.")
except Exception as e:
    print(f"❌ Error checking database: {e}")
    import traceback
    traceback.print_exc()