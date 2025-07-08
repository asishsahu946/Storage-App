import { OAuth2Client } from "google-auth-library";
import 'dotenv/config'

const clientId = process.env.OAUTH_CLIENT_ID

const client = new OAuth2Client({
  clientId,
});

export async function verifyIdToken(idToken) {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience: clientId
  })
  const userData = loginTicket.getPayload()
  return userData
}
