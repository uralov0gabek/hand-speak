import os
import csv
import cv2
import numpy as np

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# MediaPipe 1.0+ (Tasks API)
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

DATASET_PATH = 'dataset/asl_alphabet_train/asl_alphabet_train'
OUTPUT_CSV = 'landmark_data.csv'
SAMPLES_PER_CLASS = 300

# Model faylini yuklab olish
MODEL_PATH = 'hand_landmarker.task'
if not os.path.exists(MODEL_PATH):
    import urllib.request
    print("MediaPipe hand_landmarker.task yuklanmoqda...")
    urllib.request.urlretrieve(
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        MODEL_PATH
    )
    print("Yuklandi!")

base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
options = mp_vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=1,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3
)
detector = mp_vision.HandLandmarker.create_from_options(options)

def extract_landmarks(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    result = detector.detect(mp_image)
    if result.hand_landmarks:
        lm = result.hand_landmarks[0]
        row = []
        for point in lm:
            row.extend([point.x, point.y, point.z])
        return row
    return None

def main():
    classes = sorted(os.listdir(DATASET_PATH))
    print(f"Topilgan sinflar ({len(classes)} ta): {classes}")
    
    with open(OUTPUT_CSV, 'w', newline='') as f:
        writer = csv.writer(f)
        header = [f"lm_{i}" for i in range(63)] + ['label']
        writer.writerow(header)
        
        total = 0
        for label, cls in enumerate(classes):
            cls_path = os.path.join(DATASET_PATH, cls)
            images = os.listdir(cls_path)[:SAMPLES_PER_CLASS]
            found = 0
            for img_name in images:
                img_path = os.path.join(cls_path, img_name)
                landmarks = extract_landmarks(img_path)
                if landmarks:
                    writer.writerow(landmarks + [label])
                    found += 1
            print(f"  [{label:2d}] {cls}: {found} ta landmark olindi")
            total += found
        
        print(f"\nJami: {total} ta yozuv saqlandi -> {OUTPUT_CSV}")
    
    detector.close()

if __name__ == '__main__':
    main()
