// Animation Configuration
const frameCount = 210;
const framePath = index => `frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

// DOM Elements
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const scrollHint = document.getElementById('scroll-hint');

// Interactive Element DOMs
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
const quickShopModal = document.getElementById('quick-shop-modal');
const toastNotification = document.getElementById('toast-notification');
const toastMessage = document.getElementById('toast-message');
const dynamicTechText = document.getElementById('dynamic-tech-text');
const selectedSizeText = document.getElementById('selected-size-text');

// State Variables
const images = [];
let loadedCount = 0;
let cartCount = 2;
let selectedSize = 9.5;
let activeViewMode = 'SIDE';

// Easing & Rotation State
let targetFrameIndex = 1;
let currentFrameIndex = 1;
const ease = 0.08;

// Auto 360 Rotation State
let is360Autoplay = false;
let autoplayFrame = 1;

// Feature Specs Data mapping
const FEATURE_DATA = {
    'ultra-light': {
        title: "ULTRA-LIGHT CONSTRUCTION",
        spec: "WEIGHT: 180g | Dual-density AeroFoam™ midsole provides explosive energy return with zero added weight."
    },
    'breathable-knit': {
        title: "BREATHABLE KNIT TECHNOLOGY",
        spec: "VENTILATION: +45% | Single-layer high-tensile engineered mesh optimizes targeted airflow and dynamic support."
    },
    'premium-durability': {
        title: "PREMIUM DURABILITY",
        spec: "STABILITY: +60% | DuraCage™ external heel counter and high-traction carbon rubber pods for maximum longevity."
    },
    'sustainable-materials': {
        title: "SUSTAINABLE MATERIALS",
        spec: "RECYCLED: 85% | Handcrafted with Ocean-bound plastics and biodegradable plant-based foam elements."
    }
};

// Toast message handler
let toastTimeout = null;
function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastMessage.textContent = msg;
    toastNotification.classList.remove('hidden');
    toastNotification.style.transform = 'translateY(0)';
    
    toastTimeout = setTimeout(() => {
        toastNotification.classList.add('hidden');
    }, 3000);
}

// Global animation time tick
let tick = 0;

// Preload Images
function preloadImages() {
    return new Promise((resolve) => {
        // Pre-fill images array with nulls to safely populate asynchronously
        for (let i = 0; i < frameCount; i++) {
            images.push(null);
        }

        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            
            img.onload = () => {
                // Create an offscreen canvas to process the visual assets
                const transparentCanvas = document.createElement('canvas');
                const iw = img.naturalWidth;
                const ih = img.naturalHeight;
                transparentCanvas.width = iw;
                transparentCanvas.height = ih;
                const tempCtx = transparentCanvas.getContext('2d');
                
                // 1. Draw the raw JPEG frame
                tempCtx.drawImage(img, 0, 0);
                
                // 2. High-Quality Alpha Masking (No Defringing, Pure Edge)
                const imgData = tempCtx.getImageData(0, 0, iw, ih);
                const data = imgData.data;
                
                const bgThreshold = 45; // Increased to eat JPEG compression artifacts
                const edgeFeather = 25; // Smoother transition
                
                for (let j = 0; j < data.length; j += 4) {
                    const r = data[j];
                    const g = data[j+1];
                    const b = data[j+2];
                    
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    
                    if (luminance <= bgThreshold) {
                        data[j+3] = 0; // Pure background
                    } else if (luminance < bgThreshold + edgeFeather) {
                        const alphaRatio = (luminance - bgThreshold) / edgeFeather;
                        const smoothAlpha = alphaRatio * alphaRatio * (3 - 2 * alphaRatio); 
                        
                        data[j+3] = Math.round(smoothAlpha * 255);
                        // Do NOT modify RGB to prevent color shifting, white edges, or glow
                    }
                }
                tempCtx.putImageData(imgData, 0, 0);
                
                // Cache the processed canvas
                images[i - 1] = {
                    element: transparentCanvas,
                    complete: true,
                    naturalWidth: iw,
                    naturalHeight: ih
                };

                loadedCount++;
                const progress = Math.round((loadedCount / frameCount) * 100);
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${progress}%`;
                
                if (loadedCount === frameCount) {
                    resolve();
                }
            };
            
            img.onerror = () => {
                console.error(`Failed to load frame: ${framePath(i)}`);
                loadedCount++;
                if (loadedCount === frameCount) {
                    resolve();
                }
            };
            
            img.src = framePath(i);
        }
    });
}

// Draw Frame to Canvas (Contain Fit with Dynamic 3D Sway & Floating Drift)
function drawFrame(index) {
    const imgIndex = Math.max(0, Math.min(frameCount - 1, index - 1));
    const img = images[imgIndex];
    
    if (!img || !img.complete) return;
    
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    
    ctx.clearRect(0, 0, w, h);
    
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const r = Math.min(w / iw, h / ih);
    
    // Get page scroll fraction
    const scrollTop = window.scrollY;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = maxScrollTop <= 0 ? 0 : scrollTop / maxScrollTop;
    
    // Interpolation factor t (0 in Hero, 1 when scrolled 25% down the page)
    const t = Math.min(1, scrollFraction / 0.25);
    
    // Center point interpolation: w * 0.5 (center of full screen) to w * 0.72 (right details center)
    const targetCenterX = w * (0.5 + t * 0.22);
    const targetCenterY = h * (0.5 + t * 0.05);
    
    // Scale interpolation: 1.45 (huge in Hero) to 1.05 (fits stats cards on scroll)
    const targetScale = 1.45 - t * 0.40;
    
    // Update float tick
    tick += 0.005; // Smooth organic drift speed
    
    // Multi-axis floating drift (active in Hero, fades out in spec details sections)
    const activeFloatX = Math.sin(tick * 0.6) * (w * 0.12) * (1 - t);
    const activeFloatY = Math.cos(tick * 0.4) * (h * 0.08) * (1 - t);
    const activeDepth = 1.0 + Math.sin(tick * 0.25) * 0.06 * (1 - t); // Z-depth scale float
    
    const finalCenterX = targetCenterX + activeFloatX;
    const finalCenterY = targetCenterY + activeFloatY;
    const finalScale = targetScale * activeDepth;
    
    const nw = iw * r * finalScale;
    const nh = ih * r * finalScale;
    
    // Dynamic 3D tilt sways (Z-axis roll and simulated X-axis pitch squash)
    const tiltZ = Math.sin(tick * 0.35) * 0.08 * (1 - t); 
    const tiltX = Math.sin(tick * 0.2) * 0.06 * (1 - t);
    
    // Clear canvas entirely to let the CSS background show through seamlessly
    ctx.clearRect(0, 0, w, h);
    
    // Render the pre-processed canvas frame using GPU-accelerated matrix transforms
    ctx.save();
    ctx.translate(finalCenterX, finalCenterY);
    ctx.rotate(tiltZ);
    ctx.scale(1, 1 - tiltX);
    
    // Base Shoe Render
    ctx.drawImage(img.element, -nw / 2, -nh / 2, nw, nh);
    ctx.restore();
    
    // Apply a soft destination-out vignette exactly over the shoe's bounding box 
    // to guarantee all rectangular JPEG compression artifacts and dark borders are completely erased.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const featherMask = ctx.createRadialGradient(
        finalCenterX, finalCenterY, Math.min(nw, nh) * 0.35, 
        finalCenterX, finalCenterY, Math.max(nw, nh) * 0.55
    );
    featherMask.addColorStop(0, 'rgba(0, 0, 0, 0)');
    featherMask.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = featherMask;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

// Adjust Canvas Resolution to fill the entire browser viewport
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    drawFrame(Math.round(currentFrameIndex));
}

// Manage dynamic floating glassmorphic specs overlay cards
function updateOverlayCards(activeFeatureId, scrollFraction) {
    const cardSatisfaction = document.getElementById('overlay-card-satisfaction');
    const cardSales = document.getElementById('overlay-card-sales');
    const cardMidsole = document.getElementById('callout-card-midsole');
    const cardMesh = document.getElementById('callout-card-mesh');
    const cardStability = document.getElementById('callout-card-stability');
    const cardEco = document.getElementById('callout-card-eco');
    
    // Deactivate all tech callouts
    cardMidsole.classList.remove('show');
    cardMesh.classList.remove('show');
    cardStability.classList.remove('show');
    cardEco.classList.remove('show');
    
    // Sync General Stats visibility: Show in Hero (top) or Quality (bottom)
    if (scrollFraction < 0.15 || scrollFraction > 0.85) {
        cardSatisfaction.classList.add('show');
        cardSales.classList.add('show');
    } else {
        cardSatisfaction.classList.remove('show');
        cardSales.classList.remove('show');
    }
    
    // Activate correct card based on the active feature section
    if (activeFeatureId === 'ultra-light') {
        cardMidsole.classList.add('show');
    } else if (activeFeatureId === 'breathable-knit') {
        cardMesh.classList.add('show');
    } else if (activeFeatureId === 'premium-durability') {
        cardStability.classList.add('show');
    } else if (activeFeatureId === 'sustainable-materials') {
        cardEco.classList.add('show');
    }
}

// Sync visual canvas frames based on content scrolling
function handleScrollSync() {
    if (is360Autoplay) return;

    const scrollTop = window.scrollY;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = maxScrollTop <= 0 ? 0 : scrollTop / maxScrollTop;
    
    // Continuous float mapping to targetFrameIndex
    targetFrameIndex = scrollFraction * (frameCount - 1) + 1;
    
    // Scroll indicators visibility toggle
    if (scrollTop > 40) {
        scrollHint.classList.add('hidden');
    } else {
        scrollHint.classList.remove('hidden');
    }

    // Active Section Detection (for Link Highlight & Spec Sync)
    const sections = ['home', 'features', 'tech-specs', 'quality'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        
        if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
            document.querySelectorAll('.nav-item-floating').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });

    // Active Tech Detail Section Detection
    const detailSections = document.querySelectorAll('[data-feature-sync]');
    let activeFeatureId = null;
    
    detailSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.3) {
            activeFeatureId = section.getAttribute('data-feature-sync');
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    // Sync specs cards overlay visibility and left panel highlights
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        const featId = card.getAttribute('data-feature');
        if (featId === activeFeatureId) {
            card.classList.add('active');
            updateTechSpecText(featId);
        } else if (!activeFeatureId) {
            card.classList.remove('active');
        }
    });

    // Animate spatial glass overlay cards
    updateOverlayCards(activeFeatureId, scrollFraction);
}

// Update Dynamic Tech Spec Panel
function updateTechSpecText(featureId) {
    if (FEATURE_DATA[featureId]) {
        dynamicTechText.innerHTML = `<strong>${FEATURE_DATA[featureId].title}:</strong> ${FEATURE_DATA[featureId].spec}`;
    } else {
        dynamicTechText.textContent = "Hover or click any feature card to inspect next-generation footwear specifications.";
    }
}

// 360 Explore Spin sequence
function handleExplore360() {
    if (is360Autoplay) return;
    
    is360Autoplay = true;
    autoplayFrame = currentFrameIndex;
    showToast("Initializing 360° wireframe simulation...");
    
    // Fade out stats/callouts during 360 spin
    document.querySelectorAll('.glass-overlay-card').forEach(c => c.classList.remove('show'));
    
    const spinStep = 3;
    const targetFrames = frameCount; 
    let framesAnimated = 0;
    
    const interval = setInterval(() => {
        autoplayFrame += spinStep;
        if (autoplayFrame > frameCount) {
            autoplayFrame = 1;
        }
        
        currentFrameIndex = autoplayFrame;
        drawFrame(Math.round(currentFrameIndex));
        
        framesAnimated += spinStep;
        if (framesAnimated >= targetFrames) {
            clearInterval(interval);
            is360Autoplay = false;
            
            // Sync frame index back to scroll position smoothly
            handleScrollSync();
            showToast("Completed 360° structural analysis.");
        }
    }, 30);
}

// Size values synchronizer
function syncSelectedSize(size) {
    selectedSize = parseFloat(size);
    selectedSizeText.textContent = `US ${selectedSize} (MEN)`;
    
    // Sync quick shop size grid state
    const shopButtons = document.querySelectorAll('#size-selector-grid .size-btn');
    shopButtons.forEach(btn => {
        const btnVal = parseFloat(btn.textContent.replace('US ', ''));
        if (btnVal === selectedSize) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Sync page widget size buttons state
    const widgetButtons = document.querySelectorAll('.widget-size-btn');
    widgetButtons.forEach(btn => {
        const btnVal = parseFloat(btn.textContent);
        if (btnVal === selectedSize) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Set Viewer Schematic Mode controls
function setViewerMode(mode) {
    activeViewMode = mode;
    document.getElementById('schematic-view-text').textContent = mode;
    
    const modes = ['side', 'iso', 'top'];
    modes.forEach(m => {
        const btn = document.getElementById(`btn-mode-${m}`);
        if (btn) {
            if (m === mode.toLowerCase()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    showToast(`Adjusted schematic viewport to ${mode} mode.`);
    
    // Rotate visual to represent modes (approx frames)
    if (mode === 'SIDE') targetFrameIndex = 1;
    else if (mode === 'ISO') targetFrameIndex = 70;
    else if (mode === 'TOP') targetFrameIndex = 140;
}

// Setup Event Handlers
function setupEventListeners() {
    window.addEventListener('scroll', handleScrollSync, { passive: true });
    window.addEventListener('resize', resizeCanvas);

    // Safe event listener binder helper
    const bindClick = (id, callback) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', callback);
    };

    // Search overlay bindings
    bindClick('action-search', () => {
        searchOverlay.classList.remove('hidden');
        searchInput.focus();
    });
    bindClick('close-search', () => {
        searchOverlay.classList.add('hidden');
    });
    
    // Search tags clicks
    document.querySelectorAll('.search-tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (searchInput) searchInput.value = btn.textContent;
            showToast(`Searching for "${btn.textContent}"...`);
            setTimeout(() => {
                if (searchOverlay) searchOverlay.classList.add('hidden');
            }, 600);
        });
    });

    // Profile & Cart general icons
    bindClick('action-profile', () => {
        showToast("User profile portal offline in demo.");
    });
    bindClick('action-cart', () => {
        showToast("Shopping Cart details temporarily unavailable.");
    });

    // Quick shop modal bindings
    bindClick('cta-shop-collection', () => {
        quickShopModal.classList.remove('hidden');
    });
    bindClick('nav-shop-now-btn', () => {
        quickShopModal.classList.remove('hidden');
    });
    bindClick('close-quick-shop', () => {
        quickShopModal.classList.add('hidden');
    });
    
    // Pre-order button cart incrementor
    bindClick('confirm-preorder-button', () => {
        cartCount++;
        showToast(`Added Velox US Size ${selectedSize} to cart.`);
        quickShopModal.classList.add('hidden');
    });

    // Explore 360 CTA
    bindClick('cta-explore-360', handleExplore360);

    // Size selection lists
    document.querySelectorAll('#size-selector-grid .size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.textContent.replace('US ', '');
            syncSelectedSize(val);
        });
    });
    document.querySelectorAll('.widget-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.textContent;
            syncSelectedSize(val);
            showToast(`Adjusted preview size to US ${val}`);
        });
    });

    // Feature cards hover/click spec bindings
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        const featId = card.getAttribute('data-feature');
        
        card.addEventListener('mouseenter', () => {
            if (!document.querySelector(`[data-feature-sync].active`)) {
                updateTechSpecText(featId);
                card.classList.add('active');
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (!document.querySelector(`[data-feature-sync].active`)) {
                updateTechSpecText(null);
                card.classList.remove('active');
            }
        });
        
        card.addEventListener('click', () => {
            updateTechSpecText(featId);
            card.classList.add('active');
            
            const sec = document.querySelector(`[data-feature-sync="${featId}"]`);
            if (sec) {
                const headerOffset = 114; // Floating header offset
                const elementPosition = sec.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mode toggles
    bindClick('btn-mode-side', () => setViewerMode('SIDE'));
    bindClick('btn-mode-iso', () => setViewerMode('ISO'));
    bindClick('btn-mode-top', () => setViewerMode('TOP'));
}

// Frame Interpolation Animation Loop
function animate() {
    if (!is360Autoplay) {
        currentFrameIndex += (targetFrameIndex - currentFrameIndex) * ease;
        drawFrame(Math.round(currentFrameIndex));
    }
    
    requestAnimationFrame(animate);
}

// Init Setup
async function init() {
    await preloadImages();
    resizeCanvas();
    setupEventListeners();
    
    syncSelectedSize(9.5);
    handleScrollSync();
    
    setTimeout(() => {
        loader.classList.add('fade-out');
        animate();
    }, 450);
}

// Launch
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
