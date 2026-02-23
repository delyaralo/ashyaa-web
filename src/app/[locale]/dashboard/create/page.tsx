"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  listingsApi,
  categoriesApi,
  citiesApi,
  aiApi,
  Category,
  City,
} from "@/lib/api";
import { getCategoryName, getCityName } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type SellType = "direct_buy" | "bid" | "both";
type Condition = "new" | "like_new" | "good" | "fair" | "poor";
type BidDuration = "24" | "48" | "72";

interface ImagePreview {
  file: File;
  url: string;
}

export default function CreateListingPage() {
  const t = useTranslations("listing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  // Form state
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [sellType, setSellType] = useState<SellType>("direct_buy");
  const [price, setPrice] = useState("");
  const [bidStartPrice, setBidStartPrice] = useState("");
  const [bidDuration, setBidDuration] = useState<BidDuration>("24");
  const [cityId, setCityId] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, unknown> | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    select: (res) => res.data,
  });

  // Fetch cities
  const { data: citiesData } = useQuery({
    queryKey: ["cities"],
    queryFn: () => citiesApi.list(),
    select: (res) => res.data,
  });

  const categories: Category[] = categoriesData?.categories ?? [];
  const cities: City[] = citiesData?.cities ?? [];

  // AI analyze mutation
  const analyzeImagesMutation = useMutation({
    mutationFn: (imageUrls: string[]) => aiApi.analyze(imageUrls),
    onSuccess: (res) => {
      setAiAnalyzing(false);
      const analysis = res.data.analysis;
      setAiSuggestions(analysis);

      // Pre-fill form with AI suggestions
      if (analysis.suggested_title && !title) {
        setTitle(String(analysis.suggested_title));
      }
      if (analysis.suggested_description && !description) {
        setDescription(String(analysis.suggested_description));
      }
      if (analysis.suggested_category) {
        setCategoryId(String(analysis.suggested_category));
      }
      if (analysis.suggested_condition) {
        setCondition(analysis.suggested_condition as Condition);
      }
      if (analysis.suggested_price && !price) {
        setPrice(String(analysis.suggested_price));
      }
    },
    onError: () => {
      setAiAnalyzing(false);
    },
  });

  // Create listing mutation
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => listingsApi.create(formData),
    onSuccess: (res) => {
      router.push(`/listings/${res.data.listing.id}`);
    },
    onError: () => {
      setError("Failed to create listing. Please try again.");
    },
  });

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const newImages: ImagePreview[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (images.length + newImages.length >= 10) break;
        if (!file.type.startsWith("image/")) continue;

        newImages.push({
          file,
          url: URL.createObjectURL(file),
        });
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);

        // Trigger AI analysis when first images are added
        if (images.length === 0 && newImages.length > 0) {
          setAiAnalyzing(true);
          // Convert to base64 for AI API
          const imageUrls = newImages.map((img) => img.url);
          analyzeImagesMutation.mutate(imageUrls);
        }
      }
    },
    [images, analyzeImagesMutation]
  );

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].url);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(e.target.files);
    }
  };

  const handleSubmit = () => {
    setError("");

    if (images.length === 0) {
      setError("Add at least one photo");
      return;
    }
    if (!title.trim()) {
      setError("Enter a title");
      return;
    }
    if (!categoryId) {
      setError("Select a category");
      return;
    }
    if (!cityId) {
      setError("Select a city");
      return;
    }
    if ((sellType === "direct_buy" || sellType === "both") && !price) {
      setError("Enter a price");
      return;
    }
    if ((sellType === "bid" || sellType === "both") && !bidStartPrice) {
      setError("Enter a starting bid price");
      return;
    }

    const formData = new FormData();
    images.forEach((img, i) => {
      formData.append(`images[${i}]`, img.file);
    });
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category_id", categoryId);
    formData.append("condition", condition);
    formData.append("sell_type", sellType);
    formData.append("city_id", cityId);
    formData.append("is_negotiable", isNegotiable ? "1" : "0");

    if (sellType === "direct_buy" || sellType === "both") {
      formData.append("price", price);
    }
    if (sellType === "bid" || sellType === "both") {
      formData.append("bid_start_price", bidStartPrice);
      formData.append("bid_duration_hours", bidDuration);
    }

    createMutation.mutate(formData);
  };

  if (!isLoggedIn) return null;

  const CONDITIONS: { value: Condition; label: string }[] = [
    { value: "new", label: t("new") },
    { value: "like_new", label: t("like_new") },
    { value: "good", label: t("good") },
    { value: "fair", label: t("fair") },
    { value: "poor", label: t("poor") },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-dark">{t("createListing")}</h1>

      {/* Image Upload Area */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          {t("uploadPhotos")} ({images.length}/10)
        </label>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <svg
            className="w-10 h-10 mx-auto text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            Drag photos here or tap to upload
          </p>
          <p className="text-xs text-gray-400 mt-1">Max 10 photos</p>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden group"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-primary text-white text-[10px] text-center py-0.5">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Analyzing Spinner */}
      {aiAnalyzing && (
        <div className="flex items-center gap-3 bg-info/5 border border-info/20 rounded-xl p-4">
          <svg
            className="w-5 h-5 text-info animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-info font-medium">
            {t("aiAnalyzing")}
          </span>
        </div>
      )}

      {/* AI Suggestions Banner */}
      {aiSuggestions && !aiAnalyzing && (
        <div className="bg-info/5 border border-info/20 rounded-xl p-4">
          <p className="text-sm text-info font-medium mb-1">
            AI Suggestions Applied
          </p>
          <p className="text-xs text-gray-500">
            We pre-filled some fields based on your photos. Feel free to edit.
          </p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you selling?"
          className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your item..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          {tCommon("categories")}
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.icon} {getCategoryName(cat, locale)}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          {t("condition")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.value}
              onClick={() => setCondition(cond.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                condition === cond.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sell Type */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          Sell Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "direct_buy", label: t("directBuy") },
              { value: "bid", label: t("bid") },
              { value: "both", label: t("both") },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setSellType(option.value)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                sellType === option.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price (for direct_buy and both) */}
      {(sellType === "direct_buy" || sellType === "both") && (
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            {t("price")} (IQD)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">{t("negotiable")}</span>
          </label>
        </div>
      )}

      {/* Bid settings (for bid and both) */}
      {(sellType === "bid" || sellType === "both") && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Starting Bid Price (IQD)
            </label>
            <input
              type="number"
              value={bidStartPrice}
              onChange={(e) => setBidStartPrice(e.target.value)}
              placeholder="0"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["24", "48", "72"] as const).map((hours) => (
                <button
                  key={hours}
                  onClick={() => setBidDuration(hours)}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                    bidDuration === hours
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-dark mb-2">
          {t("city")}
        </label>
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city.id} value={String(city.id)}>
              {getCityName(city, locale)}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error bg-error/10 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={createMutation.isPending}
        className="w-full h-14 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createMutation.isPending ? tCommon("loading") : t("createListing")}
      </button>
    </div>
  );
}
