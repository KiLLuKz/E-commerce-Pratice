console.log("Auth.js is loaded!");
import { showPopup, initPopup } from './utils.js';
import { supabase } from './supabaseClient.js'; // นำเข้า supabase client
import '../css/auth.css';

initPopup();

// --- Elements สำหรับสลับหน้า ---
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const authTitle = document.querySelector('#auth-title');
const toRegisterBtn = document.querySelector('#to-register');
const toLoginBtn = document.querySelector('#to-login');

// --- Elements สำหรับ Input ---
const emailInput = document.querySelector('#login-email');
const emailError = document.querySelector('#email-error');
const passwordInput = document.querySelector('#login-password');

const regEmailInput = document.querySelector('#reg-email');
const regEmailError = document.querySelector('#reg-email-error');
const regPassword = document.querySelector('#reg-password');
const regConfirmPassword = document.querySelector('#reg-confirm-password');

// --- ฟังก์ชันสำหรับเคลียร์ค่าใน Field ---
const clearAllInputs = () => {
    const allInputs = document.querySelectorAll('input');
    const allErrors = document.querySelectorAll('.error-text');
    allInputs.forEach(input => {
        input.value = '';
        input.classList.remove('input-error');
    });
    allErrors.forEach(error => error.classList.add('hidden'));
};

// --- Event Listeners สำหรับสลับหน้า ---
toRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearAllInputs();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authTitle.innerText = "สมัครสมาชิก";
});

toLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearAllInputs();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authTitle.innerText = "เข้าสู่ระบบ";
});

// --- Validation ขณะพิมพ์ ---
const validateEmail = (input, errorElement) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.value) && input.value !== "") {
        errorElement.classList.remove('hidden');
        input.classList.add('input-error');
    } else {
        errorElement.classList.add('hidden');
        input.classList.remove('input-error');
    }
};

emailInput.addEventListener('input', () => validateEmail(emailInput, emailError));
regEmailInput.addEventListener('input', () => validateEmail(regEmailInput, regEmailError));

[passwordInput, regPassword, regConfirmPassword].forEach(input => {
    input.addEventListener('input', () => input.classList.remove('input-error'));
});

// --- Login Submit (ในอนาคตจะเชื่อมกับ supabase.auth.signInWithPassword) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ตอนนี้ยังจำลองไว้ก่อน
    const isLoginSuccess = false; 
    if (!isLoginSuccess) {
        showPopup("รหัสผ่านหรืออีเมลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        passwordInput.value = '';
        passwordInput.focus();
        [emailInput, passwordInput].forEach(el => el.classList.add('input-error'));
    }
});

// --- Register Submit (เชื่อมต่อ Supabase จริง) ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = regEmailInput.value;
    const password = regPassword.value;
    const username = document.querySelector('#reg-username').value;

    if (password !== regConfirmPassword.value) {
        showPopup("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
        regConfirmPassword.classList.add('input-error');
        regConfirmPassword.focus();
        return;
    }

    // ส่งข้อมูลไปสมัครสมาชิกที่ Supabase
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { display_name: username }
        }
    });

    if (error) {
        showPopup(error.message); 
    } else {
        showPopup("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน", true);
        
        // --- ส่วนที่เพิ่มใหม่ ---
        // 1. จำอีเมลไว้ใช้ในหน้า verify
        sessionStorage.setItem('verifyEmail', email); 
        
        // 2. รอ 2 วินาทีแล้วเด้งไปหน้า Verify
        setTimeout(() => {
            window.location.href = 'verify.html'; 
        }, 2000);
    }
});