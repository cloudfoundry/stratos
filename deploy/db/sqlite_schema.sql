-- For storage of UAA and CNSI tokens
CREATE TABLE IF NOT EXISTS tokens (
  user_guid     VARCHAR(36) NOT NULL,
  cnsi_guid     VARCHAR(36),
  token_type    VARCHAR(4)  NOT NULL,
  auth_token    BYTEA       NOT NULL,
  refresh_token BYTEA       NOT NULL,
  token_expiry  BIGINT      NOT NULL,
  last_updated  TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For storage of CNSI records
CREATE TABLE IF NOT EXISTS cnsis (
  guid                      VARCHAR(36)   NOT NULL PRIMARY KEY,
  name                      VARCHAR(255)  NOT NULL,
  cnsi_type                 VARCHAR(3)    NOT NULL,
  api_endpoint              VARCHAR(255)  NOT NULL,
  auth_endpoint             VARCHAR(255)  NOT NULL,
  token_endpoint            VARCHAR(255)  NOT NULL,
  doppler_logging_endpoint  VARCHAR(255)  NOT NULL,
  skip_ssl_validation       BOOLEAN       NOT NULL DEFAULT FALSE,
  last_updated              TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For storage of VCS Tokens
CREATE TABLE IF NOT EXISTS vcstokens (
  user_guid   VARCHAR(36)   NOT NULL,
  endpoint    VARCHAR(255)  NOT NULL,
  access_token  BYTEA         NOT NULL,
  created_at              TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP
--  PRIMARY KEY (user_guid, endpoint)
);

-- For storage of VCS endpoints
CREATE TABLE IF NOT EXISTS vcs (
  guid                VARCHAR(36)              PRIMARY KEY,
  label               VARCHAR(255)             NOT NULL,
  type                VARCHAR(36)              NOT NULL,
  browse_url          VARCHAR(255)             NOT NULL,
  api_url             VARCHAR(255)             NOT NULL,
  skip_ssl_validation BOOLEAN                  NOT NULL  DEFAULT FALSE,
  last_updated        TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For storage of VCS Personal Access Tokens
CREATE TABLE IF NOT EXISTS vcs_tokens (
  guid       VARCHAR(36)              PRIMARY KEY,
  user_guid  VARCHAR(36)              NOT NULL,
  vcs_guid   VARCHAR(36)              NOT NULL REFERENCES vcs ON DELETE CASCADE,
  name       VARCHAR(255)             NOT NULL,
  token      BYTEA                    NOT NULL,
  created_at  TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP
--  UNIQUE (user_guid, vcs_guid, name)
);

-- Database version
CREATE TABLE IF NOT EXISTS goose_db_version (
  version_id    INT                      NOT NULL,
  is_applied    VARCHAR(1)               NOT NULL DEFAULT "t",
  id            VARCHAR(255)             NOT NULL
);

INSERT INTO goose_db_version (version_id, is_applied, id) VALUES(1, "t", "SQLite 1.0");

-- console_config
CREATE TABLE IF NOT EXISTS console_config (
  uaa_endpoint              VARCHAR(255)              NOT NULL,
  console_admin_scope       VARCHAR(255)              NOT NULL,
  console_client            VARCHAR(255)              NOT NULL,
  console_client_secret     VARCHAR(255)              NOT NULL,
  skip_ssl_validation       BOOLEAN                   NOT NULL DEFAULT FALSE,
  is_setup_complete         BOOLEAN                   NOT NULL DEFAULT FALSE
--  last_updated              DATETIME                  DEFAULT CURRENT_TIMESTAMP
);

-- create trigger
CREATE TRIGGER IF NOT EXISTS config_no_insert BEFORE INSERT ON console_config WHEN (SELECT COUNT(*) FROM console_config) >= 1 BEGIN SELECT RAISE(FAIL, "only one row!"); END;