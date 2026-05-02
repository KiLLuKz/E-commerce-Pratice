import { showPopup, initPopup } from './utils.js';
import { supabase } from './supabaseClient.js';
import '../css/auth.css';

initPopup();

// ดึงอีเมลที่เพิ่งสมัครมาจาก sessionStorage
const userEmail = sessionStorage.getItem('verifyEmail');

// ถ้าไม่มีอีเมล (เช่น มีคนแอบพิมพ์ URL เข้าหน้านี้ตรงๆ) ให้เด้งกลับไปหน้าแรก
if (!userEmail) {
    window.location.href = 'index.html';
} else {
    // โชว์อีเมลให้ User รู้ตัวนิดนึงว่ากำลังยืนยันของใครอยู่ (ทำหรือไม่ทำก็ได้)
    console.log("กำลังยืนยันอีเมล:", userEmail);
}

// --- OTP Input Logic (บังคับเฉพาะตัวเลข) ---
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
    // ใช้ input event สำหรับจัดการค่าที่กรอกเข้ามา (รองรับทั้งการพิมพ์ปกติและ Ctrl+V)
    input.addEventListener('input', (e) => {
        // บังคับให้เป็นตัวเลขเท่านั้น
        input.value = input.value.replace(/[^0-9]/g, '');
        
        // ถ้าพิมพ์ตัวเลขลงไป ให้ย้ายโฟกัสไปช่องถัดไป
        // e.inputType === 'insertText' คือการพิมพ์ปกติ
        if (input.value && e.inputType === 'insertText' && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    // ใช้ keydown สำหรับดักจับปุ่มพิเศษ เช่น Backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
                // ถ้าช่องปัจจุบันว่าง ให้ถอยไปลบช่องก่อนหน้า
                otpInputs[index - 1].focus();
            } else if (input.value) {
                // ถ้ามีค่าอยู่แล้วก็แค่ลบค่าในช่องนั้น (ปล่อยให้เบราว์เซอร์จัดการ)
            }
        }
    });

    // ดักจับการ Paste (Ctrl+V) ให้แม่นยำขึ้น
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const rawData = e.clipboardData.getData('text');
        // กรองเอาเฉพาะตัวเลข ตัดมาแค่ 6 ตัว นับตั้งแต่ช่องปัจจุบัน
        const data = rawData.replace(/[^0-9]/g, '').slice(0, otpInputs.length - index); 

        if (data.length === 0) return; 

        const dataArray = data.split('');
        dataArray.forEach((char, i) => {
            if (otpInputs[index + i]) {
                otpInputs[index + i].value = char;
            }
        });

        // เลื่อน Focus ไปช่องสุดท้ายที่มีข้อมูล
        const lastIndex = Math.min(index + dataArray.length - 1, otpInputs.length - 1);
        otpInputs[lastIndex].focus();
    });
});

const getOTPValue = () => {
    let otp = "";
    otpInputs.forEach(input => otp += input.value);
    return otp;
};

// --- Cooldown Logic สำหรับปุ่มส่งรหัสใหม่ ---
const resendBtn = document.querySelector('#resend-btn');
let countdownInterval;

const startCooldown = (seconds = 60) => {
    let timeLeft = seconds;
    resendBtn.disabled = true; 
    resendBtn.classList.add('disabled-btn');
    resendBtn.innerText = `ส่งรหัสใหม่ได้ใน ${timeLeft} วินาที`;

    countdownInterval = setInterval(() => {
        timeLeft--;
        resendBtn.innerText = `ส่งรหัสใหม่ได้ใน ${timeLeft} วินาที`;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            resendBtn.disabled = false; 
            resendBtn.classList.remove('disabled-btn');
            resendBtn.innerText = "ส่งรหัสยืนยันใหม่";
        }
    }, 1000);
};

startCooldown(60);

// --- Resend Submit (เชื่อม Backend) ---
resendBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (resendBtn.disabled) return;

    // ยิง API ขอรหัสใหม่ไปที่ Supabase
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
    });

    if (error) {
        showPopup(error.message);
    } else {
        showPopup("ส่งรหัสยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมล", true);
        startCooldown(60); 
    }
});

// --- Verify Submit (เชื่อม Backend) ---
document.querySelector('#verify-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const otpCode = getOTPValue();
    
    if (otpCode.length < 6) {
        showPopup("กรุณากรอกรหัสให้ครบ 6 หลัก");
        otpInputs.forEach(input => {
            if(!input.value) input.classList.add('input-error');
        });
        return;
    }
    
    otpInputs.forEach(input => input.classList.remove('input-error'));
    
    // ยิง API เพื่อส่งรหัส 6 หลักไปตรวจที่ Supabase
    const { data, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'signup'
    });
    
    if (error) {
        showPopup("รหัสยืนยันไม่ถูกต้อง หรือหมดอายุแล้ว");
    } else {
        showPopup("ยืนยันตัวตนสำเร็จ!", true);
        
        // ล้างความจำชั่วคราวและเด้งกลับไปหน้าเข้าสู่ระบบ
        sessionStorage.removeItem('verifyEmail');
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 2000);
    }
});