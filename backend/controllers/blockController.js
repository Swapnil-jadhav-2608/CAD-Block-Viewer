// backend/controllers/blockController.js
const fileController = require('./fileController');

exports.getBlocks = (req, res) => {
  // Get blocks from the parsedData in fileController
  const blocks = Object.values(fileController.parsedData.blocks);
  res.status(200).json({ blocks });
};

exports.getBlockByName = (req, res) => {
  const blockName = req.params.name;
  const block = fileController.parsedData.blocks[blockName];
  
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }

  res.status(200).json(block);
};