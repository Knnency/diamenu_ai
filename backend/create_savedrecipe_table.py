#!/usr/bin/env python
"""Manual migration script for SavedRecipe model."""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'diamenu.settings')
django.setup()

from django.db import connection
from apps.accounts.models import SavedRecipe
from django.contrib.auth import get_user_model

User = get_user_model()

def create_savedrecipe_table():
    """Create the SavedRecipe table manually if it doesn't exist."""
    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'accounts_savedrecipe'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
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
            print("SavedRecipe table created successfully!")
        else:
            print("SavedRecipe table already exists.")

if __name__ == "__main__":
    create_savedrecipe_table()