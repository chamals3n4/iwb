"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function AddCityPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    province: "",
    description: "",
    category: "",
    images: ["", "", "", ""],
    coordinates: { lat: "", lng: "" },
    amenities: [],
    ratings: {},
  });
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);

  const categories = [
    "Business Hub",
    "Cultural City",
    "Beach City",
    "Mountain Town",
  ];
  const amenityOptions = [
    "Coworking Spaces",
    "International Airport",
    "Shopping Malls",
    "Restaurants",
    "Beaches",
    "Cultural Sites",
    "Hiking Trails",
    "Tea Plantations",
    "Temples",
    "Museums",
    "Nightlife",
    "Markets",
  ];

  const ratingCategories = [
    { id: "cost", label: "Cost of Living", icon: "💰" },
    { id: "internet", label: "Internet Speed", icon: "📶" },
    { id: "safety", label: "Safety", icon: "🛡️" },
    { id: "fun", label: "Fun & Entertainment", icon: "🎉" },
    { id: "food", label: "Food Quality", icon: "🍽️" },
    { id: "transport", label: "Transportation", icon: "🚗" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("province", formData.province);
    fd.append("description", formData.description);
    fd.append("category", formData.category);
    fd.append("latitude", String(formData.coordinates.lat));
    fd.append("longitude", String(formData.coordinates.lng));
    fd.append("amenities", JSON.stringify(formData.amenities));

    imageFiles.forEach((file, idx) => {
      if (file) fd.append(`image${idx + 1}`, file);
    });

    try {
      const res = await fetch("http://localhost:8080/api/cities", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        router.push("/workspace/city-rank");
      } else {
        alert(data?.message || "Failed to create city");
      }
    } catch (err) {
      console.error("Failed to create city", err);
      alert("Failed to create city");
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/workspace/city-rank")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cities
          </Button>
          <h1 className="text-3xl font-bold">Add New City</h1>
          <p className="text-muted-foreground">
            Help expand our Sri Lankan city database
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {step}
                </div>
                {step < 4 && <div className="w-16 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Location</span>
            <span>Features</span>
            <span>Ratings</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    City Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter city name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Province *
                  </label>
                  <Input
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    placeholder="Enter province"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe this city..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Location & Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-4">
                    City Images (Upload 4 images)
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="space-y-2">
                        <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                          {image ? (
                            <div className="relative w-full h-full">
                              <img
                                src={image}
                                alt={`City image ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = [...formData.images];
                                  newImages[index] = "";
                                  setFormData({
                                    ...formData,
                                    images: newImages,
                                  });
                                  const files = [...imageFiles];
                                  files[index] = null;
                                  setImageFiles(files);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const newImages = [...formData.images];
                                    newImages[index] =
                                      URL.createObjectURL(file);
                                    setFormData({
                                      ...formData,
                                      images: newImages,
                                    });
                                    const files = [...imageFiles];
                                    files[index] = file;
                                    setImageFiles(files);
                                  }
                                };
                                input.click();
                              }}
                            >
                              <Upload className="w-8 h-8 mb-2" />
                              <span className="text-xs text-center">
                                Click to upload
                              </span>
                            </div>
                          )}
                        </div>
                        <Input
                          disabled
                          placeholder="Image URL (set via upload)"
                          value={image}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Upload 4 high-quality images that showcase the city.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latitude *
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.coordinates.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: {
                            ...formData.coordinates,
                            lat: e.target.value,
                          },
                        })
                      }
                      placeholder="7.8731"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Longitude *
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.coordinates.lng}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: {
                            ...formData.coordinates,
                            lng: e.target.value,
                          },
                        })
                      }
                      placeholder="80.7718"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {amenityOptions.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Initial Ratings (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratingCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium">{category.label}</span>
                      </div>
                      <select
                        className="text-sm border rounded px-2 py-1"
                        value={formData.ratings[category.id] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ratings: {
                              ...formData.ratings,
                              [category.id]: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Rate</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="ml-auto bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Next
              </Button>
            ) : (
              <Button type="submit" className="ml-auto">
                Add City
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
