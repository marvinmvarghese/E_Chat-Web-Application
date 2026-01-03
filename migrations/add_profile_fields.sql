"""
Add profile fields to users table

This migration adds the new profile columns that were added to the User model.
Run this in Render Shell or via psql.
"""

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS about VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR DEFAULT 'light';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
