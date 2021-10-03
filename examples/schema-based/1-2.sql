CREATE SCHEMA IF NOT EXISTS "my_website";

SET search_path TO "my_website", "public";

CREATE TABLE IF NOT EXISTS my_website.users (
  "username" varchar(32) NOT NULL,
  "password" varchar(64) NOT NULL
);