/**
 * Animation system for Gossip - Nothing but a MURMUR
 * Handles rain drops, ellipses, and visual effects
 */

class AnimationSystem {
  constructor(canvasId, layerId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.layer = document.getElementById(layerId);
    this.drops = [];
    this.scale = 1;
    this.offsetLeft = 0;
    this.offsetTop = 0;
    
    // Design constants (1920x1080 coordinate system)
    this.DESIGN_W = 1920;
    this.DESIGN_H = 1080;
    
    // Rain parameters
    this.ANGLE_DEG = 50;
    this.ANGLE_RAD = this.ANGLE_DEG * Math.PI / 180;
    this.ANGLE_DIR = Math.PI - this.ANGLE_RAD; 
    this.DOT_SIZE = 9; 
    this.DOT_SPACING = 16; 
    this.DURATION = 3200; 
    this.PATH_MIN = 80; 
    this.PATH_MAX = 380; 
    
    // Spawn zones (avoid center input area)
    this.SPAWN_ZONES = [
      { x0: 0, x1: 860, y0: 0, y1: 900 },      // Left side
      { x0: 1160, x1: 1920, y0: 0, y1: 900 }   // Right side
    ];

    if (this.canvas && this.ctx) {
      this.init();
    }
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startDrawLoop();
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw / this.DESIGN_W, vh / this.DESIGN_H);
    this.scale = s;
    
    this.offsetLeft = (vw - this.DESIGN_W * s) / 2;
    this.offsetTop = (vh - this.DESIGN_H * s) / 2;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = vw * dpr;
    this.canvas.height = vh * dpr;
    this.canvas.style.width = vw + 'px';
    this.canvas.style.height = vh + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  pickZone() {
    const zone = this.SPAWN_ZONES[Math.floor(Math.random() * this.SPAWN_ZONES.length)];
    return {
      x: this.rand(zone.x0, zone.x1),
      y: this.rand(zone.y0, zone.y1)
    };
  }

  designToViewport(x, y) {
    return [
      this.offsetLeft + x * this.scale,
      this.offsetTop + y * this.scale
    ];
  }

  /**
   * Spawn a drop for a typed character
   * @param {string} char - Character typed
   * @param {string} sol - Solfege note
   */
  spawnDrop(char, sol) {
    const spawn = this.pickZone();
    const sx = spawn.x;
    const sy = spawn.y;
    const length = this.rand(this.PATH_MIN, this.PATH_MAX);
    
    // Calculate end point
    const ex = sx + Math.cos(this.ANGLE_DIR) * length;
    const ey = sy + Math.sin(this.ANGLE_DIR) * length;
    
    // Generate dots along path
    const steps = Math.max(2, Math.floor(length / this.DOT_SPACING));
    const dots = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      dots.push({
        x: sx + (ex - sx) * t,
        y: sy + (ey - sy) * t
      });
    }
    
    this.drops.push({
      dots,
      start: performance.now(),
      dur: this.DURATION,
      ex,
      ey,
      sol,
      endCreated: false
    });
  }

  /**
   * Create ellipse with solfege text at drop end point
   */
  createEndEllipse(drop) {
    if (!this.layer) return;
    
    const [vx, vy] = this.designToViewport(drop.ex, drop.ey);
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'drop-end';
    wrapper.style.cssText = `
      position: absolute;
      left: ${vx}px;
      top: ${vy}px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 5;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Ellipse size - reduced for better visibility
    const w = Math.round(this.rand(120, 220));
    const h = Math.round(this.rand(35, 48));
    
    // Create ellipse
    const ellipse = document.createElement('div');
    ellipse.className = 'ellipse';
    ellipse.style.cssText = `
      width: ${w}px;
      height: ${h}px;
      border-radius: 50%;
      border: 1px solid #000;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;
    
    // Solfege text - smaller font
    const text = document.createElement('div');
    text.className = 'sol-text';
    text.style.cssText = `
      font-family: "Helvetica Neue", Arial, Helvetica, sans-serif;
      font-size: 16pt;
      font-style: italic;
      color: #000;
      white-space: nowrap;
    `;
    text.textContent = drop.sol || '';
    
    // Ripple
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.14);
      background: transparent;
      pointer-events: none;
    `;
    
    ellipse.appendChild(text);
    wrapper.appendChild(ellipse);
    wrapper.appendChild(ripple);
    this.layer.appendChild(wrapper);
    
    // Store reference for synchronized removal
    drop.ellipseWrapper = wrapper;
    
    // Fade in
    requestAnimationFrame(() => {
      wrapper.style.opacity = '1';
    });
    
    // Animate ripple
    const start = performance.now();
    const dur = 2000; // Extended duration for ripple
    
    const animate = () => {
      const t = (performance.now() - start) / dur;
      
      if (t >= 1 || drop.shouldRemoveEllipse) {
        // Don't remove here - let the drop animation handle removal
        return;
      }
      
      // Ripple animation
      const r = Math.min(1, Math.max(0, t));
      const maxR = 1 + (3 + Math.random() * 3);
      ripple.style.transform = `translate(-50%, -50%) scale(${r * maxR})`;
      ripple.style.opacity = String(Math.max(0, 1 - r * 1.2));
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Main draw loop
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const now = performance.now();
    
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      
      // Calculate progress for rain animation
      const rainProgress = Math.max(0, Math.min(1, (now - drop.start) / drop.dur));
      
      // Create ellipse at 90% rain progress
      if (rainProgress >= 0.9 && !drop.endCreated) {
        this.createEndEllipse(drop);
        drop.endCreated = true;
        drop.ellipseStart = now; // Mark when ellipse was created
      }
      
      // Calculate total progress including hold time
      const holdTime = 1500; // Wait 1.5s after rain completes before fading
      const fadeTime = 800; // Fade out duration
      const totalDur = drop.dur + holdTime + fadeTime;
      const totalProgress = (now - drop.start) / totalDur;
      
      // Draw rain drops
      if (rainProgress < 1 || totalProgress < 1) {
        const visibleCount = Math.floor(drop.dots.length * Math.min(1, rainProgress));
        
        // Calculate opacity
        let opacity = 1;
        if (rainProgress >= 1) {
          // Rain finished, now in hold or fade phase
          const timeSinceRainDone = now - (drop.start + drop.dur);
          if (timeSinceRainDone > holdTime) {
            // Fade out phase
            const fadeProgress = (timeSinceRainDone - holdTime) / fadeTime;
            opacity = Math.max(0, 1 - fadeProgress);
          }
        } else {
          opacity = 1 - rainProgress * 0.3; // Slight fade during animation
        }
        
        this.ctx.save();
        this.ctx.fillStyle = '#000';
        this.ctx.globalAlpha = opacity;
        
        for (let k = 0; k < visibleCount; k++) {
          const dot = drop.dots[k];
          const [vx, vy] = this.designToViewport(dot.x, dot.y);
          this.ctx.beginPath();
          this.ctx.arc(vx, vy, (this.DOT_SIZE / 2) * this.scale, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Sync ellipse fade with rain fade
        if (drop.ellipseWrapper && rainProgress >= 1) {
          const timeSinceRainDone = now - (drop.start + drop.dur);
          if (timeSinceRainDone > holdTime) {
            const fadeProgress = (timeSinceRainDone - holdTime) / fadeTime;
            drop.ellipseWrapper.style.opacity = String(Math.max(0, 1 - fadeProgress));
          }
        }
      }
      
      // Remove completed drops (both rain and ellipse)
      if (totalProgress >= 1) {
        // Remove ellipse
        if (drop.ellipseWrapper && this.layer) {
          try {
            this.layer.removeChild(drop.ellipseWrapper);
          } catch (e) {}
        }
        // Remove drop from array
        this.drops.splice(i, 1);
      }
    }
  }

  startDrawLoop() {
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

