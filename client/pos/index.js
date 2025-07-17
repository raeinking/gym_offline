let products = []; // To store the list of products fetched from the API
const checkoutItems = []; // Array to store checkout items
const tagsContainer = document.getElementById('tagsContainer');
let tags = []; // Array to store
// Function to fetch tags from API
function fetchTags() {
    const tagsApiUrl = 'http://localhost:3005/api/tags'; // Replace with your actual API URL for tags

    fetch(tagsApiUrl)
        .then(response => response.json())
        .then(data => {
            tags.push(data)
            displayTags(data);
        })
        .catch(error => console.error('Error fetching tags:', error));
}

function displayTags(tags) {
// Add 'All' button
const allButton = document.createElement('button');
allButton.textContent = 'All';
allButton.className = 'selected'; // Set as selected by default
allButton.onclick = () => {
filterProducts('');
selectTag(allButton);
};
tagsContainer.appendChild(allButton);

// Create buttons for each tag fetched from API
tags.forEach(tag => {
const button = document.createElement('button');
button.textContent = tag.name;
button.onclick = () => {
    filterProducts(tag.name);
    selectTag(button);
};
tagsContainer.appendChild(button);
});

// Fetch all products initially
fetchProducts();
}

function selectTag(selectedButton) {
// Remove 'selected' class from all buttons
const buttons = tagsContainer.querySelectorAll('button');
buttons.forEach(button => button.classList.remove('selected'));

// Add 'selected' class to the clicked button
selectedButton.classList.add('selected');
if (selectedButton.textContent == 'All') {
    fetchProducts()
}}



async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3005/api/products');
        if (response.ok) {
            products = await response.json();
            updateProductList(products); // Initially display all products
        } else {
            alert('Failed to fetch products. Please try again.');
        }
    } catch (error) {
        console.error('Error during fetch:', error);
        alert('An error occurred while fetching products. Please try again.');
    }
}

function updateProductList(productsToRender) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Clear existing content
    
    productsToRender.forEach(product => {
        const productBtn = document.createElement('button');
        productBtn.className = 'product-button';
        productBtn.id = `product-${product.id}`;
        productBtn.innerHTML = `
            <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto;">
            <span>${product.name}</span>
            <span>$${product.price}</span>
        `;
        productBtn.onclick = () => addToCheckout(product);
        productList.appendChild(productBtn);
    });
}

function addToCheckout(product) {
    const existingItem = checkoutItems.find(item => item._id === product._id);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        checkoutItems.push({ ...product, qty: 1 });
    }
    updateCheckout();
}

function updateCheckout() {
    const checkoutTableBody = document.getElementById('checkout-items');
    checkoutTableBody.innerHTML = ''; // Clear existing rows

    let total = 0;
    checkoutItems.forEach((item, index) => {
        total += item.price * item.qty;
        checkoutTableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>
                    <button class="qty-btn" onclick="decreaseQty('${item._id}')">-</button>
                    ${item.qty}
                    <button class="qty-btn" onclick="increaseQty('${item._id}')">+</button>
                </td>
                <td>$${item.price.toFixed(2)}</td>
                <td><button class="remove-btn" onclick="removeFromCheckout('${item._id}')">x</button></td>
            </tr>
        `;
    });

    document.getElementById('total-items').innerText = checkoutItems.length;
    const discountInput = document.getElementById('discount');
    discountInput.value = ''; // Reset value but keep it interactive
    discountInput.disabled = false; // Ensure it is not disabled
    discountInput.focus();
    discountInput.select();
    calculateTotal();
}

function decreaseQty(productId) {
    const product = checkoutItems.find(item => item._id === productId);
    if (product) {
        if (product.qty > 1) {
            product.qty--;
        } else {
            removeFromCheckout(productId);
        }
        updateCheckout();
    }
}

function increaseQty(productId) {
    const product = checkoutItems.find(item => item._id === productId);
    if (product) {
        product.qty++;
        updateCheckout();
    }
}

function removeFromCheckout(productId) {
    const index = checkoutItems.findIndex(item => item._id === productId);
    if (index > -1) {
        checkoutItems.splice(index, 1);
    }
    updateCheckout();
}

function calculateTotal() {
    const totalItems = checkoutItems.reduce((sum, item) => sum + item.qty, 0);
    const total = checkoutItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total').textContent = (total - discount).toFixed(2);
}
function filterProducts(tag) {
    let filteredProducts = products;
    const searchTerm = document.getElementById('search-bar').value.trim().toLowerCase();
    

    if (tag == '') {
        filteredProducts = filteredProducts.filter(product => product.tags.includes('all'));
    }

    if (tag) {
        filteredProducts = filteredProducts.filter(product => product.tags.includes(tag));
    }

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }

    updateProductList(filteredProducts);
}

document.getElementById('checkout-btn').onclick = async () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    
    const total = parseFloat(document.getElementById('total').textContent);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const price = (total + discount).toFixed(2);
    const saleData = {
        date: date,
        time: time,
        items: checkoutItems,
        total: total,
        discount: discount,
        price: price
    };

    try {
        const response = await fetch('http://localhost:3005/api/sale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        });

        if (response.ok) {
            checkoutItems.length = 0;
            updateCheckout();
        } else {
            alert('Failed to checkout. Please try again.');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred during checkout. Please try again.');
    }
};

document.getElementById('back-button').addEventListener('click', function () {
    if (confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
        window.history.back();
    }
});
document.addEventListener('keypress', function (e) {
if (e.key === 'Enter') {
    document.getElementById('checkout-btn').click();
    updateCheckout()
}
});

fetchTags();