const message = document.getElementById('message');
const blockList = document.getElementById('blockList');

function showMessage(text, type = 'info') {
  message.innerText = text;
  message.style.color = type === 'error' ? '#e74c3c' : '#2ecc71';
}

document.getElementById('uploadBtn').addEventListener('click', uploadFile);

async function uploadFile() {
  const fileInput = document.getElementById('fileInput');

  // 🧹 Clear previous content
  showMessage('');
  blockList.innerHTML = '';

  if (!fileInput.files[0]) {
    showMessage('Please choose a file.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!response.ok) {
      showMessage('Error: ' + (result.error || 'Unknown error.'), 'error');
      return;
    }

    showMessage(result.message);
    fetchBlocks();
  } catch (err) {
    console.error('Upload error:', err);
    showMessage('Error uploading file', 'error');
  }
}

async function fetchBlocks() {
  try {
    const res = await fetch('/api/blocks');
    const data = await res.json();

    if (!data.rows || !data.rows.length) {
      blockList.innerHTML = '<p>No blocks found.</p>';
      return;
    }

    blockList.innerHTML = '<h2>Blocks</h2>' +
      data.rows.map(b => `<div class="block-item" onclick="viewBlock(${b.id})">
                            ${b.name} (${b.type})
                          </div>`).join('');
  } catch (err) {
    console.error('Fetch blocks error:', err);
    blockList.innerHTML = 'Error fetching blocks.';
  }
}

async function viewBlock(id) {
  try {
    const res = await fetch('/api/blocks/' + id);
    const block = await res.json();
    alert(`🧱 Block Details:\n\nName: ${block.name}\nType: ${block.type}\nCoordinates: ${JSON.stringify(block.coordinates, null, 2)}`);
  } catch (err) {
    console.error('Error fetching block details:', err);
    alert('Error fetching block details.');
  }
}

// Initial load
fetchBlocks();
