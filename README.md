# [CLIP Crop](https://samuelmdlow.github.io/CLIP-crop/)

Uses `Xenova/siglip-base-patch16-224` CLIP model with `transformers.js` to recursively subdivide an image in search of a cropping with high similarity to a text prompt. Created to research CLIP.

One thing I found through this experiment is that this particular CLIP model was very sensative to the presence of the "Image of " prefix. The results were very poor without it.

## Example
![Example image](https://github.com/SamuelmdLow/CLIP-crop/blob/main/photos/example.png?raw=true)

