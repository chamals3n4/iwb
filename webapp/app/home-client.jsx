"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@asgardeo/nextjs";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HomeClient() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-12 py-6">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* left */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-4xl lg:text-5xl font-serif text-foreground leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Work from Paradise, Explore the{" "}
              <span className="italic">Pearl of the Indian Ocean</span>
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-lg leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Your all-in-one digital nomad hub for Sri Lanka. Accommodation,
              remote work, community, and financial planning—simplified.
            </motion.p>

            {/* auth btns */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>

              <SignedIn>
                <Button
                  onClick={() => (window.location.href = "/workspace")}
                  className="font-medium px-6 py-5 text-md rounded-md transition-colors duration-200"
                >
                  Go to Workspace
                </Button>
                <SignOutButton />
              </SignedIn>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative flex justify-center lg:justify-end pt-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <div className="relative w-96 h-96 lg:w-[500px] lg:h-[500px]">
              <Image
                src="/images/hero.avif"
                alt="Paradise landscape"
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* footer */}
      <footer className="py-5 px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span>
              Built for{" "}
              <a
                href="https://innovatewithballerina.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-90"
              >
                Innovate with Ballerina 2025
              </a>
            </span>
            <span>
              The source code is available on{" "}
              <a
                href="https://github.com/chamals3n4/iwb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-90"
              >
                Github
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
