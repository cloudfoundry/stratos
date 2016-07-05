
-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

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




-- +goose Down
-- SQL section 'Down' is executed when this migration is rolled back

DROP TABLE IF EXISTS http_sessions;
