from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw
import numpy as np

# Root directories for persistent and frontend tile assets
TILES_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "tiles"
FRONTEND_TILES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public" / "tiles"

TILE_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "mytyles_carrara_marble",
        "name": "MyTyles Statuario Carrara Royal",
        "category": "marble",
        "material": "Glazed Vitrified Tile (GVT)",
        "finish": "High Gloss Polish",
        "color_tone": "White & Smoky Grey",
        "description": "Authentic Italian Statuario marble from MyTyles with delicate feathery grey veining over a pure milky white base.",
        "default_scale": 1.0,
        "aspect_ratio": "square",
        "roughness": 0.15,
        "specular": 0.85,
        "grout_default_color": "#E2E8F0",
        "grout_default_width": 2,
        "accent_color": "#38BDF8",
        "tag": "🏆 Best Seller",
        "thumbnail_url": "/tiles/mytyles_carrara_marble.png"
    },
    {
        "id": "mytyles_calacatta_gold",
        "name": "MyTyles Calacatta Oro Gold",
        "category": "marble",
        "material": "Double Charge Vitrified",
        "finish": "Satin Silk Honed",
        "color_tone": "Warm Cream & Golden Ochre",
        "description": "Luxurious Italian Calacatta marble from MyTyles featuring dramatic honey-gold ribbons and soft taupe accents.",
        "default_scale": 1.0,
        "aspect_ratio": "square",
        "roughness": 0.20,
        "specular": 0.80,
        "grout_default_color": "#FEF3C7",
        "grout_default_width": 2,
        "accent_color": "#F59E0B",
        "tag": "✨ Premium",
        "thumbnail_url": "/tiles/mytyles_calacatta_gold.png"
    },
    {
        "id": "mytyles_nero_marquina",
        "name": "MyTyles Nero Marquina Midnight",
        "category": "marble",
        "material": "Digital Glazed Vitrified",
        "finish": "Polished Mirror Black",
        "color_tone": "Deep Obsidian Black & Crisp White",
        "description": "Spanish black marble aesthetic from MyTyles with sharp, lightning-style crystalline white fracture veins.",
        "default_scale": 1.0,
        "aspect_ratio": "square",
        "roughness": 0.10,
        "specular": 0.90,
        "grout_default_color": "#334155",
        "grout_default_width": 2,
        "accent_color": "#64748B",
        "tag": "🖤 Luxury Black",
        "thumbnail_url": "/tiles/mytyles_nero_marquina.png"
    },
    {
        "id": "mytyles_rustic_oak_wood",
        "name": "MyTyles Golden Oak Plank",
        "category": "wood",
        "material": "Matte Porcelain Wood Strip",
        "finish": "Textured Natural Woodgrain",
        "color_tone": "Warm Golden Honey Oak",
        "description": "Natural European Oak wood-look tile from MyTyles with authentic wood knots and anti-skid tactile texture.",
        "default_scale": 1.2,
        "aspect_ratio": "plank",
        "roughness": 0.70,
        "specular": 0.20,
        "grout_default_color": "#92400E",
        "grout_default_width": 1,
        "accent_color": "#B45309",
        "tag": "🌲 Natural Wood",
        "thumbnail_url": "/tiles/mytyles_rustic_oak_wood.png"
    },
    {
        "id": "mytyles_walnut_herringbone",
        "name": "MyTyles American Walnut Chevron",
        "category": "wood",
        "material": "Full Body Vitrified",
        "finish": "Matte Anti-Skid Finish",
        "color_tone": "Dark Roasted Mocha Brown",
        "description": "Rich American Walnut parquet plank from MyTyles engineered for elegant French chevron and herringbone layouts.",
        "default_scale": 1.1,
        "aspect_ratio": "pattern",
        "roughness": 0.65,
        "specular": 0.25,
        "grout_default_color": "#451A03",
        "grout_default_width": 1,
        "accent_color": "#78350F",
        "tag": "🥖 Classic French",
        "thumbnail_url": "/tiles/mytyles_walnut_herringbone.png"
    },
    {
        "id": "mytyles_nordic_ash_wood",
        "name": "MyTyles Nordic Sand Birch",
        "category": "wood",
        "material": "Glazed Ceramic Plank",
        "finish": "Satin Soft Touch",
        "color_tone": "Pale Sand & Blonde Timber",
        "description": "Japandi-inspired minimalist light ash plank from MyTyles with fine linear grain for serene modern rooms.",
        "default_scale": 1.15,
        "aspect_ratio": "plank",
        "roughness": 0.50,
        "specular": 0.30,
        "grout_default_color": "#D6D3D1",
        "grout_default_width": 1,
        "accent_color": "#A8A29E",
        "tag": "🌿 Japandi",
        "thumbnail_url": "/tiles/mytyles_nordic_ash_wood.png"
    },
    {
        "id": "mytyles_emerald_subway",
        "name": "MyTyles Emerald Green Beveled Subway",
        "category": "ceramic",
        "material": "Glazed Artisan Ceramic",
        "finish": "Glossy Handmade Wavy Glaze",
        "color_tone": "Deep Jewel Emerald Green",
        "description": "Handcrafted-style 3x6 inch metro subway tile from MyTyles featuring rich jewel-toned emerald glaze with beveled edges.",
        "default_scale": 0.9,
        "aspect_ratio": "brick",
        "roughness": 0.20,
        "specular": 0.85,
        "grout_default_color": "#064E3B",
        "grout_default_width": 2,
        "accent_color": "#059669",
        "tag": "💎 Designer Subway",
        "thumbnail_url": "/tiles/mytyles_emerald_subway.png"
    },
    {
        "id": "mytyles_arctic_white_subway",
        "name": "MyTyles Arctic White Metro Subway",
        "category": "ceramic",
        "material": "Monocottura Ceramic",
        "finish": "High Gloss Glaze",
        "color_tone": "Pure Bright White",
        "description": "Timeless clean white subway tile from MyTyles, perfect for kitchen backsplashes, shower walls, and contemporary accents.",
        "default_scale": 0.85,
        "aspect_ratio": "brick",
        "roughness": 0.15,
        "specular": 0.85,
        "grout_default_color": "#CBD5E1",
        "grout_default_width": 2,
        "accent_color": "#94A3B8",
        "tag": "🤍 Clean Classic",
        "thumbnail_url": "/tiles/mytyles_arctic_white_subway.png"
    },
    {
        "id": "mytyles_terracotta_hexagon",
        "name": "MyTyles Tuscan Baked Cotto Hexagon",
        "category": "ceramic",
        "material": "Unglazed Extruded Clay",
        "finish": "Matte Earthy Cleft",
        "color_tone": "Warm Terracotta Burnt Orange",
        "description": "Rustic Italian-style hexagonal terracotta tile from MyTyles made from fired clay for warm organic kitchens & patios.",
        "default_scale": 0.95,
        "aspect_ratio": "hexagon",
        "roughness": 0.80,
        "specular": 0.15,
        "grout_default_color": "#78350F",
        "grout_default_width": 3,
        "accent_color": "#EA580C",
        "tag": "🏺 Rustic Tuscan",
        "thumbnail_url": "/tiles/mytyles_terracotta_hexagon.png"
    },
    {
        "id": "mytyles_moroccan_zellige",
        "name": "MyTyles Marrakech Cobalt Encaustic",
        "category": "mosaic",
        "material": "Handcrafted Cement Encaustic",
        "finish": "Matte Satin Silky Touch",
        "color_tone": "Royal Indigo & Antique Chalk",
        "description": "Traditional North African Moroccan geometric star pattern from MyTyles with artisanal symmetry and bold indigo hues.",
        "default_scale": 0.9,
        "aspect_ratio": "pattern",
        "roughness": 0.50,
        "specular": 0.40,
        "grout_default_color": "#94A3B8",
        "grout_default_width": 2,
        "accent_color": "#4338CA",
        "tag": "🕌 Moroccan Art",
        "thumbnail_url": "/tiles/mytyles_moroccan_zellige.png"
    },
    {
        "id": "mytyles_venetian_terrazzo",
        "name": "MyTyles Venetian Pastel Confetti Terrazzo",
        "category": "stone",
        "material": "Honed Engineered Terrazzo",
        "finish": "Smooth Matte Honed",
        "color_tone": "Ivory Base with Pastel Quartz Chips",
        "description": "Authentic Venetian Terrazzo from MyTyles featuring embedded marble, quartz, and river stone chips in an ivory matrix.",
        "default_scale": 1.0,
        "aspect_ratio": "square",
        "roughness": 0.40,
        "specular": 0.50,
        "grout_default_color": "#E2E8F0",
        "grout_default_width": 1,
        "accent_color": "#EC4899",
        "tag": "🎨 Italian Terrazzo",
        "thumbnail_url": "/tiles/mytyles_venetian_terrazzo.png"
    },
    {
        "id": "mytyles_charcoal_slate",
        "name": "MyTyles Anthracite Natural Cleft Slate",
        "category": "stone",
        "material": "Natural Metamorphic Slate",
        "finish": "Riven 3D Textured Surface",
        "color_tone": "Charcoal Black & Mineral Grey",
        "description": "Rugged slate tile from MyTyles with natural layered cleft texture and subtle quartz mineral highlights.",
        "default_scale": 1.1,
        "aspect_ratio": "square",
        "roughness": 0.85,
        "specular": 0.15,
        "grout_default_color": "#1E293B",
        "grout_default_width": 2,
        "accent_color": "#475569",
        "tag": "🪨 Natural Stone",
        "thumbnail_url": "/tiles/mytyles_charcoal_slate.png"
    },
    {
        "id": "mytyles_roman_travertine",
        "name": "MyTyles Roman Beige Vein Travertine",
        "category": "stone",
        "material": "Cross-Cut Limestone",
        "finish": "Filled & Honed Matte",
        "color_tone": "Warm Almond & Cream Striae",
        "description": "Classic Roman Travertine from MyTyles with horizontal sedimentary banding and soft velvety limestone texture.",
        "default_scale": 1.05,
        "aspect_ratio": "square",
        "roughness": 0.55,
        "specular": 0.35,
        "grout_default_color": "#E7E5E4",
        "grout_default_width": 2,
        "accent_color": "#D97706",
        "tag": "🏛️ Roman Heritage",
        "thumbnail_url": "/tiles/mytyles_roman_travertine.png"
    },
    {
        "id": "mytyles_art_deco_mosaic",
        "name": "MyTyles Art Deco Midnight Gold Fan",
        "category": "mosaic",
        "material": "Glass & Brass Inlay Mosaic",
        "finish": "Gloss Enamel with Metallic Gold",
        "color_tone": "Navy Blue & Burnished Brass",
        "description": "Gatsby-era scallop fan mosaic from MyTyles with glossy deep navy tiles bordered by metallic brass accents.",
        "default_scale": 0.85,
        "aspect_ratio": "pattern",
        "roughness": 0.25,
        "specular": 0.80,
        "grout_default_color": "#CA8A04",
        "grout_default_width": 2,
        "accent_color": "#EAB308",
        "tag": "🌟 Art Deco Luxe",
        "thumbnail_url": "/tiles/mytyles_art_deco_mosaic.png"
    },
    {
        "id": "mytyles_concrete_industrial",
        "name": "MyTyles Urban Loft Burnished Concrete",
        "category": "stone",
        "material": "High-Density Porcelain Slab",
        "finish": "Micro-Porous Satin Matte",
        "color_tone": "Architectural Steel Grey",
        "description": "Minimalist poured-concrete finish from MyTyles with cloud-like trowel marks and modern industrial aesthetic.",
        "default_scale": 1.3,
        "aspect_ratio": "square",
        "roughness": 0.60,
        "specular": 0.30,
        "grout_default_color": "#64748B",
        "grout_default_width": 1,
        "accent_color": "#64748B",
        "tag": "🏢 Industrial Loft",
        "thumbnail_url": "/tiles/mytyles_concrete_industrial.png"
    },
    {
        "id": "mytyles_andalusian_majolica",
        "name": "MyTyles Andalusian Vintage Floral",
        "category": "mosaic",
        "material": "Hand-Glazed Ceramic",
        "finish": "Traditional Silky Gloss Glaze",
        "color_tone": "Sun Yellow, Cobalt & Ochre",
        "description": "Heritage Mediterranean floral pattern from MyTyles with warm sun-drenched European hacienda charm.",
        "default_scale": 0.9,
        "aspect_ratio": "pattern",
        "roughness": 0.30,
        "specular": 0.60,
        "grout_default_color": "#CBD5E1",
        "grout_default_width": 2,
        "accent_color": "#E11D48",
        "tag": "🌻 Andalusian Vintage",
        "thumbnail_url": "/tiles/mytyles_andalusian_majolica.png"
    }
]

ID_ALIASES = {
    "carrara_white_marble": "mytyles_carrara_marble",
    "calacatta_gold_marble": "mytyles_calacatta_gold",
    "nero_marquina_black": "mytyles_nero_marquina",
    "rustic_oak_wood_plank": "mytyles_rustic_oak_wood",
    "dark_walnut_herringbone": "mytyles_walnut_herringbone",
    "scandinavian_light_ash": "mytyles_nordic_ash_wood",
    "emerald_subway_ceramic": "mytyles_emerald_subway",
    "white_gloss_subway": "mytyles_arctic_white_subway",
    "terracotta_cottage_hex": "mytyles_terracotta_hexagon",
    "moroccan_geometric_mosaic": "mytyles_moroccan_zellige",
    "venetian_terrazzo_multi": "mytyles_venetian_terrazzo",
    "anthracite_slate_stone": "mytyles_charcoal_slate",
    "travertine_beige_stone": "mytyles_roman_travertine",
    "art_deco_navy_gold_fan": "mytyles_art_deco_mosaic",
    "grey_concrete_industrial": "mytyles_concrete_industrial",
    "spanish_andalusian_floral": "mytyles_andalusian_majolica",
}

def generate_tile_texture(tile_id: str, size: int = 512) -> Image.Image:
    resolved_id = ID_ALIASES.get(tile_id, tile_id)

    for candidate_dir in [TILES_DATA_DIR, FRONTEND_TILES_DIR]:
        path = candidate_dir / f"{resolved_id}.png"
        if path.exists():
            try:
                img = Image.open(path).convert("RGB")
                if img.size != (size, size):
                    img = img.resize((size, size), Image.Resampling.LANCZOS)
                return img
            except Exception:
                pass

    base = np.full((size, size, 3), [235, 235, 235], dtype=np.uint8)
    img = Image.fromarray(base)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, size-1, size-1], outline=(180, 180, 180), width=2)
    return img

def ensure_all_tile_textures(output_dirs: List[Path]):
    for out_dir in output_dirs:
        out_dir.mkdir(parents=True, exist_ok=True)
        for item in TILE_CATALOG:
            tile_id = item["id"]
            target_path = out_dir / f"{tile_id}.png"
            if not target_path.exists():
                img = generate_tile_texture(tile_id, size=512)
                img.save(target_path, "PNG", optimize=True)

def get_tile_by_id(tile_id: str) -> Optional[Dict[str, Any]]:
    resolved_id = ID_ALIASES.get(tile_id, tile_id)
    for item in TILE_CATALOG:
        if item["id"] == resolved_id or item["id"] == tile_id:
            return item
    return None
