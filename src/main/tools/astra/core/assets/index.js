// src/main/tools/astra/core/assets/index.js — Barrel export for Dynamic Asset Intelligence
'use strict';

const AssetTypes = require('./AssetTypes');
const { AssetValidator, SUPPORTED_FORMATS } = require('./AssetValidator');
const { AssetCacheManager } = require('./AssetCacheManager');
const { BaseAssetProvider } = require('./BaseAssetProvider');
const { LocalAssetProvider } = require('./LocalAssetProvider');
const { CachedAssetProvider } = require('./CachedAssetProvider');
const { RemoteAssetProvider } = require('./RemoteAssetProvider');
const { AI3DAssetProvider } = require('./AI3DAssetProvider');
const { ProceduralAssetProvider } = require('./ProceduralAssetProvider');
const { AssetProviderRegistry } = require('./AssetProviderRegistry');

module.exports = {
  ...AssetTypes,
  AssetValidator,
  SUPPORTED_FORMATS,
  AssetCacheManager,
  BaseAssetProvider,
  LocalAssetProvider,
  CachedAssetProvider,
  RemoteAssetProvider,
  AI3DAssetProvider,
  ProceduralAssetProvider,
  AssetProviderRegistry
};
