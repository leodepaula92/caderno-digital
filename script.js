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

// --- AUTH ---
const btnAuth = document.getElementById('btn-auth');
const btnSwitch = document.getElementById('btn-switch');
let isLogin = true;

btnSwitch.onclick = (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    document.getElementById('btn-auth').innerText = isLogin ? "Entrar" : "Cadastrar";
};

btnAuth.onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(isLogin) signInWithEmailAndPassword(auth, email, pass).catch(e => alert(e.message));
    else createUserWithEmailAndPassword(auth, email, pass).catch(e => alert(e.message));
};

document.getElementById('btn-sair').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        userLogado = user;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = "Logado como: " + user.email;
        iniciarApp(user.uid);
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});

// --- CADERNO E FILTROS ---
function iniciarApp(uid) {
    onValue(ref(db, `usuarios/${uid}/notas`), (snapshot) => {
        todasNotas = snapshot.val() || {};
        renderizar(todasNotas);
        atualizarFiltros(todasNotas);
    });
}

window.filtrar = (tipo, valor, el) => {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if(el) el.classList.add('active');
    else document.getElementById('btnTudo').classList.add('active');

    if(tipo === 'todas') renderizar(todasNotas);
    else renderizar(todasNotas, tipo, valor);
};

function renderizar(notas, tipoF = null, valorF = null) {
    const lista = document.getElementById('listaNotas');
    lista.innerHTML = "";
    Object.keys(notas).reverse().forEach(id => {
        const n = notas[id];
        const arrayMats = n.materia ? n.materia.split(',').map(s => s.trim()) : [];
        const arrayTags = n.tags ? n.tags.split(',').map(s => s.trim()) : [];

        if(tipoF === 'materia' && !arrayMats.includes(valorF)) return;
        if(tipoF === 'tag' && !arrayTags.includes(valorF)) return;

        lista.innerHTML += `
            <div class="note-item">
                <div class="actions">
                    <button class="btn-action" style="background:#f1c40f" onclick="prepararEdicao('${id}')">✏️</button>
                    <button class="btn-action" style="background:#ff7675" onclick="apagar('${id}')">🗑️</button>
                </div>
                <div>
                    ${arrayMats.map(m => `<span class="badge badge-materia">${m}</span>`).join('')}
                    ${arrayTags.map(t => `<span class="badge badge-tag">${t}</span>`).join('')}
                </div>
                <small>${n.data || ''}</small>
                <h3>${n.assunto}</h3>
                <p>${n.conteudo}</p>
            </div>`;
    });
}

function atualizarFiltros(notas) {
    const mats = new Set(); const tags = new Set();
    Object.values(notas).forEach(n => {
        if(n.materia) n.materia.split(',').forEach(m => mats.add(m.trim()));
        if(n.tags) n.tags.split(',').forEach(t => tags.add(t.trim()));
    });
    document.getElementById('filtroMaterias').innerHTML = Array.from(mats).map(m => `<button class="filter-btn" onclick="filtrar('materia', '${m}', this)">${m}</button>`).join('');
    document.getElementById('filtroTags').innerHTML = Array.from(tags).map(t => `<button class="filter-btn" onclick="filtrar('tag', '${t}', this)">${t}</button>`).join('');
}

// Funções globais para os botões funcionarem
window.prepararEdicao = (id) => {
    const n = todasNotas[id];
    document.getElementById('edit-id').value = id;
    document.getElementById('assunto').value = n.assunto;
    document.getElementById('materia').value = n.materia || "";
    document.getElementById('tags').value = n.tags || "";
    document.getElementById('conteudo').value = n.conteudo;
    document.getElementById('btnSalvar').innerText = "Atualizar Nota";
    document.getElementById('btnCancelar').style.display = "block";
};

window.apagar = (id) => { if(confirm("Apagar?")) remove(ref(db, `usuarios/${userLogado.uid}/notas/${id}`)); };

document.getElementById('btnSalvar').onclick = () => {
    const id = document.getElementById('edit-id').value;
    const dados = {
        assunto: document.getElementById('assunto').value,
        materia: document.getElementById('materia').value,
        tags: document.getElementById('tags').value,
        conteudo: document.getElementById('conteudo').value,
        data: new Date().toLocaleDateString('pt-BR')
    };
    if(id) update(ref(db, `usuarios/${userLogado.uid}/notas/${id}`), dados).then(() => cancelarEdicao());
    else push(ref(db, `usuarios/${userLogado.uid}/notas`), dados);
    limparCampos();
};

window.cancelarEdicao = () => {
    document.getElementById('edit-id').value = "";
    document.getElementById('btnSalvar').innerText = "Salvar no Caderno";
    document.getElementById('btnCancelar').style.display = "none";
    limparCampos();
};

function limparCampos() {
    document.getElementById('assunto').value = ""; document.getElementById('materia').value = "";
    document.getElementById('tags').value = ""; document.getElementById('conteudo').value = "";
}

document.getElementById('btnTudo').onclick = () => filtrar('todas');
