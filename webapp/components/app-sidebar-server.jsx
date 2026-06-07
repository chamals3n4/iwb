import { asgardeo } from "@asgardeo/nextjs/server";
import { AppSidebar } from "./app-sidebar";

async function getAccessToken() {
  const client = await asgardeo();
  const sessionId = await client.getSessionId();
  return await client.getAccessToken(sessionId);
}

export async function AppSidebarServer(props) {
  const accessToken = await getAccessToken();
  return <AppSidebar accessToken={accessToken} {...props} />;
}
