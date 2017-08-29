-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied

ALTER TABLE tokens ADD COLUMN disconnected boolean NOT NULL DEFAULT FALSE;