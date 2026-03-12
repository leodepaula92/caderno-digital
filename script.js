import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAcQ-eIuJLxLCelWXb40BBWSo6OlndAWoY",
    authDomain: "meu-caderno-digital.firebaseapp.com",
    databaseURL: "https://meu-caderno-digital-default-rtdb.firebaseio.com",
    projectId: "meu-caderno-digital",
    storageBucket: "meu-caderno-digital.firebasestorage.app",
    messagingSenderId: "300654804825",
    appId: "1:300654804825:web:4272fc4c67be0b485d1648"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let userLogado = null;
let todasNotas = {};

// --- LÓGICA DOS FILTROS COM COR ---
window.filtrar = (tipo, valor, elemento) => {
    // Remove 'active' de TODOS os botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Adiciona 'active' no botão clicado
    if (elemento) elemento.classList.add('active');
    else document.getElementById('btnTudo').classList.add('active');

    if (tipo === 'todas') renderizar(todasNotas);
    else renderizar(todasNotas, tipo, valor);
};

// ... Restante das funções (renderizar, salvar, prepararEdicao, etc) ...
// OBS: Ao gerar os botões no atualizarFiltros(), use: 
// onclick="filtrar('tag', '${t}', this)"
