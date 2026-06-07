"use client";

import { useState, useEffect } from "react";
import {
  IconBriefcase,
  IconBuildingBank,
  IconDeviceIpadPin,
  IconMapSearch,
  IconNavigationShare,
  IconSmartHome,
} from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import LocationSelector from "./location-selector";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAsgardeo } from "@asgardeo/nextjs";
import ModeToggle from "@/components/mode-toggle";

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const data = {
  navMain: [
    { title: "Home", url: "/workspace", icon: IconSmartHome },
    {
      title: "City Rank",
      url: "/workspace/city-rank",
      icon: IconNavigationShare,
    },
    { title: "Incident Map", url: "/workspace/map", icon: IconMapSearch },
    { title: "Meetups", url: "/workspace/meetups", icon: IconDeviceIpadPin },
    { title: "Remote Jobs", url: "/workspace/jobs", icon: IconBriefcase },
    { title: "Places", url: "/workspace/places", icon: IconBuildingBank },
  ],
};

export function AppSidebar({ accessToken, ...props }) {
  const { signOut } = useAsgardeo();
  const [userLocation, setUserLocation] = useState(null);

  const claims = accessToken ? decodeJWT(accessToken) : null;

  const userData = {
    name:
      claims?.given_name && claims?.family_name
        ? `${claims.given_name} ${claims.family_name}`
        : (claims?.given_name ??
          claims?.email ??
          claims?.username ??
          "Guest User"),
    email: claims?.email ?? claims?.username ?? "",
    avatar: claims?.profile ?? "/avatars/shadcn.jpg",
    sub: claims?.sub,
  };

  useEffect(() => {
    if (claims?.sub) {
      fetch(`/api/users/${claims.sub}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.cityName) {
            setUserLocation({
              cityName: data.data.cityName,
              latitude: data.data.cityLatitude,
              longitude: data.data.cityLongitude,
            });
          }
        })
        .catch((err) => console.error("Location fetch error:", err));
    }
  }, [claims?.sub]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 mb-3"
            >
              <a href="#">
                <span className="text-2xl font-semibold">Nomad Page</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <LocationSelector
        currentLocation={userLocation}
        onLocationSet={setUserLocation}
      />

      <SidebarFooter>
        <div className="flex items-center justify-between w-full gap-2 px-2">
          <NavUser user={userData} />
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
