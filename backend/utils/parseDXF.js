const fs = require('fs');
const DxfParser = require('dxf-parser');

/**
 * Parses a DXF file from the given file path and returns an object containing:
 * - entities: top-level entities in the DXF
 * - blocks: a map of block definitions, each with its own entities
 *
 * It also adds a property "resolvedEntities" on each block that recursively
 * resolves any INSERTed blocks.
 *
 * @param {string} filePath - Path to the DXF file.
 * @returns {object} The parsed DXF content.
 * @throws {Error} if file reading or DXF parsing fails.
 */
function parseDXFContent(filePath) {
  const parser = new DxfParser();
  let dxf;

  try {
    const dxfText = fs.readFileSync(filePath, 'utf8'); // Ensure UTF-8 read
    dxf = parser.parseSync(dxfText);
  } catch (err) {
    throw new Error('DXF parsing failed: ' + err.message);
  }

  const result = {
    entities: [],
    blocks: {},
    fileName: null
  };

  // Process top-level entities
  if (Array.isArray(dxf.entities)) {
    result.entities = dxf.entities
      .filter(ent => ent && ent.type)
      .map(ent => ({
        type: ent.type,
        layer: ent.layer || '0',
        properties: extractGeometry(ent)
      }));
  }

  // Process block definitions
  if (dxf.blocks && typeof dxf.blocks === 'object') {
    Object.entries(dxf.blocks).forEach(([blockName, block]) => {
      if (block && block.entities) {
        result.blocks[blockName] = {
          name: blockName,
          position: block.position || { x: 0, y: 0, z: 0 },
          // Map each entity similarly to top-level entities.
          entities: block.entities
            .filter(ent => ent && ent.type)
            .map(ent => ({
              type: ent.type,
              layer: ent.layer || '0',
              properties: extractGeometry(ent)
            }))
        };
      }
    });
  }

  // For each block, recursively resolve nested INSERT entities and store them.
  Object.values(result.blocks).forEach(block => {
    block.resolvedEntities = resolveBlockEntities(block, result.blocks);
  });

  return result;
}

/**
 * Recursively traverses a block's entities and resolves any nested INSERT entities.
 * Avoids cyclic references by using a visited set.
 *
 * @param {object} block - The block to resolve.
 * @param {object} blocksMap - Map of all block definitions.
 * @param {Set} [visited=new Set()] - Set of visited block names to avoid cycles.
 * @returns {Array} The flat list of resolved entities within the block.
 */
function resolveBlockEntities(block, blocksMap, visited = new Set()) {
  if (!block || !block.entities) return [];
  let resultEntities = [];

  block.entities.forEach(entity => {
    if (entity.type === 'INSERT' && entity.properties?.blockName) {
      const refName = entity.properties.blockName;
      // Avoid cyclic insertion
      if (visited.has(refName)) {
        console.warn('Cycle detected for block:', refName);
        return;
      }
      if (blocksMap[refName]) {
        visited.add(refName);
        const subBlock = blocksMap[refName];
        // Recursively resolve entities from the referenced block.
        const nestedEntities = resolveBlockEntities(subBlock, blocksMap, visited);
        resultEntities = resultEntities.concat(nestedEntities);
        visited.delete(refName);
      }
    } else {
      resultEntities.push(entity);
    }
  });

  return resultEntities;
}

/**
 * Extracts geometric data from a DXF entity based on its type.
 * This function returns an object with the relevant properties.
 *
 * @param {object} ent - The DXF entity.
 * @returns {object} The extracted geometry/properties.
 */
function extractGeometry(ent) {
  if (!ent) return {};

  switch (ent.type) {
    case 'LINE':
      if (ent.vertices?.length >= 2) {
        return {
          start: ent.vertices[0],
          end: ent.vertices[1]
        };
      }
      return {
        start: ent.start || { x: 0, y: 0, z: 0 },
        end: ent.end || { x: 0, y: 0, z: 0 }
      };

    case 'CIRCLE':
      return {
        center: ent.center || { x: 0, y: 0, z: 0 },
        radius: ent.radius || 0
      };

    case 'ARC':
      return {
        center: ent.center || { x: 0, y: 0, z: 0 },
        radius: ent.radius || 0,
        startAngle: ent.startAngle ?? 0,
        endAngle: ent.endAngle ?? 0
      };

    case 'LWPOLYLINE':
      return {
        vertices: ent.vertices || [],
        closed: ent.closed || false
      };

    case 'INSERT':
      // Updated to include the referenced block's name in a dedicated property.
      return {
        blockName: ent.name || 'Unnamed',
        position: ent.position || { x: 0, y: 0, z: 0 }
      };

    case 'SPLINE':
      return {
        controlPoints: (ent.controlPoints || []).map(p => ({
          x: p.x || 0,
          y: p.y || 0,
          z: p.z || 0
        })),
        degree: ent.degree || 1,
        closed: ent.closed || false
      };

    default:
      console.warn(`Unhandled entity type: ${ent.type}`);
      return {};
  }
}

module.exports = parseDXFContent;
