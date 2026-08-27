from typing import Dict, Any, List, Optional

STYLE_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "japandi_minimalist",
        "name": "Scandinavian Japandi",
        "category": "Minimalist",
        "badge": "🌿 Japandi",
        "description": "Blonde Nordic oak timber, warm off-white linen textures, bonsai accents, and soft morning daylight.",
        "thumbnail_url": "/samples/living_room.jpg",
        "prompt_keywords": "Scandinavian Japandi interior, pale blonde oak wood plank floor, clean minimalist architectural lines, beige linen sofa, serene warm natural sunlight, neutral earth tones, wabi-sabi elegance, 8k architectural photography, cinematic lighting, sharp ambient shadows",
        "lighting_style": "Soft warm morning diffuse daylight",
        "accent_color": "#10B981",
    },
    {
        "id": "italian_carrara_villa",
        "name": "Italian Carrara Luxury Villa",
        "category": "Luxury",
        "badge": "🏛️ Royal Villa",
        "description": "High-gloss Statuario Carrara white marble, fluted brass accents, Italian leather furniture, and floor-to-ceiling garden views.",
        "thumbnail_url": "/samples/bathroom.jpg",
        "prompt_keywords": "Italian luxury villa interior, pristine polished Statuario Carrara white marble flooring with fine grey veining, brushed gold brass fixtures, contemporary Italian designer furniture, panoramic glass windows, high gloss specular reflections, photorealistic 8k, raytraced lighting",
        "lighting_style": "Bright noon sun with crystal clear specular highlights",
        "accent_color": "#F59E0B",
    },
    {
        "id": "manhattan_loft",
        "name": "Manhattan Industrial Loft",
        "category": "Industrial",
        "badge": "🏢 Soho Loft",
        "description": "Exposed warm red brick walls, burnished concrete, distressed walnut flooring, and matte black steel fixtures.",
        "thumbnail_url": "/samples/kitchen.jpg",
        "prompt_keywords": "Manhattan Tribeca industrial loft interior, distressed dark walnut plank floor, authentic exposed weathered red brick walls, architectural matte black steel frame windows, Edison pendant lights, cozy rich atmosphere, photorealistic interior photography, volumetric lighting",
        "lighting_style": "Warm amber Edison incandescent lighting",
        "accent_color": "#EF4444",
    },
    {
        "id": "mediterranean_coastal",
        "name": "Mediterranean Coastal Villa",
        "category": "Coastal",
        "badge": "🏺 Tuscan Coast",
        "description": "Fired Tuscan terracotta tiles, whitewashed lime stucco walls, woven rattan decor, and azure sea breezes.",
        "thumbnail_url": "/samples/dining_room.jpg",
        "prompt_keywords": "Mediterranean coastal villa interior, authentic rustic burnt-orange terracotta tile flooring, smooth whitewashed plaster walls, natural woven rattan furniture, airy linen curtains, gentle sea breeze sunlight, luxury resort aesthetic, hyper-detailed, 8k",
        "lighting_style": "Dappled Mediterranean sunbeams",
        "accent_color": "#EA580C",
    },
    {
        "id": "parisian_haussmann",
        "name": "Parisian Haussmannian Classic",
        "category": "Classical",
        "badge": "🥖 Haussmann",
        "description": "French herringbone parquet flooring, ornate carved crown moldings, gilded mirrors, and marble fireplaces.",
        "thumbnail_url": "/samples/bedroom.jpg",
        "prompt_keywords": "Classic Parisian Haussmannian luxury apartment, honey golden oak French chevron parquet flooring, intricate classic white wall moldings and boiserie, tall French balcony doors, gilded vintage accents, romantic sophisticated interior, 8k masterpiece",
        "lighting_style": "Romantic soft Parisian daylight",
        "accent_color": "#8B5CF6",
    },
    {
        "id": "midnight_modern_luxe",
        "name": "Midnight Modern Penthouse",
        "category": "Luxury",
        "badge": "🖤 Dark Luxe",
        "description": "Nero Marquina black marble with white lightning veining, dark smoked oak, and recessed warm LED downlights.",
        "thumbnail_url": "/samples/office.jpg",
        "prompt_keywords": "Ultra-modern dark luxury penthouse interior, polished Nero Marquina black marble flooring with lightning white veins, smoked dark walnut paneling, recessed warm bronze LED strip lighting, charcoal velvet sofa, moody cinematic interior photography, 8k",
        "lighting_style": "Moody ambient architectural spotlighting",
        "accent_color": "#6366F1",
    },
    {
        "id": "tropical_modern_resort",
        "name": "Balinese Tropical Modern",
        "category": "Organic",
        "badge": "🌴 Bali Modern",
        "description": "Seamless burnished terrazzo flooring, indoor tropical palms, slatted teak wood, and natural courtyard skylights.",
        "thumbnail_url": "/samples/living_room.jpg",
        "prompt_keywords": "Balinese tropical modern sanctuary interior, seamless cream polished terrazzo floor, slatted teak timber walls, lush indoor monstera and palm garden, open skylight with sunbeams, organic serene minimalism, luxury architectural digest, 8k",
        "lighting_style": "Lush tropical skylight sun rays",
        "accent_color": "#059669",
    },
    {
        "id": "art_deco_emerald_luxe",
        "name": "Art Deco Emerald & Gold",
        "category": "Artisan",
        "badge": "💎 Art Deco",
        "description": "Glossy jewel emerald ceramic subway tiles, brass fan inlays, velvet seating, and Gatsby-era glamour.",
        "thumbnail_url": "/samples/bathroom.jpg",
        "prompt_keywords": "Art deco luxury interior, glossy rich emerald green ceramic tile walls, geometric brass inlay marble floor, vintage velvet furnishings, Gatsby glamour, intricate luxury craftsmanship, crisp reflections, photorealistic 8k architectural render",
        "lighting_style": "Gleaming warm chandelier glow",
        "accent_color": "#EC4899",
    },
]

DEFAULT_NEGATIVE_PROMPT = (
    "blurry, distorted, low quality, artifacts, pixelated, cartoon, 3d render plastic, "
    "deformed furniture, extra limbs, watermark, text, signature, bad perspective, unrealistic geometry"
)

PHOTOREAL_SUFFIX = (
    ", architectural digest photograph, highly detailed, interior design magazine, "
    "8k resolution, photorealistic, natural lighting, sharp focus, raytraced reflections"
)

class PromptArchitect:
    """
    Intelligent Architectural Prompt Builder for Generative Diffusion.
    Constructs high-adherence positive and negative prompt ensembles tailored for interior spaces.
    """

    def get_style_by_id(self, preset_id: str) -> Dict[str, Any]:
        for preset in STYLE_PRESETS:
            if preset["id"] == preset_id:
                return preset
        return STYLE_PRESETS[0]

    def build_prompt(
        self,
        style_preset_id: str,
        custom_prompt: Optional[str] = None,
        negative_prompt: Optional[str] = None,
    ) -> Dict[str, str]:
        preset = self.get_style_by_id(style_preset_id)

        if custom_prompt and custom_prompt.strip():
            positive = f"{custom_prompt.strip()}, {preset['prompt_keywords']}{PHOTOREAL_SUFFIX}"
        else:
            positive = f"{preset['prompt_keywords']}{PHOTOREAL_SUFFIX}"

        if negative_prompt and negative_prompt.strip():
            negative = f"{negative_prompt.strip()}, {DEFAULT_NEGATIVE_PROMPT}"
        else:
            negative = DEFAULT_NEGATIVE_PROMPT

        return {
            "positive_prompt": positive,
            "negative_prompt": negative,
            "style_name": preset["name"],
        }

prompt_architect = PromptArchitect()
