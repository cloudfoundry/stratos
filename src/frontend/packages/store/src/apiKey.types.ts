export interface ApiKey {
  comment: string;
  guid: string;
  last_used: string;
  /** When the key stops working (RFC 3339), or null for Never. */
  expires_at: string | null;
  /** The key's last use was refused because it had expired. */
  last_used_refused: boolean;
  secret: string;
  user_guid: string;
}
