# VELOX - Interactive 3D E-Commerce Platform

**Live Demo:** [https://ganeshpavanm09-crypto.github.io/velox-shoe-website/](https://ganeshpavanm09-crypto.github.io/velox-shoe-website/)

## Overview
VELOX is a premium, high-performance e-commerce landing page that features a fully custom, scroll-driven 3D product animation. It was built from scratch without the use of heavy 3D frameworks (like Three.js or WebGL libraries) to maximize performance, demonstrating a deep understanding of browser rendering, the DOM, and the HTML5 Canvas API.

## 🚀 Features
* **Custom 3D Scroll Engine:** Synchronizes user scroll behavior with a 210-frame high-resolution image sequence.
* **Hardware Accelerated Rendering:** Uses the HTML5 Canvas API and `requestAnimationFrame` for buttery-smooth 60fps playback.
* **Dynamic Image Processing:** Real-time luminance thresholding and alpha-masking to seamlessly composite 3D assets onto complex CSS gradient backgrounds.
* **Glassmorphic UI:** Modern, responsive interface using custom CSS variables, flexbox, grid, and backdrop-filter techniques.
* **Zero Dependencies:** Built entirely with Vanilla JavaScript, HTML5, and CSS3 for absolute maximum loading speed.

## 🛠️ Technical Implementation
Instead of loading a bulky `.gltf` 3D model that requires a heavy JavaScript engine, this project uses an optimized **Image Sequence (Frame-by-Frame) Animation** technique. 

A custom JavaScript controller pre-loads 210 individual 4K frames. As the user scrolls, the script calculates the scroll percentage relative to the document height and maps it directly to the corresponding frame index. The `canvas.getContext('2d')` API is then used to rapidly paint the new frame to the screen, creating the illusion of 3D motion completely natively.

## 💻 Tech Stack
- **HTML5** (Semantic structure, Canvas API)
- **CSS3** (Custom properties, Flexbox/Grid, Animations)
- **Vanilla JavaScript** (ES6+, DOM Manipulation, Event Listeners)

## 📱 Responsive Design
The platform is fully responsive and optimized for all viewports (Mobile, Tablet, Desktop) with dynamic scaling algorithms that keep the 3D canvas perfectly centered without distorting the aspect ratio.
