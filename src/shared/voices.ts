/**
 * voices.ts — Centralised ElevenLabs voice registry.
 *
 * Single source of truth for all voice metadata consumed by:
 *   - PanelApp (voice picker UI)
 *   - elevenlabs-tts.ts (default voice fallback)
 *   - Any future voice-preview or onboarding flow
 *
 * All voices listed are ElevenLabs premade voices available on the free tier.
 * `premium: true` is reserved for future library / professional voices that
 * require a paid plan — set to false for all current entries.
 */

export interface Voice {
  /** Display name shown in UI */
  name: string;
  /** ElevenLabs voice ID used in API calls */
  voiceId: string;
  /** Requires a paid ElevenLabs subscription */
  premium: boolean;
  /** Accent / regional dialect */
  dialect: 'American' | 'British' | 'Australian' | 'Transatlantic' | string;
  /** One-line description of tone and best use-case */
  description: string;
}

export const VOICES: Voice[] = [
  {
    name:        'Adam',
    voiceId:     'pNInz6obpgDQGcFmaJgB',
    premium:     false,
    dialect:     'American',
    description: 'Deep, authoritative — narration & documentary',
  },
  {
    name:        'Alice',
    voiceId:     'Xb7hH8MSUJpSbSDYk0k2',
    premium:     false,
    dialect:     'British',
    description: 'Confident, clear — news & corporate',
  },
  {
    name:        'Bella',
    voiceId:     'hpp4J3VqNfWAUOO0d1Us',
    premium:     false,
    dialect:     'American',
    description: 'Soft, warm — narration & wellness',
  },
  {
    name:        'Bill',
    voiceId:     'pqHfZKP75CvOlQylNhV4',
    premium:     false,
    dialect:     'American',
    description: 'Trustworthy, steady — documentary & explainer',
  },
  {
    name:        'Brian',
    voiceId:     'nPczCjzI2devNBz1zQrb',
    premium:     false,
    dialect:     'American',
    description: 'Deep, resonant — audiobooks & narration',
  },
  {
    name:        'Callum',
    voiceId:     'N2lVS1w4EtoT3dr4eOWO',
    premium:     false,
    dialect:     'Transatlantic',
    description: 'Intense, dramatic — characters & fiction',
  },
  {
    name:        'Charlie',
    voiceId:     'IKne3meq5aSn9XLyUdCD',
    premium:     false,
    dialect:     'Australian',
    description: 'Casual, natural — conversational & social',
  },
  {
    name:        'Chris',
    voiceId:     'iP95p4xoKVk53GoZ742B',
    premium:     false,
    dialect:     'American',
    description: 'Casual, relatable — social media & promos',
  },
  {
    name:        'Daniel',
    voiceId:     'onwK4e9ZLuTAKqWW03F9',
    premium:     false,
    dialect:     'British',
    description: 'Authoritative, smooth — news & formal',
  },
  {
    name:        'Eric',
    voiceId:     'cjVigY5qzO86Huf0OWal',
    premium:     false,
    dialect:     'American',
    description: 'Friendly, engaging — assistant & explainer',
  },
  {
    name:        'George',
    voiceId:     'JBFqnCBsd6RMkjVDRZzb',
    premium:     false,
    dialect:     'British',
    description: 'Warm, articulate — narration & storytelling',
  },
  {
    name:        'Harry',
    voiceId:     'SOYHLrjzK2X1ezoPC6cr',
    premium:     false,
    dialect:     'American',
    description: 'Youthful, expressive — young adult & fiction',
  },
  {
    name:        'Jessica',
    voiceId:     'cgSgspJ2msm6clMCkdW9',
    premium:     false,
    dialect:     'American',
    description: 'Expressive, conversational — companion & assistant',
  },
  {
    name:        'Laura',
    voiceId:     'FGY2WhTYpPnrIDTdsKH5',
    premium:     false,
    dialect:     'American',
    description: 'Upbeat, bright — social media & promotions',
  },
  {
    name:        'Liam',
    voiceId:     'TX3LPaxmHKxFdv7VOQHJ',
    premium:     false,
    dialect:     'American',
    description: 'Articulate, clear — narration & education',
  },
  {
    name:        'Lily',
    voiceId:     'pFZP5JQG7iQjIQuC4Bku',
    premium:     false,
    dialect:     'British',
    description: 'Raspy, distinctive — character & narration',
  },
  {
    name:        'Matilda',
    voiceId:     'XrExE9yKIg1WjnnlVkGX',
    premium:     false,
    dialect:     'American',
    description: 'Warm, expressive — audiobooks & companion',
  },
  {
    name:        'River',
    voiceId:     'SAz9YHcvj6GT2YYXdXww',
    premium:     false,
    dialect:     'American',
    description: 'Calm, neutral — meditation & assistant',
  },
  {
    name:        'Roger',
    voiceId:     'CwhRBWXzGAHq8TQ4Fs17',
    premium:     false,
    dialect:     'American',
    description: 'Confident, grounded — news & professional',
  },
  {
    name:        'Sarah',
    voiceId:     'EXAVITQu4vr4xnSDxMaL',
    premium:     false,
    dialect:     'American',
    description: 'Soft, measured — news & narration',
  },
  {
    name:        'Will',
    voiceId:     'bIHbv24MWmeRgasZH58o',
    premium:     false,
    dialect:     'American',
    description: 'Friendly, upbeat — social media & conversational',
  },
];

/** Default voice ID used when no preference is saved. */
export const DEFAULT_VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica
