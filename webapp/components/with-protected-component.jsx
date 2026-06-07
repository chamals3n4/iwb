import { SignedIn, SignedOut } from "@asgardeo/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const withProtectedRoute = (WrappedComponent) => {
  const ComponentWithAuth = (props) => {
    const router = useRouter();

    return (
      <>
        <SignedOut>
          <RedirectToHome router={router} />
        </SignedOut>

        <SignedIn>
          <WrappedComponent {...props} />
        </SignedIn>
      </>
    );
  };

  return ComponentWithAuth;
};

function RedirectToHome({ router }) {
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-black">Loading workspace...</p>
      </div>
    </div>
  );
}
