-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

-- For storage of setup data
CREATE TABLE IF NOT EXISTS console_config (
  uaa_endpoint              VARCHAR(255)              NOT NULL,
  console_admin_role        VARCHAR(255)              NOT NULL,
  console_client            VARCHAR(255)              NOT NULL,
  console_client_secret     VARCHAR(255)              NOT NULL,
  skip_ssl_validation       BOOLEAN                   NOT NULL DEFAULT FALSE,
  last_updated              TIMESTAMP WITH TIME ZONE  NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- This prevents another row being inserted
CREATE UNIQUE INDEX console_config_one_row
  ON console_config((uaa_endpoint IS NOT NULL));