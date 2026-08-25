export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const SAMPLE_PROMPTS = [
  "person",
  "face",
  "car",
  "sunglasses",
  "dog",
  "shoes",
  "laptop",
  "chair",
  "backpack"
];

export const CLICK_MODES = {
  POSITIVE: 1,
  NEGATIVE: 0,
};
