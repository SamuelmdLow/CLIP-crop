import {
  AutoTokenizer,
  SiglipTextModel,
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  dot,
  softmax,
  ModelRegistry
} from '@huggingface/transformers';

const model_id = 'Xenova/siglip-base-patch16-224';

let modelsPromise = null;

function loadModels() {
  const config =   {
    device: 'webgpu',
    dtype: 'q4'
  };

  //const dtypes = ModelRegistry.get_available_dtypes(model_id);
  //console.log(dtypes);

  if (!modelsPromise) {
    modelsPromise = (async () => {
      const tokenizer = await AutoTokenizer.from_pretrained(model_id, config);
      const text_model = await SiglipTextModel.from_pretrained(model_id, config);
      const processor = await AutoProcessor.from_pretrained(model_id, config);
      const vision_model = await CLIPVisionModelWithProjection.from_pretrained(model_id, config);
      return { tokenizer, text_model, processor, vision_model };
    })();
  }
  return modelsPromise;
}

const { tokenizer, text_model, processor, vision_model } = await loadModels();

export async function clipcrop_step(text_embed, image, crop) {
  const width = crop[2]-crop[0]+1;
  const height = crop[3]-crop[1]+1;
  console.log(String(width) + " " + String(height));

  if (width < 5 || height < 5) {
    const cropped_image = image.crop(crop);
    const i = 0;
    return { crop, cropped_image, i };
  }

  let candidate_crops = [
    [0,                   0,                    width-1,                      height-1],
    [Math.floor(width/4), 0,                    width-Math.floor(width/4)-1,  height-1],
    [0,                   Math.floor(height/4), width,                        height-Math.floor(height/4)-1],
    [0,                   0,                    width-1,                      Math.floor(height/2)],
    [0,                   Math.floor(height/2), width-1,                      height-1],
    [0,                   0,                    Math.floor(width/2),          height-1],
    [Math.floor(width/2), 0,                    width-1,                      height-1],
  ];

  candidate_crops = candidate_crops.map(candidate_crop => [
    crop[0] + candidate_crop[0],
    crop[1] + candidate_crop[1],
    Math.min(crop[2], crop[0] + candidate_crop[2]),
    Math.min(crop[3], crop[1] + candidate_crop[3])]);

  const candidates = await Promise.all(candidate_crops.map(async (candidate_crop) => await image.crop(candidate_crop)));

  const image_inputs = await processor(candidates);

  // Compute vision embeddings
  const { pooler_output } = await vision_model(image_inputs);
  const image_embeds = pooler_output;
  const normalized_image_embeds = image_embeds.normalize().tolist();

  // Compute probabilities
  const probabilities = normalized_image_embeds.map(x => dot(x, text_embed));
  console.log(probabilities);
  const i = probabilities.indexOf(Math.max(...probabilities));
  console.log(i);

  crop = candidate_crops[i].map((x, index) => Math.floor((x + candidate_crops[0][index])/2));
  //crop = candidate_crops[i];
  
  console.log(candidate_crops);

  console.log(crop);
  console.log(probabilities[i]);
  const cropped_image = await image.crop(crop);
  return { crop, cropped_image, i };
}

export async function clipcrop_recursive(text_embed, image) {
  let best = -1;
  let current_crop = [0, 0, image.width-1, image.height-1];
  while (best != 0) {
    let {crop, cropped_image, i} = await clipcrop_step(text_embed, image, current_crop);
    best = i;
    current_crop = crop;
    image = cropped_image;
  }
  const crop = current_crop;
  return {crop, image};
}

export async function process_input_for_clipcrop(text, image_url) {
  const text_inputs = tokenizer([text], { padding: 'max_length', truncation: true });
  const { pooler_output } = await text_model(text_inputs);
  const text_embeds = pooler_output;
  const normalized_text_embeds = text_embeds.normalize().tolist();

  // Read image
  const image = await RawImage.read(image_url);

  const text_embed = normalized_text_embeds[0];
  return {text_embed, image}
}

export async function clipcrop(text, image_url) {
  // Compute text embeddings
  const {text_embed, image} = await process_input_for_clipcrop(text, image_url);
  // Run CLIP crop
  return await clipcrop_recursive(text_embed, image);
}

