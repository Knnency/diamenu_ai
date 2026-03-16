#!/usr/bin/env python
"""Check database schema and create SavedRecipe table if needed."""
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection parameters from environment
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'diamenu_db')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')

def check_and_create_savedrecipe_table():
    """Check if SavedRecipe table exists and create it if not."""
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if SavedRecipe table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'accounts_savedrecipe'
                );
            """)
            result = cursor.fetchone()
            table_exists = result['exists'] if result else False
            
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
                
                # Create trigger for updated_at
                cursor.execute("""
                    CREATE OR REPLACE FUNCTION update_updated_at_column()
                    RETURNS TRIGGER AS $$
                    BEGIN
                        NEW.updated_at = CURRENT_TIMESTAMP;
                        RETURN NEW;
                    END;
                    $$ language 'plpgsql';
                    
                    CREATE TRIGGER update_accounts_savedrecipe_updated_at 
                    BEFORE UPDATE ON accounts_savedrecipe 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
                """)
                
                conn.commit()
                print("✅ SavedRecipe table created successfully!")
                return True
            else:
                print("✅ SavedRecipe table already exists.")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = check_and_create_savedrecipe_table()
    sys.exit(0 if success else 1)