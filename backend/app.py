import numpy as np
import cv2
import base64
import tempfile, json, io

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from processor import load_categories, run_processing, load_json
from utils import compress_large_image
from pycocotools.coco import COCO
from datetime import datetime, timezone

app = Flask(__name__)
# CORS(app, resources={r"": {"origins": "", "supports_credentials": True}})
CORS(app, origins="*")  # Allow all origins


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "success": True,
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200


@app.route('/get-categories', methods=['POST'])
def get_categories():
    file = request.files['file']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
        file.save(tmp.name)
        categories = load_categories(tmp.name)
        return jsonify(categories)


@app.route('/process', methods=['POST'])
def process():
    file = request.files['file']
    categories = request.form.getlist('categories[]')
    url_map = json.loads(request.form.get("filename_to_url"))

    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
        file.save(tmp.name)
        result = run_processing(tmp.name, categories, url_map)

        buffer = io.BytesIO()
        buffer.write(json.dumps(result['output'], indent=2).encode())
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name="converted_annotations.json")


@app.route('/preview-masks', methods=['POST'])
def preview_masks():
    try:
        file = request.files['file']
        with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
            file.save(tmp.name)
            coco_data = load_json(tmp.name)
            coco = COCO(tmp.name)

            id_to_cat = {cat['id']: cat['name'] for cat in coco_data['categories']}
            results = {}

            for img in coco_data['images']:
                image_id = img['id']
                ann_ids = coco.getAnnIds(imgIds=image_id)
                masks = []
                for ann_id in ann_ids:
                    ann = coco.loadAnns(ann_id)[0]
                    mask = coco.annToMask(ann)
                    mask = (mask * 255).astype(np.uint8)
                    _, buffer = cv2.imencode('.png', mask)
                    b64 = base64.b64encode(buffer).decode()
                    masks.append(f"data:image/png;base64,{b64}")
                results[img['file_name']] = masks
            return jsonify(results)
    except Exception as e:
        print("Preview mask error:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route('/get-compressed-image', methods=['POST'])
def get_compressed_image():
    try:
        file = request.files['file']
        # Get original extension
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'png'
        mime_map = {
            'jpg': 'jpeg',
            'jpeg': 'jpeg',
            'png': 'png',
            'webp': 'webp',
            'bmp': 'bmp',
        }
        mime_ext = mime_map.get(ext, ext)
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            img = cv2.imread(tmp.name)
            
            compressed_img = compress_large_image(img)
            
            if isinstance(compressed_img, str):  # Check if an error message was returned
                print(f"Error from compress_large_image: {compressed_img}")
                return jsonify({"error": compressed_img}), 400
            
            # Encode to buffer and return as blob
            success, buffer = cv2.imencode(f'.{ext}', compressed_img)
            if not success:
                print(f"Failed to encode image with extension: {ext}")
                return jsonify({"error": f"Failed to encode image as {ext}"}), 400
            
            print("Successfully encoded, sending file...")
            buffer_io = io.BytesIO(buffer.tobytes())
            buffer_io.seek(0)
            return send_file(buffer_io, mimetype=f'image/{mime_ext}', as_attachment=True, download_name=f"compressed.{ext}")
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8085)