document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    setupImageUpload();
    document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);
});

function setupImageUpload() {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const uploadContainer = document.getElementById('uploadContainer');

    
    uploadContainer.addEventListener('click', () => {
        imageUpload.click();
    });

   
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#2563eb';
        uploadContainer.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
    });

    uploadContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#e5e7eb';
        uploadContainer.style.backgroundColor = 'transparent';
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#e5e7eb';
        uploadContainer.style.backgroundColor = 'transparent';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            imageUpload.files = e.dataTransfer.files;
            handleImagePreview(file);
        } else {
            showNotification('Please upload an image file', 'error');
        }
    });

    
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImagePreview(file);
        } else {
            showNotification('Please upload an image file', 'error');
            imageUpload.value = '';
        }
    });
}

function handleImagePreview(file) {
    const imagePreview = document.getElementById('imagePreview');
    const reader = new FileReader();
    
    reader.onload = (e) => {
        imagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <p class="file-name">${file.name}</p>
        `;
    };
    reader.readAsDataURL(file);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    const formData = new FormData();
    
    
    const name = document.getElementById('name').value;
    const category = document.getElementById('category').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const imageFile = document.getElementById('imageUpload').files[0];

    
    if (!name || !category || !quantity || !price) {
        showNotification('Please fill in all required fields', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Inventory';
        return;
    }

  
    formData.append('name', name);
    formData.append('category', category);
    formData.append('quantity', quantity);
    formData.append('price', price);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        
        document.getElementById('itemForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        await loadInventory();
        
        showNotification('Item added successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding item: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Inventory';
    }
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);

    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

async function loadInventory() {
    try {
        const response = await fetch('/api/items');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const items = await response.json();
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Error loading inventory: ' + error.message, 'error');
    }
}

function displayInventory(items) {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '';

    if (items.length === 0) {
        inventoryList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No items in inventory</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                ${item.imageUrl 
                    ? `<img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='placeholder.jpg'">`
                    : `<div class="no-image"><i class="fas fa-image"></i></div>`
                }
            </div>
            <div class="item-details">
                <h3 class="item-name">${item.name}</h3>
                <span class="item-category">${item.category}</span>
                <div class="item-info">
                    <div>
                        <p class="item-price">$${parseFloat(item.price).toFixed(2)}</p>
                        <p class="item-quantity">Quantity: ${item.quantity}</p>
                    </div>
                    <button onclick="deleteItem(${item.id})" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        inventoryList.appendChild(card);
    });
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await loadInventory();
        showNotification('Item deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Error deleting item: ' + error.message, 'error');
    }
}