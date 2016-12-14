-- +goose Down
-- SQL section 'Down' is executed when this migration is rolled back

DROP INDEX IF EXISTS vcs_tokens_guid;
DROP INDEX IF EXISTS vcs_tokens_name;
DROP INDEX IF EXISTS vcs_tokens_user;
DROP INDEX IF EXISTS vcs_tokens_endpoint;
DROP TABLE IF EXISTS vcs_tokens;

DROP INDEX IF EXISTS vcs_browse;
DROP INDEX IF EXISTS vcs_api;
DROP INDEX IF EXISTS vcs_type;
DROP TABLE IF EXISTS vcs;

-- Restore deprecated VCS tokens table
CREATE TABLE IF NOT EXISTS vcstokens (
  user_guid     VARCHAR(36)   NOT NULL,
  endpoint      VARCHAR(255)  NOT NULL,
  access_token  BYTEA         NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  PRIMARY KEY (user_guid, endpoint)
);

CREATE INDEX vcstokens_user ON vcstokens (user_guid);
CREATE INDEX vcstokens_endpoint ON vcstokens (endpoint);

-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

-- Clean up deprecated VCS tokens table
DROP INDEX IF EXISTS vcstokens_user;
DROP INDEX IF EXISTS vcstokens_endpoint;
DROP TABLE IF EXISTS vcstokens;

-- For storage of VCS endpoints
CREATE TABLE IF NOT EXISTS vcs (
  guid                VARCHAR(36)              PRIMARY KEY,
  label               VARCHAR(255)             NOT NULL,
  type                VARCHAR(36)              NOT NULL,
  browse_url          VARCHAR(255)             NOT NULL,
  api_url             VARCHAR(255)             NOT NULL,
  skip_ssl_validation BOOLEAN                  NOT NULL  DEFAULT FALSE,
  last_updated        TIMESTAMP WITH TIME ZONE NOT NULL  DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- To be honest indexes are overkill here but let's have them for consistency
CREATE INDEX vcs_browse ON vcs (browse_url);
CREATE INDEX vcs_api ON vcs (api_url);
CREATE INDEX vcs_type ON vcs (type);

-- For storage of VCS Personal Access Tokens
CREATE TABLE IF NOT EXISTS vcs_tokens (
  guid       VARCHAR(36)              PRIMARY KEY,
  user_guid  VARCHAR(36)              NOT NULL,
  vcs_guid   VARCHAR(36)              NOT NULL,
  name       VARCHAR(255)             NOT NULL,
  token      BYTEA                    NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL  DEFAULT (NOW() AT TIME ZONE 'utc'),
  UNIQUE (user_guid, vcs_guid, name)
);

-- To be honest indexes are overkill here but let's have them for consistency
CREATE INDEX vcs_tokens_guid ON vcs_tokens (guid);
CREATE INDEX vcs_tokens_name ON vcs_tokens (name);
CREATE INDEX vcs_tokens_user ON vcs_tokens (user_guid);
CREATE INDEX vcs_tokens_endpoint ON vcs_tokens (vcs_guid);
