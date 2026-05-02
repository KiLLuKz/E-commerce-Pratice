// src/utils.js

export function showPopup(message, isSuccess = false) {
    const popup = document.querySelector('#custom-popup');
    const msgTag = document.querySelector('#popup-message');
    const iconTag = document.querySelector('#popup-icon');

    if (popup && msgTag && iconTag) {
        msgTag.innerText = message;
        iconTag.innerText = isSuccess ? "✅" : "❌";
        popup.classList.remove('hidden');
    }
}

export function initPopup() {
    const closeBtn = document.querySelector('#close-popup');
    const popup = document.querySelector('#custom-popup');
    
    if (closeBtn && popup) {
        closeBtn.addEventListener('click', () => {
            popup.classList.add('hidden');
        });
    }
}