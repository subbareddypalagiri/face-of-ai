// src/main/tools/astra/core/assets/LocalAssetProvider.js — Verified Local Repository Asset Provider
'use strict';

const fs = require('fs');
const path = require('path');
const { BaseAssetProvider } = require('./BaseAssetProvider');
const { PROVIDER_STATUS, RESOLUTION_STRATEGY, MATCH_CONFIDENCE, QUALITY_TIER } = require('./AssetTypes');
const logger = require('../../../../../shared/Logger');

class LocalAssetProvider extends BaseAssetProvider {
  constructor(options = {}) {
    super('LocalAssetProvider', { priority: 1, initialStatus: PROVIDER_STATUS.AVAILABLE, ...options });
    this.workspaceRoot = path.resolve(options.workspaceRoot || path.join(__dirname, '../../../../../../'));

    // Verified Physical Assets in Repository
    this.catalog = [
      {
        id: 'local_ferrari_supercar',
        name: 'Ferrari SF90 Supercar',
        category: 'vehicle',
        keywords: ['ferrari', 'supercar', 'sports car', 'sportscar', 'racecar', 'race car', 'hypercar', 'car', 'automobile'],
        filePath: path.join(this.workspaceRoot, 'ferrari.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HERO
      },
      {
        id: 'local_botanical_tree',
        name: 'Canopy Forest Tree',
        category: 'vegetation',
        keywords: ['tree', 'forest tree', 'oak', 'pine', 'banyan', 'plant', 'vegetation', 'foliage'],
        filePath: path.join(this.workspaceRoot, 'tree.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_human_hero_avatar',
        name: 'Human Hero Avatar',
        category: 'character',
        keywords: ['human', 'person', 'avatar', 'character', 'man', 'woman', 'hero', 'figure', 'body'],
        filePath: path.join(this.workspaceRoot, 'hero.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HERO
      },
      {
        id: 'local_anime_character',
        name: 'Stylized Anime Avatar',
        category: 'character',
        keywords: ['anime', 'manga', 'stylized avatar', 'avatar3'],
        filePath: path.join(this.workspaceRoot, 'avatar3.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_quadruped_animal',
        name: 'Quadruped Creature / Animal',
        category: 'creature',
        keywords: ['animal', 'beast', 'quadruped', 'creature', 'mammal', 'fauna'],
        filePath: path.join(this.workspaceRoot, 'animal.fbx').replace(/\\/g, '/'),
        format: 'FBX',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_ergonomic_chair',
        name: 'Ergonomic Office Chair',
        category: 'furniture',
        keywords: ['chair', 'armchair', 'office chair', 'cushion chair', 'seat', 'leather chair'],
        incompatibleKeywords: [
          'wood', 'wooden', 'timber', 'oak', 'walnut', 'dining', 'dining chair',
          'rocking', 'rocking chair', 'bench', 'stool', 'curved backrest',
          'four legs', '4 legs', 'traditional', 'rustic', 'antique', 'accent chair',
          'classic chair'
        ],
        attributes: {
          style: 'office_swivel',
          base: 'swivel_caster',
          primaryMaterial: 'mesh_plastic_metal'
        },
        filePath: path.join(this.workspaceRoot, 'assets', 'models', 'chair.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_executive_desk',
        name: 'Executive Wooden Desk',
        category: 'furniture',
        keywords: ['desk', 'office desk', 'wooden desk', 'workstation', 'table with drawers'],
        incompatibleKeywords: [
          'glass desk', 'glass table', 'standing desk', 'height adjustable',
          'gaming desk', 'round table', 'dining table'
        ],
        attributes: {
          style: 'executive_office',
          primaryMaterial: 'wood'
        },
        filePath: path.join(this.workspaceRoot, 'assets', 'models', 'desk.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_titanium_smartphone',
        name: 'Titanium OLED Smartphone',
        category: 'electronics',
        keywords: ['smartphone', 'phone', 'mobile phone', 'cellular phone', 'oled screen'],
        filePath: path.join(this.workspaceRoot, 'assets', 'models', 'smartphone.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      },
      {
        id: 'local_residential_house',
        name: 'Residential House with Pitched Roof',
        category: 'architecture',
        keywords: ['house', 'small house', 'home', 'cottage', 'cabin', 'residential house'],
        incompatibleKeywords: [
          'skyscraper', 'high-rise', 'apartment', 'castle', 'temple', 'shrine',
          'church', 'igloo', 'tent'
        ],
        attributes: {
          style: 'residential_suburban'
        },
        filePath: path.join(this.workspaceRoot, 'assets', 'models', 'house.glb').replace(/\\/g, '/'),
        format: 'GLB',
        quality: QUALITY_TIER.HIGH
      }
    ];

    // Auto-index optional open-source models directory if present
    this._indexLocalModelsDirectory();
  }

  _indexLocalModelsDirectory() {
    const modelsDir = path.join(this.workspaceRoot, 'assets', 'models');
    if (!fs.existsSync(modelsDir)) return;
    try {
      const files = fs.readdirSync(modelsDir);
      for (const f of files) {
        if (/\.(glb|gltf|fbx|obj)$/i.test(f)) {
          const fullPath = path.join(modelsDir, f).replace(/\\/g, '/');
          const normalizedFullPath = path.resolve(fullPath).toLowerCase();
          const baseName = path.parse(f).name.toLowerCase();
          const ext = path.parse(f).ext.slice(1).toUpperCase();

          // Do NOT duplicate any asset already cataloged (by filePath or ID)
          const alreadyCataloged = this.catalog.some(c =>
            path.resolve(c.filePath).toLowerCase() === normalizedFullPath ||
            c.id === `local_${baseName}` ||
            c.id === `indexed_${baseName}`
          );

          if (!alreadyCataloged) {
            this.catalog.push({
              id: `indexed_${baseName}`,
              name: baseName.replace(/[_-]/g, ' '),
              category: 'prop',
              keywords: [baseName, ...baseName.split(/[_-]/)],
              filePath: fullPath,
              format: ext,
              quality: QUALITY_TIER.HIGH
            });
          }
        }
      }
    } catch {}
  }

  /**
   * Verifies if a matched local catalog asset actually satisfies requested design specifications
   */
  _satisfiesSpecifications(item, entity, requirements = {}) {
    const name = (entity.name || '').toLowerCase();
    const desc = (entity.description || '').toLowerCase();
    const combined = `${name} ${desc}`;

    // Universal check for chair.glb (which is an office task chair)
    if (item.filePath && item.filePath.toLowerCase().includes('chair.glb')) {
      const requestedWood = /\b(wood|wooden|timber|oak|walnut|mahogany|pine)\b/i.test(combined);
      const requestedCurved = /\b(curved|curve|contour|bent)\b/i.test(combined);
      const requestedLegs = /\b(four legs|4 legs|wooden legs)\b/i.test(combined);
      if (requestedWood || requestedCurved || requestedLegs) {
        logger.info(`[LocalAssetProvider] Rejecting office chair "${item.name}" (${item.filePath}) for "${entity.name}": does not satisfy wooden/curved/4-legged specifications.`);
        return false;
      }
    }

    // Check for desk.glb when custom multi-drawer or aluminum handle assemblies are requested
    if (item.filePath && item.filePath.toLowerCase().includes('desk.glb')) {
      const requestedSpecifics = /\b(three drawers|3 drawers|aluminum handles|metal handles|pull handles|bar handles)\b/i.test(combined);
      if (requestedSpecifics) {
        logger.info(`[LocalAssetProvider] Rejecting static desk "${item.name}" (${item.filePath}) for "${entity.name}": does not satisfy requested drawer/handle specifications.`);
        return false;
      }
    }

    // 1. Incompatible keyword check
    if (Array.isArray(item.incompatibleKeywords)) {
      for (const badKw of item.incompatibleKeywords) {
        const regex = new RegExp(`\\b${badKw.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(combined)) {
          logger.info(`[LocalAssetProvider] Rejecting "${item.name}" for "${entity.name}": incompatible specification "${badKw}" detected.`);
          return false;
        }
      }
    }

    // 2. Material incompatibility check
    if (item.attributes?.primaryMaterial) {
      const requestedWood = /\b(wood|wooden|timber|oak|walnut|mahogany|pine)\b/i.test(combined);
      if (requestedWood && !item.attributes.primaryMaterial.includes('wood')) {
        logger.info(`[LocalAssetProvider] Rejecting "${item.name}" for "${entity.name}": requested wood material but asset is ${item.attributes.primaryMaterial}.`);
        return false;
      }
    }

    // 3. Structural feature check
    if (item.attributes?.base === 'swivel_caster') {
      const requestedLegs = /\b(four legs|4 legs|wooden legs|angled legs|tapered legs)\b/i.test(combined);
      if (requestedLegs) {
        logger.info(`[LocalAssetProvider] Rejecting "${item.name}" for "${entity.name}": requested 4 legs but asset has swivel/caster base.`);
        return false;
      }
    }

    return true;
  }

  /**
   * Matches entity name & description against catalog using word boundaries & category filters
   */
  _matchCatalogItem(entity) {
    const name = (entity.name || '').toLowerCase();
    const desc = (entity.description || '').toLowerCase();
    const category = (entity.category || '').toLowerCase();

    // Strict Negative Exclusions:
    // A motorcycle or bike is a dedicated assembly and must NEVER match a car or tree!
    if (/motorcycle|bike|harley|chopper|scooter/i.test(name) || /motorcycle|bike|harley/i.test(desc)) {
      return null;
    }

    // Computer / PC workstation is handled by dedicated procedural generator
    if (/computer|desktop computer|pc|workstation tower|keyboard and monitor/i.test(name) && !/phone|smartphone/i.test(name)) {
      return null;
    }

    // Spaceship/Airplane are handled by dedicated procedural generators unless explicitly specified
    if (/spaceship|starship|craft|ufo|airplane|aircraft|aeroplane|airliner|jet/i.test(name)) {
      return null;
    }

    // Dragon is a mythical winged beast, not generic animal.fbx
    if (/dragon|wyvern/i.test(name)) {
      return null;
    }

    // Temple is handled by dedicated procedural architecture generator
    if (/temple|mandir|castle|cathedral|shrine/i.test(name)) {
      return null;
    }

    for (const item of this.catalog) {
      if (!fs.existsSync(item.filePath)) continue;

      // Category alignment
      const categoryMatch = (category === item.category) ||
        (category === 'vehicle' && item.category === 'vehicle') ||
        (category === 'character' && item.category === 'character');

      // Check keywords with regex word boundaries
      for (const kw of item.keywords) {
        const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(name)) {
          if (!this._satisfiesSpecifications(item, entity)) {
            continue;
          }
          return { item, confidence: MATCH_CONFIDENCE.EXACT, reason: `Exact name match for verified asset "${item.name}"` };
        }
        if (categoryMatch && regex.test(desc)) {
          if (!this._satisfiesSpecifications(item, entity)) {
            continue;
          }
          return { item, confidence: MATCH_CONFIDENCE.STRONG_SEMANTIC, reason: `Strong semantic match in category ${item.category}` };
        }
      }
    }

    return null;
  }

  async canResolve(entity, requirements = {}) {
    const match = this._matchCatalogItem(entity);
    if (match) {
      return {
        canResolve: true,
        confidence: match.confidence,
        strategy: RESOLUTION_STRATEGY.LOCAL_CATALOG,
        reason: match.reason,
        matchedItem: match.item
      };
    }
    return {
      canResolve: false,
      confidence: MATCH_CONFIDENCE.NONE,
      strategy: RESOLUTION_STRATEGY.LOCAL_CATALOG,
      reason: `No verified local asset matches "${entity.name}" (${entity.category})`
    };
  }

  async resolve(entity, requirements = {}, context = {}) {
    const match = this._matchCatalogItem(entity);
    if (!match) {
      return {
        success: false,
        strategy: RESOLUTION_STRATEGY.LOCAL_CATALOG,
        provider: this.name,
        error: `Entity "${entity.name}" does not match local catalog.`
      };
    }

    const item = match.item;
    logger.info(`[LocalAssetProvider] Matched "${entity.name}" -> "${item.name}" (${item.filePath}) ✓`);

    // Run deep validation if validator is provided
    let validationReport = { valid: true };
    if (context.validator) {
      validationReport = await context.validator.validate(item.filePath, {
        triangleBudget: requirements.triangleBudget
      });
      if (!validationReport.valid) {
        logger.error(`[LocalAssetProvider] Local asset failed validation: ${validationReport.errors.join(', ')}`);
        return {
          success: false,
          strategy: RESOLUTION_STRATEGY.LOCAL_CATALOG,
          provider: this.name,
          error: `Local asset failed validation: ${validationReport.errors.join(', ')}`
        };
      }
    }

    return {
      success: true,
      strategy: RESOLUTION_STRATEGY.LOCAL_CATALOG,
      provider: this.name,
      assetPath: item.filePath,
      format: item.format,
      quality: item.quality,
      confidence: match.confidence,
      reason: match.reason,
      metadata: {
        assetId: item.id,
        name: item.name,
        category: item.category,
        dimensions: entity.estimatedDimensions,
        validation: validationReport
      }
    };
  }
}

module.exports = { LocalAssetProvider };
