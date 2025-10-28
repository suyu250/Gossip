/**
 * Audio system for Gossip - Nothing but a MURMUR
 * Plays audio files for each letter (A-Z)
 */

class AudioSystem {
  constructor() {
    this.initialized = false;
    this.audioCache = {}; // Cache for audio objects
    this.basePath = '/resource/'; // Path to audio files
    
    // Number notation mapping (A-Z to numbered musical notation)
    // \u0323 = dot below, \u0307 = dot above
    this.numberMapping = {
      'A': '1\u0323', 'B': '2\u0323', 'C': '3\u0323', 'D': '4\u0323', 'E': '5\u0323', 'F': '6\u0323', 'G': '7\u0323',
      'H': '1', 'I': '2', 'J': '3', 'K': '4', 'L': '5', 'M': '6', 'N': '7',
      'O': '1\u0307',
      'P': '2\u0323', 'Q': '3\u0323', 'R': '4\u0323', 'S': '5\u0323', 'T': '6\u0323', 'U': '7\u0323',
      'V': '1', 'W': '2', 'X': '3', 'Y': '4', 'Z': '5'
    };
    
    // Preload all audio files
    this.preloadAudio();
  }

  /**
   * Preload all audio files for better performance
   */
  preloadAudio() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const audio = new Audio();
      
      // Try uppercase extension first (.MP3), fallback to lowercase (.mp3)
      audio.src = this.basePath + letter + '.MP3';
      audio.preload = 'auto';
      audio.volume = 0.7; // Set volume to 70%
      
      // Fallback for lowercase extension
      audio.addEventListener('error', () => {
        audio.src = this.basePath + letter + '.mp3';
      }, { once: true });
      
      this.audioCache[letter] = audio;
    }
    console.log('✅ Audio files preloaded');
  }

  /**
   * Initialize audio system (requires user gesture)
   */
  init() {
    if (this.initialized) return;
    
    this.initialized = true;
    console.log('✅ Audio system initialized');
  }

  /**
   * Map a character to number notation
   * @param {string} char - Single character
   * @returns {string|null} - Number notation or null
   */
  letterToSolfege(char) {
    const upperChar = char.toUpperCase();
    // Check if it's a letter (A-Z)
    if (this.numberMapping[upperChar]) {
      return this.numberMapping[upperChar];
    }
    return null;
  }

  /**
   * Play audio file for a character
   * @param {string} char - Single character (A-Z or a-z)
   */
  playForChar(char) {
    if (!char) return;
    
    const upperChar = char.toUpperCase();
    const code = upperChar.charCodeAt(0);
    
    // Check if it's a letter (A-Z)
    if (code >= 65 && code <= 90) {
      const audio = this.audioCache[upperChar];
      
      if (audio) {
        // Clone the audio to allow multiple plays
        const audioClone = audio.cloneNode();
        audioClone.volume = 0.7;
        
        // Play the audio
        audioClone.play().catch(err => {
          console.warn(`Failed to play audio for ${upperChar}:`, err);
        });
        
        // Clean up after playing
        audioClone.addEventListener('ended', () => {
          audioClone.remove();
        });
      }
    }
  }

  /**
   * Play a solfege note (for backward compatibility)
   * @param {string} sol - Solfege note name
   */
  playSolfege(sol) {
    // This method is kept for backward compatibility but not used
    console.log('playSolfege called with:', sol);
  }
}

// Create global audio system instance
const audioSystem = new AudioSystem();

// Auto-initialize on first user interaction
document.addEventListener('click', function initAudio() {
  audioSystem.init();
  document.removeEventListener('click', initAudio);
}, { once: true });

document.addEventListener('keydown', function initAudio() {
  audioSystem.init();
  document.removeEventListener('keydown', initAudio);
}, { once: true });

