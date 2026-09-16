# HandSpeak

HandSpeak is an advanced, real-time Sign Language Translator powered by Machine Learning. It runs entirely on the Edge (in your browser) using TensorFlow.js and MediaPipe, ensuring maximum privacy, zero server latency, and high accuracy.

## 🚀 Features

- **Real-Time Translation**: Detects and translates ASL/Sign Language alphabets instantly through your webcam.
- **Privacy-First (Edge Computing)**: All video processing and model inference happen locally on your device. No video data is sent to external servers.
- **Premium UI/UX**: Designed with modern Glassmorphism, smooth animations, and a sleek dark theme.
- **Responsive & TMA Ready**: Fully responsive and can be easily deployed as a Telegram Mini App.
- **Heuristic False-Positive Filtering**: Smart mathematical filters prevent open hands from being falsely detected as the letter 'B'.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS (Custom Glassmorphism).
- **Computer Vision & Models**: TensorFlow.js, MediaPipe Hands.
- **Backend (Model Training)**: Python, TensorFlow/Keras, Pandas, OpenCV.

## 📁 Project Structure

- `/frontend` - The React web application.
- `/backend` - Python scripts for dataset processing and model training.

## 🚦 Getting Started

### 1. Running the Web Application (Frontend)

The frontend is fully self-contained and already includes the pre-trained model (`public/tfjs_model`).

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2. Training a Custom Model (Backend)

If you want to train the model on a new language (e.g., Uzbek Sign Language) or add new gestures:

1. Create a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Extract Landmarks from your Dataset:
   Place your images in `backend/dataset/` and run:
   ```bash
   python extract_landmarks.py
   ```

4. Train the Model and Export to TFJS:
   ```bash
   python train_landmark_model.py
   ```
   *The new model will be automatically saved to `../frontend/public/tfjs_model`.*

## 🌍 Deployment

You can deploy the `/frontend` directory to any static hosting provider like **Vercel**, **Netlify**, or **Cloudflare Pages**. No server is required!
