import Replicate from "replicate";

let _replicate;
function replicate() {
  if (!_replicate) {
    _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  }
  return _replicate;
}

export const MODELS = {
  schnell: "black-forest-labs/flux-schnell",
  dev: "black-forest-labs/flux-dev",
  upscale: "nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94126809164e684b54e23b5c3d4aa7b4b0",
  edit: "black-forest-labs/flux-kontext-dev",
};

const STYLE_PREFIXES = {
  none: "",
  photorealistic: "photorealistic, highly detailed photograph, natural lighting, ",
  cinematic: "cinematic still, dramatic lighting, film grain, shallow depth of field, ",
  illustration: "digital illustration, clean lines, vibrant colors, ",
  watercolor: "watercolor painting, soft washes, organic textures, ",
  "oil-painting": "oil painting, rich textures, visible brushstrokes, classical style, ",
  anime: "anime style, cel shading, vibrant colors, ",
  "3d-render": "3D render, octane render, smooth surfaces, studio lighting, ",
  "pixel-art": "pixel art, retro game style, 8-bit aesthetic, ",
  sketch: "pencil sketch, hand-drawn, graphite on paper, detailed linework, ",
  minimal: "minimalist design, clean composition, simple forms, ",
};

export function buildFluxInput(modelKey, body) {
  const {
    prompt,
    negative_prompt = "",
    aspect_ratio = "1:1",
    style = "none",
    seed,
  } = body;

  const prefix = STYLE_PREFIXES[style] || "";
  const finalPrompt = prefix ? `${prefix}${prompt}` : prompt;

  const base = {
    prompt: finalPrompt,
    aspect_ratio,
    output_format: "webp",
    output_quality: 90,
    num_outputs: 1,
    disable_safety_checker: true,
  };

  if (negative_prompt) {
    base.negative_prompt = negative_prompt;
  }

  if (seed != null && seed > 0) {
    base.seed = seed;
  }

  if (modelKey === "dev") {
    base.guidance = body.guidance || 3.5;
    base.num_inference_steps = body.steps || 28;
  }

  return base;
}

export async function createPrediction(modelKey, input) {
  const model = MODELS[modelKey];
  if (!model) throw new Error("unknown_model");
  return replicate().predictions.create({
    model,
    input,
  });
}

export async function getPrediction(id) {
  return replicate().predictions.get(id);
}

export async function createUpscalePrediction(imageUrl) {
  return replicate().predictions.create({
    model: MODELS.upscale,
    input: {
      image: imageUrl,
      scale: 2,
      face_enhance: false,
    },
  });
}

export async function createEditPrediction(imageBlob, prompt, aspectRatio = "1:1") {
  return replicate().predictions.create({
    model: MODELS.edit,
    input: {
      prompt,
      input_image: imageBlob,
      aspect_ratio: aspectRatio,
      output_format: "webp",
      output_quality: 90,
    },
  });
}
