<script>
    import { clipcrop_step, process_input_for_clipcrop } from "$lib/clipcrop.js";

    let image_url = $state('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg');
    let text = $state('Face');
    let canvas;

    function loadImage(image_url) {
        const image = new Image(); // Using optional size for image
        image.onload = drawImageActualSize; // Draw when image has loaded
        image.src = image_url;

        function drawImageActualSize() {
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(this, 0, 0);
            ctx.drawImage(this, 0, 0, this.width, this.height);
        }
        return image;
    }

    async function run() {
        const imageElem = loadImage(image_url);
        const ctx = canvas.getContext("2d");
        let {text_embed, image} = await process_input_for_clipcrop(text, image_url);
        
        let current_crop = [0, 0, image.width-1, image.height-1];

        function drawcrop() {
            ctx.fillStyle = "#0002";
            ctx.fillRect(0, 0, image.width, image.height);
            ctx.drawImage(imageElem, current_crop[0], current_crop[1], current_crop[2]-current_crop[0], current_crop[3]-current_crop[1], current_crop[0], current_crop[1], current_crop[2]-current_crop[0], current_crop[3]-current_crop[1]);
            ctx.beginPath();
            ctx.rect(current_crop[0], current_crop[1], current_crop[2]-current_crop[0], current_crop[3]-current_crop[1]);
            ctx.stroke();            
        }

        function step() {
            clipcrop_step(text_embed, image, current_crop).then(result => {
                const {crop, cropped_image, i} = result;
                current_crop = crop;
                if (i==0) {
                    ctx.strokeStyle = "green";                    
                } else {
                    ctx.strokeStyle = "red";
                }
                drawcrop()
                if (i != 0) {
                    requestAnimationFrame(step);
                }
            })
        }
        step();
    }

    $effect(() => {
        loadImage(image_url);
    })

</script>

<div class="container">
    <h1>CLIP Crop</h1>
    <canvas bind:this={canvas}></canvas>
    <div class="console">
        <label>Image <input type="text" bind:value={image_url} /></label>
        <label>Text <input type="text" bind:value={text} /></label>
        <button onclick={(e) => run()}>Run</button>
    </div>
</div>

<style>
    .container {
        margin: auto;
        max-width: 800px;
        text-align: center;
        font-family: sans-serif;
    }
    .console {
        margin: 1em;
    }
    canvas {
        width: 100%;
        height: auto;
    }
</style>