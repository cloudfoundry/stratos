
-- For storage of UAA and CNSI tokens
CREATE TABLE IF NOT EXISTS tokens (
  user_guid     VARCHAR(36) NOT NULL,
  cnsi_guid     VARCHAR(36),
  token_type    VARCHAR(4)  NOT NULL,
  auth_token    BYTEA       NOT NULL,
  refresh_token BYTEA       NOT NULL,
  token_expiry  BIGINT      NOT NULL,
  last_updated  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
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

-- ----------------------------
--  Table structure for "http_sessions"
-- ----------------------------
CREATE TABLE http_sessions (
  id          BIGSERIAL NOT NULL UNIQUE,
	key         TEXT,
	data        TEXT,
	created_on  TIMESTAMP(6) WITH TIME ZONE,
	modified_on TIMESTAMP(6) WITH TIME ZONE,
	expires_on  TIMESTAMP(6) WITH TIME ZONE
)
WITH (OIDS=FALSE);

-- ----------------------------
--  Primary key structure for table "http_sessions"
-- ----------------------------
ALTER TABLE http_sessions ADD CONSTRAINT http_sessions_pkey PRIMARY KEY (id) NOT DEFERRABLE INITIALLY IMMEDIATE;
