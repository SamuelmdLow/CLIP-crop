<script>
    import './layout.css';
    import { clipcrop_step, process_input_for_clipcrop } from "$lib/clipcrop.js";

    let image_url = $state('https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/NASA_HQ_Building.jpg/1280px-NASA_HQ_Building.jpg');
    let text = $state('a door.');
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
        let {text_embed, image} = await process_input_for_clipcrop("Photo of " + text, image_url);
        
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
        <div class="console-inputs">
            <label>Image <input type="text" bind:value={image_url} /></label>
            <button onclick={(e) => run()}>Run</button>
            <label>Photo of <input type="text" bind:value={text} /></label>
        </div>
    </div>
</div>

<style>
    .container {
        margin: auto;
        font-family: monospace;
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
    }
    h1 {
        text-align: center;
    }
    .console {
        padding: 2em 1.5em;
        border-radius: 1em 1em 0 0;
        background: var(--orange-1);
        position: sticky;
        bottom: 0;
        filter: drop-shadow(0 0 1em #888);
        margin-top: auto;
        border-left: 0.5em solid var(--orange-2);
        border-right: 0.5em solid var(--orange-2);
        border-top: 0.5em solid var(--orange-2);
    }
    .console-inputs {
        margin: auto;
        max-width: 350px;
    }
    canvas {
        width: 100%;
        height: auto;
        max-width: 800px;
        margin: auto;
    }
    input[type="text"], button {
        padding: 0.2em 0.5em;
        border-radius: 0.5em;
        background: #ccc;
        border: 1px solid #eee;
        font-size: 1em;
    }
    button {
        padding: 0.25em 0.75em;
        border-radius: 0.5em;
        background: #ccc;
        border: 1px solid #eee;
        font-size: 1em;
        cursor: pointer;
    }
    label {
        display: block;
        margin-block: 1em;
    }
    button {
        float: right;
    }
</style>