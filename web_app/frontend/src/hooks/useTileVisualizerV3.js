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
    recommended_surface: "floor",
    recommended_tile: "mytyles_carrara_marble",
  },
  {
    id: "bathroom",
    title: "Luxury Spa Bathroom",
    category: "Bathroom",
    image: "/samples/bathroom.jpg",
    description: "Modern master bathroom with freestanding tub and tiled wall.",
    recommended_surface: "wall",
    recommended_tile: "mytyles_emerald_subway",
  },
  {
    id: "kitchen",
    title: "Chef Kitchen",
    category: "Kitchen",
    image: "/samples/kitchen.jpg",
    description: "Gourmet kitchen with island counters, backsplash, and tiled floor.",
    recommended_surface: "floor",
    recommended_tile: "mytyles_calacatta_gold",
  },
  {
    id: "bedroom",
    title: "Minimalist Bedroom",
    category: "Bedroom",
    image: "/samples/bedroom.jpg",
    description: "Bright Scandinavian bedroom with warm morning lighting.",
    recommended_surface: "floor",
    recommended_tile: "mytyles_nordic_ash_wood",
  },
  {
    id: "dining_room",
    title: "Contemporary Dining",
    category: "Dining",
    image: "/samples/dining_room.jpg",
    description: "Elegant dining room with chandelier and large floor space.",
    recommended_surface: "floor",
    recommended_tile: "mytyles_walnut_herringbone",
  },
  {
    id: "office",
    title: "Executive Office",
    category: "Commercial",
    image: "/samples/office.jpg",
    description: "Modern executive office suite with large windows and open area.",
    recommended_surface: "floor",
    recommended_tile: "mytyles_charcoal_slate",
  },
];

const DEFAULT_TILE_CATALOG = [
  {
    id: "mytyles_carrara_marble",
    name: "MyTyles Statuario Carrara Royal",
    category: "marble",
    material: "Glazed Vitrified Tile (GVT)",
    finish: "High Gloss Polish",
    color_tone: "White & Smoky Grey",
    description: "Authentic Italian Statuario marble from MyTyles with delicate feathery grey veining over a pure milky white base.",
    default_scale: 1.0,
    aspect_ratio: "square",
    roughness: 0.15,
    specular: 0.85,
    grout_default_color: "#E2E8F0",
    grout_default_width: 2,
    accent_color: "#38BDF8",
    tag: "🏆 Best Seller",
    thumbnail_url: "/tiles/mytyles_carrara_marble.png"
  },
  {
    id: "mytyles_calacatta_gold",
    name: "MyTyles Calacatta Oro Gold",
    category: "marble",
    material: "Double Charge Vitrified",
    finish: "Satin Silk Honed",
    color_tone: "Warm Cream & Golden Ochre",
    description: "Luxurious Italian Calacatta marble from MyTyles featuring dramatic honey-gold ribbons and soft taupe accents.",
    default_scale: 1.0,
    aspect_ratio: "square",
    roughness: 0.20,
    specular: 0.80,
    grout_default_color: "#FEF3C7",
    grout_default_width: 2,
    accent_color: "#F59E0B",
    tag: "✨ Premium",
    thumbnail_url: "/tiles/mytyles_calacatta_gold.png"
  },
  {
    id: "mytyles_nero_marquina",
    name: "MyTyles Nero Marquina Midnight",
    category: "marble",
    material: "Digital Glazed Vitrified",
    finish: "Polished Mirror Black",
    color_tone: "Deep Obsidian Black & Crisp White",
    description: "Spanish black marble aesthetic from MyTyles with sharp, lightning-style crystalline white fracture veins.",
    default_scale: 1.0,
    aspect_ratio: "square",
    roughness: 0.10,
    specular: 0.90,
    grout_default_color: "#334155",
    grout_default_width: 2,
    accent_color: "#64748B",
    tag: "🖤 Luxury Black",
    thumbnail_url: "/tiles/mytyles_nero_marquina.png"
  },
  {
    id: "mytyles_rustic_oak_wood",
    name: "MyTyles Golden Oak Plank",
    category: "wood",
    material: "Matte Porcelain Wood Strip",
    finish: "Textured Natural Woodgrain",
    color_tone: "Warm Golden Honey Oak",
    description: "Natural European Oak wood-look tile from MyTyles with authentic wood knots and anti-skid tactile texture.",
    default_scale: 1.2,
    aspect_ratio: "plank",
    roughness: 0.70,
    specular: 0.20,
    grout_default_color: "#92400E",
    grout_default_width: 1,
    accent_color: "#B45309",
    tag: "🌲 Natural Wood",
    thumbnail_url: "/tiles/mytyles_rustic_oak_wood.png"
  },
  {
    id: "mytyles_walnut_herringbone",
    name: "MyTyles American Walnut Chevron",
    category: "wood",
    material: "Full Body Vitrified",
    finish: "Matte Anti-Skid Finish",
    color_tone: "Dark Roasted Mocha Brown",
    description: "Rich American Walnut parquet plank from MyTyles engineered for elegant French chevron and herringbone layouts.",
    default_scale: 1.1,
    aspect_ratio: "pattern",
    roughness: 0.65,
    specular: 0.25,
    grout_default_color: "#451A03",
    grout_default_width: 1,
    accent_color: "#78350F",
    tag: "🥖 Classic French",
    thumbnail_url: "/tiles/mytyles_walnut_herringbone.png"
  },
  {
    id: "mytyles_nordic_ash_wood",
    name: "MyTyles Nordic Sand Birch",
    category: "wood",
    material: "Glazed Ceramic Plank",
    finish: "Satin Soft Touch",
    color_tone: "Pale Sand & Blonde Timber",
    description: "Japandi-inspired minimalist light ash plank from MyTyles with fine linear grain for serene modern rooms.",
    default_scale: 1.15,
    aspect_ratio: "plank",
    roughness: 0.50,
    specular: 0.30,
    grout_default_color: "#D6D3D1",
    grout_default_width: 1,
    accent_color: "#A8A29E",
    tag: "🌿 Japandi",
    thumbnail_url: "/tiles/mytyles_nordic_ash_wood.png"
  },
  {
    id: "mytyles_emerald_subway",
    name: "MyTyles Emerald Green Beveled Subway",
    category: "ceramic",
    material: "Glazed Artisan Ceramic",
    finish: "Glossy Handmade Wavy Glaze",
    color_tone: "Deep Jewel Emerald Green",
    description: "Handcrafted-style 3x6 inch metro subway tile from MyTyles featuring rich jewel-toned emerald glaze with beveled edges.",
    default_scale: 0.9,
    aspect_ratio: "brick",
    roughness: 0.20,
    specular: 0.85,
    grout_default_color: "#064E3B",
    grout_default_width: 2,
    accent_color: "#059669",
    tag: "💎 Designer Subway",
    thumbnail_url: "/tiles/mytyles_emerald_subway.png"
  },
  {
    id: "mytyles_arctic_white_subway",
    name: "MyTyles Arctic White Metro Subway",
    category: "ceramic",
    material: "Monocottura Ceramic",
    finish: "High Gloss Glaze",
    color_tone: "Pure Bright White",
    description: "Timeless clean white subway tile from MyTyles, perfect for kitchen backsplashes, shower walls, and contemporary accents.",
    default_scale: 0.85,
    aspect_ratio: "brick",
    roughness: 0.15,
    specular: 0.85,
    grout_default_color: "#CBD5E1",
    grout_default_width: 2,
    accent_color: "#94A3B8",
    tag: "🤍 Clean Classic",
    thumbnail_url: "/tiles/mytyles_arctic_white_subway.png"
  },
  {
    id: "mytyles_terracotta_hexagon",
    name: "MyTyles Tuscan Baked Cotto Hexagon",
    category: "ceramic",
    material: "Unglazed Extruded Clay",
    finish: "Matte Earthy Cleft",
    color_tone: "Warm Terracotta Burnt Orange",
    description: "Rustic Italian-style hexagonal terracotta tile from MyTyles made from fired clay for warm organic kitchens & patios.",
    default_scale: 0.95,
    aspect_ratio: "hexagon",
    roughness: 0.80,
    specular: 0.15,
    grout_default_color: "#78350F",
    grout_default_width: 3,
    accent_color: "#EA580C",
    tag: "🏺 Rustic Tuscan",
    thumbnail_url: "/tiles/mytyles_terracotta_hexagon.png"
  },
  {
    id: "mytyles_moroccan_zellige",
    name: "MyTyles Marrakech Cobalt Encaustic",
    category: "mosaic",
    material: "Handcrafted Cement Encaustic",
    finish: "Matte Satin Silky Touch",
    color_tone: "Royal Indigo & Antique Chalk",
    description: "Traditional North African Moroccan geometric star pattern from MyTyles with artisanal symmetry and bold indigo hues.",
    default_scale: 0.9,
    aspect_ratio: "pattern",
    roughness: 0.50,
    specular: 0.40,
    grout_default_color: "#94A3B8",
    grout_default_width: 2,
    accent_color: "#4338CA",
    tag: "🕌 Moroccan Art",
    thumbnail_url: "/tiles/mytyles_moroccan_zellige.png"
  },
  {
    id: "mytyles_venetian_terrazzo",
    name: "MyTyles Venetian Pastel Confetti Terrazzo",
    category: "stone",
    material: "Honed Engineered Terrazzo",
    finish: "Smooth Matte Honed",
    color_tone: "Ivory Base with Pastel Quartz Chips",
    description: "Authentic Venetian Terrazzo from MyTyles featuring embedded marble, quartz, and river stone chips in an ivory matrix.",
    default_scale: 1.0,
    aspect_ratio: "square",
    roughness: 0.40,
    specular: 0.50,
    grout_default_color: "#E2E8F0",
    grout_default_width: 1,
    accent_color: "#EC4899",
    tag: "🎨 Italian Terrazzo",
    thumbnail_url: "/tiles/mytyles_venetian_terrazzo.png"
  },
  {
    id: "mytyles_charcoal_slate",
    name: "MyTyles Anthracite Natural Cleft Slate",
    category: "stone",
    material: "Natural Metamorphic Slate",
    finish: "Riven 3D Textured Surface",
    color_tone: "Charcoal Black & Mineral Grey",
    description: "Rugged slate tile from MyTyles with natural layered cleft texture and subtle quartz mineral highlights.",
    default_scale: 1.1,
    aspect_ratio: "square",
    roughness: 0.85,
    specular: 0.15,
    grout_default_color: "#1E293B",
    grout_default_width: 2,
    accent_color: "#475569",
    tag: "🪨 Natural Stone",
    thumbnail_url: "/tiles/mytyles_charcoal_slate.png"
  },
  {
    id: "mytyles_roman_travertine",
    name: "MyTyles Roman Beige Vein Travertine",
    category: "stone",
    material: "Cross-Cut Limestone",
    finish: "Filled & Honed Matte",
    color_tone: "Warm Almond & Cream Striae",
    description: "Classic Roman Travertine from MyTyles with horizontal sedimentary banding and soft velvety limestone texture.",
    default_scale: 1.05,
    aspect_ratio: "square",
    roughness: 0.55,
    specular: 0.35,
    grout_default_color: "#E7E5E4",
    grout_default_width: 2,
    accent_color: "#D97706",
    tag: "🏛️ Roman Heritage",
    thumbnail_url: "/tiles/mytyles_roman_travertine.png"
  },
  {
    id: "mytyles_art_deco_mosaic",
    name: "MyTyles Art Deco Midnight Gold Fan",
    category: "mosaic",
    material: "Glass & Brass Inlay Mosaic",
    finish: "Gloss Enamel with Metallic Gold",
    color_tone: "Navy Blue & Burnished Brass",
    description: "Gatsby-era scallop fan mosaic from MyTyles with glossy deep navy tiles bordered by metallic brass accents.",
    default_scale: 0.85,
    aspect_ratio: "pattern",
    roughness: 0.25,
    specular: 0.80,
    grout_default_color: "#CA8A04",
    grout_default_width: 2,
    accent_color: "#EAB308",
    tag: "🌟 Art Deco Luxe",
    thumbnail_url: "/tiles/mytyles_art_deco_mosaic.png"
  },
  {
    id: "mytyles_concrete_industrial",
    name: "MyTyles Urban Loft Burnished Concrete",
    category: "stone",
    material: "High-Density Porcelain Slab",
    finish: "Micro-Porous Satin Matte",
    color_tone: "Architectural Steel Grey",
    description: "Minimalist poured-concrete finish from MyTyles with cloud-like trowel marks and modern industrial aesthetic.",
    default_scale: 1.3,
    aspect_ratio: "square",
    roughness: 0.60,
    specular: 0.30,
    grout_default_color: "#64748B",
    grout_default_width: 1,
    accent_color: "#64748B",
    tag: "🏢 Industrial Loft",
    thumbnail_url: "/tiles/mytyles_concrete_industrial.png"
  },
  {
    id: "mytyles_andalusian_majolica",
    name: "MyTyles Andalusian Vintage Floral",
    category: "mosaic",
    material: "Hand-Glazed Ceramic",
    finish: "Traditional Silky Gloss Glaze",
    color_tone: "Sun Yellow, Cobalt & Ochre",
    description: "Heritage Mediterranean floral pattern from MyTyles with warm sun-drenched European hacienda charm.",
    default_scale: 0.9,
    aspect_ratio: "pattern",
    roughness: 0.30,
    specular: 0.60,
    grout_default_color: "#CBD5E1",
    grout_default_width: 2,
    accent_color: "#E11D48",
    tag: "🌻 Andalusian Vintage",
    thumbnail_url: "/tiles/mytyles_andalusian_majolica.png"
  }
];

const STYLE_PRESETS = [
  {
    id: "preset_carrara_luxe",
    name: "Statuario Carrara Palace",
    badge: "🏛️ Royal Marble",
    tile_id: "mytyles_carrara_marble",
    surface_type: "floor",
    scale: 1.1,
    rotation_deg: 0,
    perspective_strength: 0.65,
    shadow_retention: 0.75,
    grout_width: 2,
    grout_color: "#E2E8F0",
    glossiness: 0.85,
    blending_mode: "hybrid",
    auto_vanishing_point: true,
    pbr_bump_strength: 0.40,
    fresnel_reflection_strength: 0.70,
    grout_crevice_depth: 0.35,
  },
  {
    id: "preset_herringbone_parlor",
    name: "French Walnut Chevron",
    badge: "🥖 French Parquet",
    tile_id: "mytyles_walnut_herringbone",
    surface_type: "floor",
    scale: 1.0,
    rotation_deg: 45,
    perspective_strength: 0.70,
    shadow_retention: 0.80,
    grout_width: 1,
    grout_color: "#451A03",
    glossiness: 0.25,
    blending_mode: "normal_depth",
    auto_vanishing_point: true,
    pbr_bump_strength: 0.75,
    fresnel_reflection_strength: 0.20,
    grout_crevice_depth: 0.60,
  },
  {
    id: "preset_emerald_backsplash",
    name: "Emerald Subway Accent",
    badge: "💎 Jewel Ceramic",
    tile_id: "mytyles_emerald_subway",
    surface_type: "wall",
    scale: 0.85,
    rotation_deg: 0,
    perspective_strength: 0.0,
    shadow_retention: 0.70,
    grout_width: 2,
    grout_color: "#064E3B",
    glossiness: 0.80,
    blending_mode: "hybrid",
    auto_vanishing_point: false,
    pbr_bump_strength: 0.60,
    fresnel_reflection_strength: 0.40,
    grout_crevice_depth: 0.50,
  },
  {
    id: "preset_nordic_serene",
    name: "Nordic Japandi Timber",
    badge: "🌿 Japandi Ash",
    tile_id: "mytyles_nordic_ash_wood",
    surface_type: "floor",
    scale: 1.2,
    rotation_deg: 0,
    perspective_strength: 0.60,
    shadow_retention: 0.70,
    grout_width: 1,
    grout_color: "#D6D3D1",
    glossiness: 0.30,
    blending_mode: "intrinsic",
    auto_vanishing_point: true,
    pbr_bump_strength: 0.55,
    fresnel_reflection_strength: 0.25,
    grout_crevice_depth: 0.40,
  },
];

const BLENDING_ENGINES = [
  {
    id: "hybrid",
    name: "Hybrid Photoreal Matrix",
    badge: "🏆 Recommended",
    icon: "🌟",
    desc: "Multi-scale Intrinsic Retinex + 3D normal depth falloff + edge-preserving bilateral filter.",
    tag: "Master Quality",
  },
  {
    id: "bilateral",
    name: "Bilateral Guided Shading",
    badge: "⚡ Edge-Preserving",
    icon: "🔬",
    desc: "Joint bilateral filter separating room shadows from old texture grain.",
    tag: "Sub-20ms",
  },
  {
    id: "poisson",
    name: "Poisson Seamless Cloner",
    badge: "🌊 Gradient PDE",
    icon: "📐",
    desc: "Solves Poisson Partial Differential Equation with Dirichlet boundary conditions.",
    tag: "Seamless Skirting",
  },
  {
    id: "intrinsic",
    name: "Multi-Scale Intrinsic",
    badge: "🔬 Scale-Space Retinex",
    icon: "☀️",
    desc: "Multi-frequency Gaussian decomposition into low-freq ambient, shadows, and specular highlights.",
    tag: "HDR Sunlight",
  },
  {
    id: "normal_depth",
    name: "3D Depth & Normal Shading",
    badge: "📐 Lambertian Cosine",
    icon: "🕶️",
    desc: "3D surface normal gradient vectors and Lambertian light bounce.",
    tag: "Directional Sun",
  },
];

export function useTileVisualizerV3() {
  const [tileCatalog, setTileCatalog] = useState(DEFAULT_TILE_CATALOG);
  const [selectedRoom, setSelectedRoom] = useState(SAMPLE_ROOMS[0]);
  const [originalImage, setOriginalImage] = useState(SAMPLE_ROOMS[0].image);
  const [originalFile, setOriginalFile] = useState(null);

  const [surfaceType, setSurfaceType] = useState("floor");
  const [confidence, setConfidence] = useState(0.12);
  const [customPrompt, setCustomPrompt] = useState("");

  const [selectedTileId, setSelectedTileId] = useState("mytyles_carrara_marble");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [blendingMode, setBlendingMode] = useState("hybrid");

  const [renderOptions, setRenderOptions] = useState({
    scale: 1.0,
    rotation_deg: 0,
    perspective_strength: 0.65,
    shadow_retention: 0.75,
    grout_width: 2,
    grout_color: "#D1D5DB",
    glossiness: 0.65,
    blending_mode: "hybrid",
    auto_vanishing_point: true,
    pbr_bump_strength: 0.50,
    fresnel_reflection_strength: 0.50,
    grout_crevice_depth: 0.40,
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [surfaceMasks, setSurfaceMasks] = useState([]);
  const [compositeMaskBase64, setCompositeMaskBase64] = useState(null);
  const [renderedImageBase64, setRenderedImageBase64] = useState(null);
  const [viewMode, setViewMode] = useState("split");
  const [splitPosition, setSplitPosition] = useState(50);

  const [statusMessage, setStatusMessage] = useState("Select a room photo and target surface to begin.");
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [detectedVanishingPoint, setDetectedVanishingPoint] = useState(null);

  const activeBackendImageRef = useRef(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await apiClient.getTileCatalogV3();
        if (data && data.length > 0) {
          setTileCatalog(data);
        }
      } catch (err) {
        console.warn("Using default V3 tile catalog fallback:", err);
      }
    }
    loadCatalog();
  }, []);

  const selectSampleRoom = useCallback((sample) => {
    if (!sample) return;
    setSelectedRoom(sample);
    setOriginalImage(sample.image);
    setOriginalFile(null);
    setSurfaceMasks([]);
    setCompositeMaskBase64(null);
    setRenderedImageBase64(null);
    setViewMode("original");
    setSurfaceType(sample.recommended_surface || "floor");
    if (sample.recommended_tile) {
      setSelectedTileId(sample.recommended_tile);
    }
    activeBackendImageRef.current = null;
    setStatusMessage(`Selected ${sample.title}. Choose Floor or Wall in Section 2 and click '⚡ Detect Surface (SAM 3)'.`);
  }, []);

  useEffect(() => {
    setSelectedRoom(SAMPLE_ROOMS[0]);
    setOriginalImage(SAMPLE_ROOMS[0].image);
    setSurfaceType(SAMPLE_ROOMS[0].recommended_surface || "floor");
    setSelectedTileId(SAMPLE_ROOMS[0].recommended_tile || "mytyles_carrara_marble");
    setStatusMessage(`Ready. Click '⚡ Detect Surface (SAM 3)' in Section 2 to segment the floor.`);
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
    setSurfaceMasks([]);
    setCompositeMaskBase64(null);
    setRenderedImageBase64(null);
    setViewMode("original");
    activeBackendImageRef.current = null;
    setStatusMessage("Custom room loaded! Choose Floor or Wall in Section 2 and click '⚡ Detect Surface (SAM 3)'.");
  }, []);

  const detectSurface = useCallback(async () => {
    try {
      setIsDetecting(true);

      const targetImageKey = selectedRoom ? selectedRoom.id : "custom_upload";
      if (activeBackendImageRef.current !== targetImageKey) {
        setIsUploading(true);
        setStatusMessage("Uploading room image to SAM 3 vision engine (computing neural embeddings)...");

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
        setIsUploading(false);
      }

      setStatusMessage(`Segmenting ${surfaceType.toUpperCase()} with SAM 3 vision transformer...`);

      const res = await apiClient.detectTileSurfaceV3(
        surfaceType,
        confidence,
        customPrompt || null
      );

      if (res.success) {
        setSurfaceMasks(res.surface_masks || []);
        setCompositeMaskBase64(res.composite_mask_base64);
        setExecutionTimeMs(res.execution_time_ms);
        setViewMode("mask");
        setStatusMessage(`✓ Detected ${res.num_regions} ${surfaceType} region(s) in ${res.execution_time_ms}ms! Select a tile in Section 3 and click '✨ Render Tiles'.`);
      }
    } catch (err) {
      alert(`Surface detection error: ${err.message}`);
      setStatusMessage(`Detection error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setIsDetecting(false);
    }
  }, [surfaceType, confidence, customPrompt, selectedRoom, originalFile]);

  const renderTile = useCallback(async (overrideTileId = null, overrideOptions = null) => {
    const tileId = overrideTileId || selectedTileId;
    const opts = overrideOptions || renderOptions;

    if (!compositeMaskBase64) {
      alert("Please detect the room surface first by clicking '⚡ Detect Surface (SAM 3)' in Section 2!");
      setStatusMessage("Surface not detected yet. Click '⚡ Detect Surface (SAM 3)' in Section 2 first.");
      return;
    }

    try {
      setIsRendering(true);
      setStatusMessage(`Rendering ${tileId} with V3.0 PBR & ${opts.blending_mode || blendingMode} blending...`);

      const res = await apiClient.renderTileVisualizerV3({
        tile_id: tileId,
        surface_type: surfaceType,
        scale: opts.scale,
        rotation_deg: opts.rotation_deg,
        perspective_strength: opts.perspective_strength,
        shadow_retention: opts.shadow_retention,
        grout_width: opts.grout_width,
        grout_color: opts.grout_color,
        glossiness: opts.glossiness,
        blending_mode: opts.blending_mode || blendingMode,
        auto_vanishing_point: opts.auto_vanishing_point,
        pbr_bump_strength: opts.pbr_bump_strength,
        fresnel_reflection_strength: opts.fresnel_reflection_strength,
        grout_crevice_depth: opts.grout_crevice_depth,
      });

      if (res.success) {
        setRenderedImageBase64(res.rendered_image_base64);
        setExecutionTimeMs(res.execution_time_ms);
        setDetectedVanishingPoint(res.vanishing_point);
        setViewMode("split");
        setStatusMessage(res.message);
      }
    } catch (err) {
      alert(`Tile render error: ${err.message}`);
      setStatusMessage(`Render error: ${err.message}`);
    } finally {
      setIsRendering(false);
    }
  }, [selectedTileId, renderOptions, surfaceType, compositeMaskBase64, blendingMode]);

  const applyPreset = useCallback((preset) => {
    setSelectedTileId(preset.tile_id);
    setSurfaceType(preset.surface_type);
    const newOpts = {
      scale: preset.scale,
      rotation_deg: preset.rotation_deg,
      perspective_strength: preset.perspective_strength,
      shadow_retention: preset.shadow_retention,
      grout_width: preset.grout_width,
      grout_color: preset.grout_color,
      glossiness: preset.glossiness,
      blending_mode: preset.blending_mode || "hybrid",
      auto_vanishing_point: preset.auto_vanishing_point ?? true,
      pbr_bump_strength: preset.pbr_bump_strength ?? 0.50,
      fresnel_reflection_strength: preset.fresnel_reflection_strength ?? 0.50,
      grout_crevice_depth: preset.grout_crevice_depth ?? 0.40,
    };
    setRenderOptions(newOpts);
    setStatusMessage(`Applied preset '${preset.name}'. Click '✨ Render Tiles onto Room' in Section 4 to render.`);
  }, []);

  return {
    sampleRooms: SAMPLE_ROOMS,
    presets: STYLE_PRESETS,
    blendingEngines: BLENDING_ENGINES,
    blendingMode,
    setBlendingMode,
    selectedRoom,
    originalImage,
    originalFile,
    surfaceType,
    setSurfaceType,
    confidence,
    setConfidence,
    customPrompt,
    setCustomPrompt,
    tileCatalog,
    selectedTileId,
    setSelectedTileId,
    selectedCategory,
    setSelectedCategory,
    renderOptions,
    setRenderOptions,
    isDetecting,
    isRendering,
    isUploading,
    surfaceMasks,
    compositeMaskBase64,
    renderedImageBase64,
    viewMode,
    setViewMode,
    splitPosition,
    setSplitPosition,
    statusMessage,
    executionTimeMs,
    detectedVanishingPoint,
    selectSampleRoom,
    uploadCustomRoom,
    detectSurface,
    renderTile,
    applyPreset,
  };
}
