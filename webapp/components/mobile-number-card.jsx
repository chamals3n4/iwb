"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, Edit, Check, X, Loader2 } from "lucide-react";
import { User } from "@asgardeo/nextjs";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

function MobileNumberCardInner({ user }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [prevMobileNumber, setPrevMobileNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user?.sub && !hasFetched) {
      fetchMobileNumber();
    }
  }, [user?.sub, hasFetched]);

  const fetchMobileNumber = async () => {
    try {
      setIsLoading(true);
      setError("");
      setHasFetched(true);

      const response = await fetch(
        `http://localhost:8080/api/users/${user.sub}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.data?.mobileNumber) {
          setMobileNumber(userData.data.mobileNumber);
        }
      }
    } catch (error) {
      console.error("Error fetching mobile number:", error);
      setError("Failed to load mobile number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mobileNumber) {
      setError("Mobile number is required");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `http://localhost:8080/api/users/${user.sub}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobileNumber }),
        },
      );

      if (response.ok) {
        setIsEditing(false);
      } else {
        const errorData = await response.text();
        setError(errorData || "Failed to update mobile number");
      }
    } catch (error) {
      console.error("Error updating mobile number:", error);
      setError("Failed to update mobile number");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMobileNumber(prevMobileNumber);
    setIsEditing(false);
    setError("");
  };

  const handleEdit = () => {
    setPrevMobileNumber(mobileNumber);
    setIsEditing(true);
  };

  if (!user?.sub) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (mobileNumber && !isEditing) {
    return (
      <Card className="px-3 py-2 bg-muted/50 border-muted">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {mobileNumber}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="px-3 py-2 bg-muted/50 border-muted">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <PhoneInput
            international
            defaultCountry="US"
            value={mobileNumber}
            onChange={setMobileNumber}
            disabled={isSaving}
            style={{ display: "flex", flexDirection: "column" }}
            inputClassName="h-6 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 flex-1"
            containerClassName="flex-1"
          />
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3 text-green-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </Card>
  );
}

export function MobileNumberCard() {
  return <User>{(user) => <MobileNumberCardInner user={user} />}</User>;
}
