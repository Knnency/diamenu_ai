#!/usr/bin/env python
"""Check database connection and create SavedRecipe table using Django ORM."""
import os
import sys

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(__file__))
sys.path.insert(0, backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'diamenu.settings')

# Try to import Django and set it up
try:
    import django
    django.setup()
    print("✅ Django setup successful")
    
    from django.db import connection
    from apps.accounts.models import SavedRecipe
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Check if we can connect to the database
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"✅ Database connection successful: {result}")
    
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
        
        if not table_exists:
            print("Creating SavedRecipe table...")
            cursor.execute("""
                CREATE TABLE accounts_savedrecipe (
                    id BIGSERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL,
                    tags JSONB DEFAULT '[]'::jsonb,
                    ingredients JSONB DEFAULT '[]'::jsonb,
                    preparation JSONB DEFAULT '[]'::jsonb,
                    instructions JSONB DEFAULT '[]'::jsonb,
                    servings VARCHAR(50) DEFAULT '2 people',
                    country VARCHAR(100) DEFAULT 'Philippines',
                    dietary_options JSONB DEFAULT '[]'::jsonb,
                    allergies JSONB DEFAULT '[]'::jsonb,
                    ingredients_to_avoid JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE
                );
                
                CREATE INDEX accounts_savedrecipe_user_id_idx ON accounts_savedrecipe(user_id);
                CREATE UNIQUE INDEX accounts_savedrecipe_user_title_unique ON accounts_savedrecipe(user_id, title);
            """)
            print("✅ SavedRecipe table created successfully!")
        else:
            print("✅ SavedRecipe table already exists.")
    
    # Test the model
    print("Testing SavedRecipe model...")
    try:
        # This will fail if the table doesn't exist, but we just created it
        count = SavedRecipe.objects.count()
        print(f"✅ SavedRecipe model accessible. Current count: {count}")
    except Exception as e:
        print(f"⚠️  Could not access SavedRecipe model: {e}")
    
    print("✅ Database setup completed successfully!")
    
except ImportError as e:
    print(f"❌ Django import error: {e}")
    print("This is expected if Django is not installed in the current environment.")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()