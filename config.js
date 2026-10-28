/**
 * NOCTIS — Scrollytelling Configuration & Design Tokens
 * All section heights, chapter ranges, frame counts, frame paths and callout positions
 * can be tuned here.
 */

const NOCTIS_CONFIG = {
  // Theme & Design Tokens
  tokens: {
    asphalt: '#07080A',
    graphite: '#121418',
    fog: '#8A8F98',
    bone: '#EDEAE4',
    xenon: '#CFE3FF',
    taillight: '#E1251B',
    hairline: 'rgba(237, 234, 228, 0.12)',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easingArray: [0.16, 1, 0.3, 1]
  },

  // Preloader settings
  preloader: {
    initialHeroFramesToLoad: 40, // load first 40 frames before revealing site
    exitFlashMs: 140
  },

  // Section 1: Hero Video Scrollytelling
  hero: {
    frameCount: 598,
    desktopPath: 'assets/frames/hero/frame_{index}.webp',
    mobilePath: 'assets/frames/hero-mobile/frame_{index}.webp',
    wrapperHeight: '600vh',
    lerp: 0.15,
    fadeToBlackStart: 0.95, // last 5% fades canvas to solid asphalt #07080A
    
    // HUD counters & ranges
    hud: {
      maxSpeed: 118, // KM/H
      maxDistance: 4.2 // KM
    },

    // Narrative chapters across scroll progress 0.0 -> 1.0
    chapters: [
      {
        id: '01',
        title: 'NOCTIS',
        subtitle: 'The city is asleep.',
        hint: 'SCROLL TO WAKE IT',
        start: 0.00,
        end: 0.12,
        fadeOut: 0.16
      },
      {
        id: '02',
        title: "It doesn't need the city's light.",
        fadeIn: 0.20,
        start: 0.22,
        end: 0.40,
        fadeOut: 0.44
      },
      {
        id: '03',
        title: "It brings its own.",
        fadeIn: 0.48,
        start: 0.50,
        end: 0.68,
        fadeOut: 0.72
      },
      {
        id: '04',
        title: 'GT-E',
        specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
        linkText: 'Discover the GT-E',
        linkHref: '#lineup',
        fadeIn: 0.78,
        start: 0.80,
        end: 1.00
      }
    ]
  },

  // Section 2: Statement
  statement: {
    category: '02 — ENGINEERING',
    text: 'Every part was designed to disappear into one line of light.'
  },

  // Section 3: Dismantle Architecture Scrollytelling
  dismantle: {
    frameCount: 200,
    desktopPath: 'assets/frames/dismantle/frame_{index}.webp',
    mobilePath: 'assets/frames/dismantle-mobile/frame_{index}.webp',
    wrapperHeight: '350vh',
    lerp: 0.15,
    calloutsStart: 0.70,

    // Callout coordinates (percentages relative to canvas 0–100)
    // dot: position of the glowing xenon dot on the car component
    // labelPos: position of the mono/Inter text card
    // lineDir: visual anchor
    callouts: [
      {
        id: 'body',
        code: 'BODY',
        name: 'Carbon composite monocoque',
        dot: { x: 42, y: 12 },
        labelPos: { x: 20, y: 15 },
        trigger: 0.72
      },
      {
        id: 'battery',
        code: 'BATTERY',
        name: '110 kWh structural pack',
        dot: { x: 38, y: 66 },
        labelPos: { x: 14, y: 76 },
        trigger: 0.79
      },
      {
        id: 'drive',
        code: 'DRIVE',
        name: 'Dual axial-flux motors, 680 kW',
        dot: { x: 57, y: 58 },
        labelPos: { x: 68, y: 46 },
        trigger: 0.85
      },
      {
        id: 'light',
        code: 'LIGHT',
        name: 'Single-line LED signature',
        dot: { x: 84, y: 64 },
        labelPos: { x: 74, y: 78 },
        trigger: 0.91
      }
    ]
  },

  // Section 4: Lineup Accordion
  lineup: {
    category: '03 — THE LINEUP',
    headline: 'Five ways to drive the night.',
    defaultActiveIndex: 0,
    hoverDebounceMs: 80,
    models: [
      {
        number: '01',
        id: 'gt-e',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        range: '640 km',
        accel: '3.1 s',
        power: '680 kW',
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite electric grand tourer coupe',
        colors: [
          { name: 'Matte Graphite', hex: '#1C1F24' },
          { name: 'Obsidian Black', hex: '#0B0C0E' },
          { name: 'Liquid Titanium', hex: '#4B4F56' },
          { name: 'Asphalt Deep', hex: '#121418' }
        ]
      },
      {
        number: '02',
        id: 's',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        range: '600 km',
        accel: '3.6 s',
        power: '520 kW',
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S satin bone white luxury electric sport sedan',
        colors: [
          { name: 'Satin Bone', hex: '#E2DFD8' },
          { name: 'Chalk White', hex: '#F0EEE9' },
          { name: 'Graphite Shadow', hex: '#26292E' },
          { name: 'Midnight Onyx', hex: '#0D0E10' }
        ]
      },
      {
        number: '03',
        id: 'x',
        name: 'X',
        tagline: 'Higher, never heavier.',
        range: '560 km',
        accel: '4.2 s',
        power: '480 kW',
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X midnight blue electric coupe SUV',
        colors: [
          { name: 'Midnight Blue', hex: '#111A2E' },
          { name: 'Abyss Navy', hex: '#09101C' },
          { name: 'Graphite Slate', hex: '#20242B' },
          { name: 'Titanium Ice', hex: '#505663' }
        ]
      },
      {
        number: '04',
        id: 'r',
        name: 'R',
        tagline: 'Built for the track.',
        range: '420 km',
        accel: '2.4 s',
        power: '900 kW',
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R track-focused satin black electric hyper coupe with fixed wing',
        colors: [
          { name: 'Satin Black / Red', hex: '#0F0F10' },
          { name: 'Carbon Raw', hex: '#1B1C1E' },
          { name: 'Ghost Silver', hex: '#72767F' },
          { name: 'Monza Accent', hex: '#E1251B' }
        ]
      },
      {
        number: '05',
        id: 'one',
        name: 'ONE',
        tagline: 'The future, early.',
        range: 'Concept',
        accel: 'Sub-2.0 s',
        power: '1200 kW',
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE liquid silver aerodynamic electric hypercar concept',
        colors: [
          { name: 'Liquid Silver', hex: '#C2C5CC' },
          { name: 'Mercury Chrome', hex: '#8E94A0' },
          { name: 'Deep Asphalt', hex: '#07080A' },
          { name: 'Xenon Beam', hex: '#CFE3FF' }
        ]
      }
    ]
  },

  // Section 5: Reserve
  reserve: {
    headline: 'Drive the night.',
    subline: 'Order allocations open for global delivery in 2026.',
    cta: 'RESERVE YOUR NOCTIS'
  }
};

if (typeof window !== 'undefined') {
  window.NOCTIS_CONFIG = NOCTIS_CONFIG;
}

