// backend/tests/blockParser.test.js
const parseDXF = require('../utils/parseDXF');
const fs = require('fs');

test('parses DXF and extracts blocks', () => {
  const content = fs.readFileSync(__dirname + '/test_blocks.dxf', 'utf-8');
  const blocks = parseDXF(content);
  expect(Array.isArray(blocks)).toBe(true);
  expect(blocks.length).toBeGreaterThan(0);
});
