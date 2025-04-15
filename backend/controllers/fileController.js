// controllers/fileController.js
const fs = require('fs');
const path = require('path');
const parseDXFContent = require('../utils/parseDXF');

let parsedData = {
  entities: [],
  blocks: {},
  fileName: null
};

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const uploadDir = path.join(__dirname, '..', 'uploads');

    // Ensure the uploads folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, file.name);
    await file.mv(filePath);

    // ✅ Now parse using the file path (updated in parseDXF.js)
    const parsed = parseDXFContent(filePath);

    parsedData = {
      ...parsed,
      fileName: file.name
    };

    console.log('✅ DXF file parsed successfully.');
    console.log('Parsed data preview:', {
      fileName: parsedData.fileName,
      entityCount: parsedData.entities.length,
      blockCount: Object.keys(parsedData.blocks).length
    });

    res.json({
      message: 'File uploaded and parsed successfully.',
      fileName: file.name,
      blockCount: Object.keys(parsedData.blocks).length
    });

  } catch (err) {
    console.error('❌ Error in file upload:', err.message);
    next(err);
  }
};

exports.getEntities = async (req, res) => {
  res.json(parsedData);
};

exports.getBlock = async (req, res) => {
  const blockName = req.params.name;
  const block = parsedData.blocks?.[blockName];

  if (!block) {
    return res.status(404).json({ error: `Block "${blockName}" not found` });
  }

  res.json(block);
};

exports.getAllEntities = async (req, res) => {
  const combinedEntities = [...parsedData.entities]; // Top-level entities

  // Add resolved block entities, with optional metadata
  Object.values(parsedData.blocks).forEach(block => {
    if (block.resolvedEntities?.length) {
      const taggedEntities = block.resolvedEntities.map(ent => ({
        ...ent,
        fromBlock: block.name
      }));
      combinedEntities.push(...taggedEntities);
    }
  });

  res.json({
    fileName: parsedData.fileName,
    totalEntities: combinedEntities.length,
    blocks: Object.keys(parsedData.blocks).length,
    entities: combinedEntities
  });
};
