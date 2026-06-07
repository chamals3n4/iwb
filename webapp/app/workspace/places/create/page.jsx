"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  XCircle,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080";

const workspaceTypes = [
  "Flexible Workspace",
  "Creative Studio",
  "Private Office",
  "Meeting Room",
  "Tech Workspace",
  "Eco-Friendly",
];

const amenities = [
  "High-Speed WiFi",
  "Meeting Rooms",
  "Parking",
  "Coffee Bar",
  "24/7 Access",
  "Gym",
  "Printing",
  "Kitchen",
  "Rooftop Terrace",
  "Phone Booths",
  "3D Printing",
  "Workshop Area",
  "Art Supplies",
  "Photography Studio",
  "Garden Area",
  "Bike Storage",
];

export default function CreatePlacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    googleMapsUrl: "",
    price: "",
    currency: "USD",
    billing: "daily",
    capacity: "",
    workspaceTypes: [],
    amenities: [],
    phone: "",
    email: "",
    website: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...images];
    const newPreviews = [...imagePreviews];

    files.forEach((file) => {
      if (newImages.length < 3) {
        newImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setImages(newImages);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.workspaceTypes.length === 0) {
      setError("Please select at least one workspace type");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "workspaceTypes" || key === "amenities") {
          formDataToSend.append(key, formData[key].join(","));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      images.forEach((image, index) => {
        formDataToSend.append(`photo${index + 1}`, image);
      });

      const response = await fetch(`${API_BASE_URL}/api/places`, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Place created successfully!");
        setTimeout(() => router.push("/workspace/places"), 2000);
      } else {
        setError(result.message || "Failed to create place");
      }
    } catch (err) {
      setError("Network error: Unable to create place");
      console.error("Error creating place:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-12">
          <Link
            href="/workspace/places"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Places
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Add a New Place
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your workspace with the community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Basic Information
              </h2>
              <p className="text-muted-foreground">
                Tell us about your workspace
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Place Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter place name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="City, State or Address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl" className="text-sm font-medium">
                  Google Maps URL *
                </Label>
                <Input
                  id="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={(e) =>
                    handleInputChange("googleMapsUrl", e.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Images</h2>
              <p className="text-muted-foreground">
                Add photos of your workspace (up to 3)
              </p>
            </div>
            <div className="space-y-4">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover rounded-xl border shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length < 3 && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Click to upload images ({imagePreviews.length}/3)
                    </span>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Pricing Information
              </h2>
              <p className="text-muted-foreground">
                Set your pricing and billing options
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Price *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    handleInputChange("currency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing" className="text-sm font-medium">
                  Billing Period
                </Label>
                <Select
                  value={formData.billing}
                  onValueChange={(value) => handleInputChange("billing", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Capacity and Types
              </h2>
              <p className="text-muted-foreground">
                Define capacity and workspace types
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Capacity *
                </Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) =>
                    handleInputChange("capacity", e.target.value)
                  }
                  placeholder="e.g., 1-50 people"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-medium">Workspace Types *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {workspaceTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-3">
                      <Checkbox
                        id={type}
                        checked={formData.workspaceTypes.includes(type)}
                        onCheckedChange={(checked) =>
                          handleArrayChange("workspaceTypes", type, checked)
                        }
                      />
                      <Label
                        htmlFor={type}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Contact Information
              </h2>
              <p className="text-muted-foreground">How can people reach you?</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Amenities
              </h2>
              <p className="text-muted-foreground">
                What features does your workspace offer?
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-3">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={(checked) =>
                      handleArrayChange("amenities", amenity, checked)
                    }
                  />
                  <Label
                    htmlFor={amenity}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end pt-8">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Place...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Place
                </>
              )}
            </Button>
          </div>
        </form>

        {error && (
          <Alert className="mt-8 border-destructive/50 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-8 border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
