import os
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import numpy as np
import pandas as pd
import tensorflow as tf

# TensorFlow patch
if not hasattr(tf.compat.v1, 'estimator'):
    class DummyEstimator:
        class Exporter:
            pass
    tf.compat.v1.estimator = DummyEstimator()

import tensorflowjs as tfjs
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

LANDMARK_CSV = 'landmark_data.csv'
MODEL_SAVE_PATH = 'model/landmark_model.h5'
TFJS_SAVE_PATH = '../frontend/public/tfjs_model'

def main():
    print("Landmark ma'lumotlari yuklanmoqda...")
    df = pd.read_csv(LANDMARK_CSV)
    print(f"Jami {len(df)} ta yozuv topildi")
    
    X = df.iloc[:, :63].values.astype(np.float32)
    y = df['label'].values
    
    num_classes = len(np.unique(y))
    print(f"Sinflar soni: {num_classes}")
    
    # Normalize: har bir qo'l uchun landmark koordinatlarini [0,1] ga normallashtirish
    # Wrist nuqtasiga nisbatan normalizatsiya
    def normalize_landmarks(X):
        X_norm = X.copy()
        for i in range(len(X)):
            row = X[i].reshape(21, 3)
            # Wrist (0) dan eng uzoq nuqtaga masofa (scale)
            wrist = row[0]
            max_dist = max(np.linalg.norm(row[j] - wrist) for j in range(1, 21)) + 1e-6
            row = (row - wrist) / max_dist
            X_norm[i] = row.flatten()
        return X_norm
    
    print("Normalizatsiya qilinmoqda...")
    X = normalize_landmarks(X)
    
    y_cat = tf.keras.utils.to_categorical(y, num_classes)
    X_train, X_val, y_train, y_val = train_test_split(X, y_cat, test_size=0.15, random_state=42)
    
    print(f"Train: {len(X_train)}, Val: {len(X_val)}")
    
    # Kichik ammo kuchli MLP model
    model = models.Sequential([
        layers.Input(shape=(63,)),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
    ]
    
    print("\nO'qitish boshlandi...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )
    
    val_acc = max(history.history['val_accuracy'])
    print(f"\nEng yuqori Val aniqlik: {val_acc*100:.2f}%")
    
    os.makedirs('model', exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"Model saqlandi: {MODEL_SAVE_PATH}")
    
    print("\nTFJS formatiga o'tkazilmoqda...")
    os.makedirs(TFJS_SAVE_PATH, exist_ok=True)
    tfjs.converters.save_keras_model(model, TFJS_SAVE_PATH)
    print(f"TFJS Model saqlandi: {TFJS_SAVE_PATH}")
    print("\nBarcha ishlar tugadi!")

if __name__ == '__main__':
    main()
