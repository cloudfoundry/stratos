-- +goose Down
-- SQL section 'Down' is executed when this migration is rolled back

DROP  INDEX IF EXISTS tokens_token_type;
DROP  INDEX IF EXISTS tokens_cnsi_guid;
DROP  INDEX IF EXISTS tokens_user_guid;
DROP  TABLE IF EXISTS tokens;

DROP  INDEX IF EXISTS cnsis_cnsi_type;
DROP  INDEX IF EXISTS cnsis_name;
DROP  TABLE IF EXISTS cnsis;


-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

-- For storage of UAA and CNSI tokens
CREATE TABLE IF NOT EXISTS tokens (
  user_guid     VARCHAR(36) NOT NULL,
  cnsi_guid     VARCHAR(36),
  token_type    VARCHAR(4)  NOT NULL,
  auth_token    TEXT        NOT NULL,
  refresh_token TEXT        NOT NULL,
  token_expiry  BIGINT      NOT NULL,
  last_updated  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  CONSTRAINT tokens_user_guid_cnsi_guid_key UNIQUE (user_guid, cnsi_guid) NOT DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT tokens_user_guid_token_type_key UNIQUE (user_guid, token_type) NOT DEFERRABLE INITIALLY IMMEDIATE
)
WITH (OIDS=FALSE);

CREATE INDEX tokens_user_guid ON tokens (user_guid);
CREATE INDEX tokens_cnsi_guid ON tokens (cnsi_guid);
CREATE INDEX tokens_token_type ON tokens (token_type);

-- For storage of CNSI records
CREATE TABLE IF NOT EXISTS cnsis (
  guid                      VARCHAR(36)   NOT NULL UNIQUE,
  name                      VARCHAR(255)  NOT NULL,
  cnsi_type                 VARCHAR(3)    NOT NULL,
  api_endpoint              VARCHAR(255)  NOT NULL,
  auth_endpoint             VARCHAR(255)  NOT NULL,
  token_endpoint            VARCHAR(255)  NOT NULL,
  doppler_logging_endpoint  VARCHAR(255)  NOT NULL,
  last_updated    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  PRIMARY KEY (guid)
);

CREATE INDEX cnsis_name ON cnsis (name);
CREATE INDEX cnsis_cnsi_type ON cnsis (cnsi_type);
