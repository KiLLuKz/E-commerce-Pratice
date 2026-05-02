import './style.css'

const button = document.querySelector('#btn');
button.addEventListener('click', () => {
  document.querySelector('#title').innerText = 'ยินดีด้วย! JS ทำงานแล้ว';
});