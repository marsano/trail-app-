/**
 * Jetons OAuth Garmin (même forme que garmin-connect / exportToken).
 * Stockés localement après la 1re connexion pour éviter de redemander le mot de passe.
 */
export interface GarminOAuth1 {
  oauth_token: string
  oauth_token_secret: string
}

export interface GarminOAuth2 {
  scope: string
  jti: string
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  refresh_token_expires_in: number
  expires_at: number
  refresh_token_expires_at: number
  last_update_date: string
  expires_date: string
}

export interface GarminTokensPayload {
  oauth1: GarminOAuth1
  oauth2: GarminOAuth2
}
