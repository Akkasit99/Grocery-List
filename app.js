// Grocery List App
class GroceryListApp {
    constructor() {
        this.groceryList = [];
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.loadFromURL();
        this.bindEvents();
        this.renderList();
        this.updateStats();
        this.registerServiceWorker();
        this.handleInstallPrompt();
    }

    // Event Bindings
    bindEvents() {
        // Add item form
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addItem();
            });
        }

        // Install app button
        const installAppBtn = document.getElementById('installAppBtn');
        if (installAppBtn) {
            installAppBtn.addEventListener('click', () => {
                this.installApp();
            });
        }

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.showShareModal();
            });
        }

        // Copy URL button
        const copyUrlBtn = document.getElementById('copyUrlBtn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                this.copyShareUrl();
            });
        }

        // Modal close events
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    // Add new item
    addItem() {
        const nameInput = document.getElementById('itemName');
        const priceInput = document.getElementById('itemPrice');
        const quantityInput = document.getElementById('itemQuantity');

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value) || 0;
        const quantity = parseInt(quantityInput.value) || 1;

        if (!name) {
            alert('กรุณาใส่ชื่อสินค้า');
            return;
        }

        const item = {
            id: Date.now().toString(),
            name,
            price,
            quantity,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.groceryList.push(item);
        this.saveToStorage();
        this.renderList();
        this.updateStats();

        // Clear form
        nameInput.value = '';
        priceInput.value = '';
        quantityInput.value = '1';
        nameInput.focus();
    }

    // Edit item
    editItem(id) {
        const item = this.groceryList.find(item => item.id === id);
        if (!item) return;

        const newName = prompt('แก้ไขชื่อสินค้า:', item.name);
        if (newName === null) return;

        const newPrice = prompt('แก้ไขราคา:', item.price);
        if (newPrice === null) return;

        const newQuantity = prompt('แก้ไขจำนวน:', item.quantity);
        if (newQuantity === null) return;

        item.name = newName.trim() || item.name;
        item.price = parseFloat(newPrice) || 0;
        item.quantity = parseInt(newQuantity) || 1;

        this.saveToStorage();
        this.renderList();
        this.updateStats();
    }

    // Delete item
    deleteItem(id) {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            this.groceryList = this.groceryList.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderList();
            this.updateStats();
        }
    }

    // Toggle item completion
    toggleItem(id) {
        const item = this.groceryList.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveToStorage();
            this.renderList();
            this.updateStats();
        }
    }

    // Render grocery list
    renderList() {
        const listContainer = document.getElementById('groceryList');
        
        if (this.groceryList.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>ยังไม่มีรายการสินค้า</p>
                    <p>เพิ่มสินค้าแรกของคุณเลย!</p>
                </div>
            `;
            return;
        }

        const itemsHtml = this.groceryList.map(item => `
            <div class="grocery-item ${item.completed ? 'completed' : ''}">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-name">${this.escapeHtml(item.name)}</div>
                        <div class="item-details">
                            <span>ราคา: ฿${item.price.toFixed(2)}</span>
                            <span>จำนวน: ${item.quantity}</span>
                            <span>รวม: ฿${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="app.editItem('${item.id}')">
                            ✏️
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteItem('${item.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="checkbox-container">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} 
                           onchange="app.toggleItem('${item.id}')">
                    <label>เสร็จแล้ว</label>
                </div>
            </div>
        `).join('');

        listContainer.innerHTML = itemsHtml;
    }

    // Update statistics
    updateStats() {
        const totalItems = this.groceryList.length;
        const totalPrice = this.groceryList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const completedItems = this.groceryList.filter(item => item.completed).length;

        document.getElementById('itemCount').textContent = `${totalItems} รายการ (เสร็จ ${completedItems})`;
        document.getElementById('totalPrice').textContent = `รวม: ฿${totalPrice.toFixed(2)}`;
    }

    // Save to localStorage
    saveToStorage() {
        localStorage.setItem('groceryList', JSON.stringify(this.groceryList));
    }

    // Load from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('groceryList');
        if (saved) {
            try {
                this.groceryList = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading from storage:', e);
                this.groceryList = [];
            }
        }
    }

    // Load from URL (shared list)
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('list');
        
        if (sharedData) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(sharedData));
                if (Array.isArray(decodedData)) {
                    // Ask user if they want to load the shared list
                    if (confirm('พบรายการที่แชร์มา คุณต้องการโหลดรายการนี้หรือไม่?')) {
                        this.groceryList = decodedData;
                        this.saveToStorage();
                        // Remove the parameter from URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            } catch (e) {
                console.error('Error loading shared list:', e);
            }
        }
    }

    // Generate share URL
    generateShareUrl() {
        const data = encodeURIComponent(JSON.stringify(this.groceryList));
        return `${window.location.origin}${window.location.pathname}?list=${data}`;
    }

    // Show share modal
    showShareModal() {
        const shareUrl = this.generateShareUrl();
        document.getElementById('shareUrl').value = shareUrl;
        document.getElementById('shareModal').classList.add('show');
    }



    // Copy share URL
    async copyShareUrl() {
        const shareUrlInput = document.getElementById('shareUrl');
        
        try {
            await navigator.clipboard.writeText(shareUrlInput.value);
            
            // Show feedback
            const copyBtn = document.getElementById('copyUrlBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'คัดลอกแล้ว!';
            copyBtn.style.background = '#4CAF50';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        } catch (error) {
            // Fallback for older browsers
            shareUrlInput.select();
            document.execCommand('copy');
            alert('คัดลอกลิงก์แล้ว!');
        }
    }

    // Register Service Worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Install app function
    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('Install prompt outcome:', outcome);
            
            if (outcome === 'accepted') {
                this.hideInstallButton();
            }
            
            this.deferredPrompt = null;
        }
    }

    // Show install button
    showInstallButton() {
        const installAppBtn = document.getElementById('installAppBtn');
        if (installAppBtn) {
            installAppBtn.style.display = 'inline-flex';
        }
    }

    // Hide install button
    hideInstallButton() {
        const installAppBtn = document.getElementById('installAppBtn');
        if (installAppBtn) {
            installAppBtn.style.display = 'none';
        }
    }

    // Handle PWA install prompt
    handleInstallPrompt() {
        this.deferredPrompt = null;
        const installPrompt = document.getElementById('installPrompt');
        const installBtn = document.getElementById('installBtn');
        const dismissBtn = document.getElementById('dismissBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install button in header
            this.showInstallButton();
            
            // Show install prompt if not dismissed before
            if (!localStorage.getItem('installPromptDismissed')) {
                setTimeout(() => {
                    if (installPrompt) {
                        installPrompt.style.display = 'block';
                    }
                }, 3000); // Show after 3 seconds
            }
        });

        // Handle app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                await this.installApp();
                if (installPrompt) {
                    installPrompt.style.display = 'none';
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (installPrompt) {
                    installPrompt.style.display = 'none';
                }
                localStorage.setItem('installPromptDismissed', 'true');
            });
        }
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Close modal function (global)
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GroceryListApp();
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
    document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    document.body.classList.add('offline');
});