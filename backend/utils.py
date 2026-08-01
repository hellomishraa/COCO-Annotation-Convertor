import base64
import cv2
import numpy as np
import requests

def array_encode(np_array):
    success, encoded_img = cv2.imencode('.png', np_array)
    if not success:
        raise ValueError("Could not encode image")
    return base64.b64encode(encoded_img).decode('utf-8')

def get_image_dimensions_from_url(url):
    try:
        response = requests.get(url, timeout=5)
        img_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_UNCHANGED)
        return (img.shape[1], img.shape[0]) if img is not None else None
    except:
        return None

def get_mask_center(mask):
    moments = cv2.moments(mask)
    if moments["m00"] == 0:
        return None
    cx = int(moments["m10"] / moments["m00"])
    cy = int(moments["m01"] / moments["m00"])
    return {"x": cx, "y": cy}

def compress_large_image(img, h=2160, w=3840):
    """
    Compresses a local image file if it exceeds given dimensions and saves it.
    Args:
        image : numpy.ndarray: The image to be compressed.
        h (int): Max height allowed.
        w (int): Max width allowed.
    Returns:
        np.ndarray: The compressed image.
    """
    try:
        if img is None:
            raise ValueError(f"Image is None. Please provide a valid image.")

        height, width = img.shape[:2]

        # Compress if image exceeds bounds
        if width > w or height > h:
            # Calculate scaling factors for both dimensions
            width_scale = w / width
            height_scale = h / height

            # Use the smaller scale to ensure both dimensions fit
            scale = min(width_scale, height_scale)

            new_width = int(width * scale)
            new_height = int(height * scale)

            # Ensure even dimensions (required for some video codecs)
            new_width -= new_width % 2
            new_height -= new_height % 2

            img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
            return img
        
        return img
        
    except Exception as e:
        return f"❌ Error: {str(e)}"