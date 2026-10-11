// src/main/tools/astra/core/assets/AssetTypes.js — Dynamic Asset Intelligence Enums & Types
'use strict';

/**
 * Explicit Provider Operational States
 */
const PROVIDER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  TEMPORARILY_UNAVAILABLE: 'TEMPORARILY_UNAVAILABLE',
  FAILED: 'FAILED',
  UNSUPPORTED: 'UNSUPPORTED'
};

/**
 * Granular Observable Asset Lifecycle
 */
const ASSET_LIFECYCLE = {
  REQUESTED: 'REQUESTED',
  RESOLVING: 'RESOLVING',
  RESOLVED: 'RESOLVED',
  DOWNLOADING: 'DOWNLOADING',
  VALIDATING: 'VALIDATING',
  SANITIZING: 'SANITIZING',
  CACHED: 'CACHED',
  IMPORTED: 'IMPORTED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED',
  UNAVAILABLE: 'UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED'
};

/**
 * Geometric & Cinematic Quality Tiers
 */
const QUALITY_TIER = {
  PREVIEW: 'PREVIEW',       // <= 25k triangles (rapid prototyping)
  STANDARD: 'STANDARD',     // <= 100k triangles (background props)
  HIGH: 'HIGH',             // <= 500k triangles (secondary focus)
  HERO: 'HERO',             // <= 1.5M triangles (primary focal subject)
  CINEMATIC: 'CINEMATIC'    // 1.5M - 5M+ triangles (AAA master render)
};

/**
 * Triangle Budget Defaults per Tier
 */
const TRIANGLE_BUDGETS = {
  PREVIEW: 25000,
  STANDARD: 100000,
  HIGH: 500000,
  HERO: 1500000,
  CINEMATIC: 5000000
};

/**
 * Asset Resolution Strategies in Priority Sequence
 */
const RESOLUTION_STRATEGY = {
  LOCAL_CATALOG: 'LOCAL_CATALOG',
  LOCAL_CACHE: 'LOCAL_CACHE',
  REMOTE_CATALOG: 'REMOTE_CATALOG',
  AI_GENERATION: 'AI_GENERATION',
  PROCEDURAL_ASSEMBLY: 'PROCEDURAL_ASSEMBLY',
  CONTROLLED_FALLBACK: 'CONTROLLED_FALLBACK'
};

/**
 * Semantic Match Confidence Scores
 */
const MATCH_CONFIDENCE = {
  EXACT: 1.0,
  STRONG_SEMANTIC: 0.85,
  MODERATE_SEMANTIC: 0.65,
  WEAK_SEMANTIC: 0.35,
  NONE: 0.0
};

module.exports = {
  PROVIDER_STATUS,
  ASSET_LIFECYCLE,
  QUALITY_TIER,
  TRIANGLE_BUDGETS,
  RESOLUTION_STRATEGY,
  MATCH_CONFIDENCE
};
