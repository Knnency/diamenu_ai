-- SQL script to create SavedRecipe table
-- This can be run directly in PostgreSQL

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'accounts_savedrecipe'
    ) THEN
        -- Create the SavedRecipe table
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

        -- Create indexes
        CREATE INDEX accounts_savedrecipe_user_id_idx ON accounts_savedrecipe(user_id);
        CREATE UNIQUE INDEX accounts_savedrecipe_user_title_unique ON accounts_savedrecipe(user_id, title);

        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER update_accounts_savedrecipe_updated_at 
        BEFORE UPDATE ON accounts_savedrecipe 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'SavedRecipe table created successfully!';
    ELSE
        RAISE NOTICE 'SavedRecipe table already exists.';
    END IF;
END $$;