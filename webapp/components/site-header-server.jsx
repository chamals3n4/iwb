import { asgardeo } from "@asgardeo/nextjs/server";
import { SiteHeader } from "./site-header";

async function getAccessToken() {
  const client = await asgardeo();
  const sessionId = await client.getSessionId();
  return await client.getAccessToken(sessionId);
}

export async function SiteHeaderServer(props) {
  const accessToken = await getAccessToken();
  return <SiteHeader accessToken={accessToken} {...props} />;
}
