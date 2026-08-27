"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api";

const SAMPLE_ROOMS = [
  {
    id: "living_room",
    title: "Modern Living Room",
    category: "Living",
    image: "/samples/living_room.jpg",
    description: "Spacious open living room with wooden flooring and natural sunlight.",
    recommended_style: "japandi_minimalist",
  },
  {
    id: "bathroom",
    title: "Luxury Spa Bathroom",
    category: "Bathroom",
    image: "/samples/bathroom.jpg",
    description: "Modern master bathroom with freestanding tub and tiled wall.",
    recommended_style: "italian_carrara_villa",
  },
  {
    id: "kitchen",
    title: "Chef Kitchen",
    category: "Kitchen",
    image: "/samples/kitchen.jpg",
    description: "Gourmet kitchen with island counters, backsplash, and tiled floor.",
    recommended_style: "manhattan_loft",
  },
  {
    id: "bedroom",
    title: "Minimalist Bedroom",
    category: "Bedroom",
    image: "/samples/bedroom.jpg",
    description: "Bright Scandinavian bedroom with warm morning lighting.",
    recommended_style: "parisian_haussmann",
  },
  {
    id: "dining_room",
    title: "Contemporary Dining",
    category: "Dining",
    image: "/samples/dining_room.jpg",
    description: "Elegant dining room with chandelier and large floor space.",
    recommended_style: "mediterranean_coastal",
  },
  {
    id: "office",
    title: "Executive Office",
    category: "Commercial",
    image: "/samples/office.jpg",
    description: "Modern executive office suite with large windows and open area.",
    recommended_style: "midnight_modern_luxe",
  },
];

const DEFAULT_STYLE_PRESETS = [
  {
    id: "japandi_minimalist",
    name: "Scandinavian Japandi",
    category: "Minimalist",
    badge: "🌿 Japandi",
    description: "Blonde Nordic oak timber, warm off-white linen textures, bonsai accents, and soft morning daylight.",
    thumbnail_url: "/samples/living_room.jpg",
    lighting_style: "Soft warm morning diffuse daylight",
    accent_color: "#10B981",
  },
  {
    id: "italian_carrara_villa",
    name: "Italian Carrara Luxury Villa",
    category: "Luxury",
    badge: "🏛️ Royal Villa",
    description: "High-gloss Statuario Carrara white marble, fluted brass accents, Italian leather furniture, and floor-to-ceiling garden views.",
    thumbnail_url: "/samples/bathroom.jpg",
    lighting_style: "Bright noon sun with crystal clear specular highlights",
    accent_color: "#F59E0B",
  },
  {
    id: "manhattan_loft",
    name: "Manhattan Industrial Loft",
    category: "Industrial",
    badge: "🏢 Soho Loft",
    description: "Exposed warm red brick walls, burnished concrete, distressed walnut flooring, and matte black steel fixtures.",
    thumbnail_url: "/samples/kitchen.jpg",
    lighting_style: "Warm amber Edison incandescent lighting",
    accent_color: "#EF4444",
  },
  {
    id: "mediterranean_coastal",
    name: "Mediterranean Coastal Villa",
    category: "Coastal",
    badge: "🏺 Tuscan Coast",
    description: "Fired Tuscan terracotta tiles, whitewashed lime stucco walls, woven rattan decor, and azure sea breezes.",
    thumbnail_url: "/samples/dining_room.jpg",
    lighting_style: "Dappled Mediterranean sunbeams",
    accent_color: "#EA580C",
  },
  {
    id: "parisian_haussmann",
    name: "Parisian Haussmannian Classic",
    category: "Classical",
    badge: "🥖 Haussmann",
    description: "French herringbone parquet flooring, ornate carved crown moldings, gilded mirrors, and marble fireplaces.",
    thumbnail_url: "/samples/bedroom.jpg",
    lighting_style: "Romantic soft Parisian daylight",
    accent_color: "#8B5CF6",
  },
  {
    id: "midnight_modern_luxe",
    name: "Midnight Modern Penthouse",
    category: "Luxury",
    badge: "🖤 Dark Luxe",
    description: "Nero Marquina black marble with white lightning veining, dark smoked oak, and recessed warm LED downlights.",
    thumbnail_url: "/samples/office.jpg",
    lighting_style: "Moody ambient architectural spotlighting",
    accent_color: "#6366F1",
  },
  {
    id: "tropical_modern_resort",
    name: "Balinese Tropical Modern",
    category: "Organic",
    badge: "🌴 Bali Modern",
    description: "Seamless burnished terrazzo flooring, indoor tropical palms, slatted teak wood, and natural courtyard skylights.",
    thumbnail_url: "/samples/living_room.jpg",
    lighting_style: "Lush tropical skylight sun rays",
    accent_color: "#059669",
  },
  {
    id: "art_deco_emerald_luxe",
    name: "Art Deco Emerald & Gold",
    category: "Artisan",
    badge: "💎 Art Deco",
    description: "Glossy jewel emerald ceramic subway tiles, brass fan inlays, velvet seating, and Gatsby-era glamour.",
    thumbnail_url: "/samples/bathroom.jpg",
    lighting_style: "Gleaming warm chandelier glow",
    accent_color: "#EC4899",
  },
];

export function useGenerativeStudio() {
  const [sampleRooms] = useState(SAMPLE_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState(SAMPLE_ROOMS[0]);
  const [originalImage, setOriginalImage] = useState(SAMPLE_ROOMS[0].image);
  const [originalFile, setOriginalFile] = useState(null);

  const [stylePresets, setStylePresets] = useState(DEFAULT_STYLE_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState("japandi_minimalist");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [customPrompt, setCustomPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [strength, setStrength] = useState(0.75);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(20);
  const [maskMode, setMaskMode] = useState("surface_only"); // "surface_only" | "full_scene"
  const [seed, setSeed] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageBase64, setGeneratedImageBase64] = useState(null);
  const [viewMode, setViewMode] = useState("split");
  const [splitPosition, setSplitPosition] = useState(50);
  const [statusMessage, setStatusMessage] = useState("Select an architectural style preset and click '✨ Generate AI Room Restyle'.");
  const [executionTimeMs, setExecutionTimeMs] = useState(0);

  const activeBackendImageRef = useRef(null);

  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await apiClient.getGenerativePresetsV4();
        if (data && data.length > 0) {
          setStylePresets(data);
        }
      } catch (err) {
        console.warn("Using default V4 style presets:", err);
      }
    }
    loadPresets();
  }, []);

  const selectSampleRoom = useCallback((sample) => {
    if (!sample) return;
    setSelectedRoom(sample);
    setOriginalImage(sample.image);
    setOriginalFile(null);
    setGeneratedImageBase64(null);
    setViewMode("original");
    if (sample.recommended_style) {
      setSelectedPresetId(sample.recommended_style);
    }
    activeBackendImageRef.current = null;
    setStatusMessage(`Selected ${sample.title}. Click '✨ Generate AI Room Restyle' below.`);
  }, []);

  const uploadCustomRoom = useCallback((file) => {
    if (!file) return;
    setSelectedRoom(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target.result);
    };
    reader.readAsDataURL(file);

    setOriginalFile(file);
    setGeneratedImageBase64(null);
    setViewMode("original");
    activeBackendImageRef.current = null;
    setStatusMessage("Custom room loaded! Pick an interior style preset and click '✨ Generate AI Room Restyle'.");
  }, []);

  const generateRestyle = useCallback(async () => {
    try {
      setIsGenerating(true);

      const targetImageKey = selectedRoom ? selectedRoom.id : "custom_upload";
      if (activeBackendImageRef.current !== targetImageKey) {
        setStatusMessage("Uploading room image to session...");

        let fileToUpload = originalFile;
        if (!fileToUpload && selectedRoom) {
          const res = await fetch(selectedRoom.image);
          const blob = await res.blob();
          fileToUpload = new File([blob], `${selectedRoom.id}.jpg`, { type: "image/jpeg" });
        }

        if (!fileToUpload) {
          throw new Error("No room image available to upload.");
        }

        await apiClient.setImage(fileToUpload);
        activeBackendImageRef.current = targetImageKey;
      }

      setStatusMessage("Executing CPU Generative Latent Diffusion Inpainting (processing 20 DPM++ steps on CPU RAM)...");

      const res = await apiClient.restyleRoomV4({
        style_preset: selectedPresetId,
        custom_prompt: customPrompt || null,
        negative_prompt: negativePrompt || null,
        strength: strength,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
        seed: seed ? parseInt(seed) : null,
        mask_mode: maskMode,
      });

      if (res.success) {
        setGeneratedImageBase64(res.generated_image_base64);
        setExecutionTimeMs(res.execution_time_ms);
        setViewMode("split");
        setStatusMessage(res.message);
      }
    } catch (err) {
      alert(`AI Generative error: ${err.message}`);
      setStatusMessage(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedPresetId,
    customPrompt,
    negativePrompt,
    strength,
    guidanceScale,
    numInferenceSteps,
    seed,
    maskMode,
    selectedRoom,
    originalFile,
  ]);

  return {
    sampleRooms,
    selectedRoom,
    originalImage,
    originalFile,
    stylePresets,
    selectedPresetId,
    setSelectedPresetId,
    selectedCategory,
    setSelectedCategory,
    customPrompt,
    setCustomPrompt,
    negativePrompt,
    setNegativePrompt,
    strength,
    setStrength,
    guidanceScale,
    setGuidanceScale,
    numInferenceSteps,
    setNumInferenceSteps,
    maskMode,
    setMaskMode,
    seed,
    setSeed,
    isGenerating,
    generatedImageBase64,
    viewMode,
    setViewMode,
    splitPosition,
    setSplitPosition,
    statusMessage,
    executionTimeMs,
    selectSampleRoom,
    uploadCustomRoom,
    generateRestyle,
  };
}
