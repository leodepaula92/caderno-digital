import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
    document.getElementById('auth-title').innerText = isLogin ? "Login" : "Cadastro";
    btnAuth.innerText = isLogin ? "Entrar" : "Cadastrar";
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

// --- FUNÇÕES DE MODAL ---
window.abrirModalCadastro = () => {
    document.getElementById('modalForm').style.display = 'flex';
    document.getElementById('modalTitulo').innerText = "Nova Nota";
    limparForm();
};

window.fecharModalCadastro = () => {
    document.getElementById('modalForm').style.display = 'none';
};

window.fecharModalLeitura = () => {
    document.getElementById('modalLeitura').style.display = 'none';
};

// --- LOGICA APP ---
function iniciarApp(uid) {
    onValue(ref(db, `usuarios/${uid}/notas`), (snapshot) => {
        todasNotas = snapshot.val() || {};
        renderizar(todasNotas);
        atualizarFiltros(todasNotas);
    });
}

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
            <div class="note-item" onclick="verNota('${id}')">
                <div>
                    ${arrayMats.map(m => `<span class="badge badge-materia">${m}</span>`).join('')}
                    ${arrayTags.map(t => `<span class="badge badge-tag">${t}</span>`).join('')}
                </div>
                <h3>${n.assunto}</h3>
                <small style="color:gray">${n.data || ''}</small>
            </div>`;
    });
}

window.verNota = (id) => {
    const n = todasNotas[id];
    document.getElementById('leituraTitulo').innerText = n.assunto;
    document.getElementById('leituraData').innerText = "Criado em: " + n.data;
    document.getElementById('leituraConteudo').innerText = n.conteudo;
    
    // Badges no Modal
    const arrayMats = n.materia ? n.materia.split(',').map(s => s.trim()) : [];
    const arrayTags = n.tags ? n.tags.split(',').map(s => s.trim()) : [];
    document.getElementById('leituraBadges').innerHTML = 
        arrayMats.map(m => `<span class="badge badge-materia">${m}</span>`).join('') +
        arrayTags.map(t => `<span class="badge badge-tag">${t}</span>`).join('');

    // Botões de Ação
    document.getElementById('btnEditarLeitura').onclick = () => prepararEdicao(id);
    document.getElementById('btnApagarLeitura').onclick = () => apagar(id);

    document.getElementById('modalLeitura').style.display = 'flex';
};

window.prepararEdicao = (id) => {
    const n = todasNotas[id];
    fecharModalLeitura();
    document.getElementById('edit-id').value = id;
    document.getElementById('assunto').value = n.assunto;
    document.getElementById('materia').value = n.materia || "";
    document.getElementById('tags').value = n.tags || "";
    document.getElementById('conteudo').value = n.conteudo;
    document.getElementById('modalTitulo').innerText = "Editar Nota";
    document.getElementById('modalForm').style.display = 'flex';
};

window.apagar = (id) => {
    if(confirm("Deseja excluir esta nota permanentemente?")) {
        remove(ref(db, `usuarios/${userLogado.uid}/notas/${id}`));
        fecharModalLeitura();
    }
};

document.getElementById('btnSalvar').onclick = () => {
    const id = document.getElementById('edit-id').value;
    const dados = {
        assunto: document.getElementById('assunto').value,
        materia: document.getElementById('materia').value,
        tags: document.getElementById('tags').value,
        conteudo: document.getElementById('conteudo').value,
        data: new Date().toLocaleDateString('pt-BR')
    };
    if(id) update(ref(db, `usuarios/${userLogado.uid}/notas/${id}`), dados);
    else push(ref(db, `usuarios/${userLogado.uid}/notas`), dados);
    fecharModalCadastro();
};

// BUSCA
document.getElementById('inputBusca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtradas = {};
    Object.keys(todasNotas).forEach(id => {
        const n = todasNotas[id];
        if((n.assunto + n.conteudo + n.materia + n.tags).toLowerCase().includes(termo)) filtradas[id] = n;
    });
    renderizar(filtradas);
});

function atualizarFiltros(notas) {
    const mSet = new Set(); const tSet = new Set();
    Object.values(notas).forEach(n => {
        if(n.materia) n.materia.split(',').forEach(m => mSet.add(m.trim()));
        if(n.tags) n.tags.split(',').forEach(t => tSet.add(t.trim()));
    });
    document.getElementById('filtroMaterias').innerHTML = Array.from(mSet).map(m => `<button class="filter-btn" onclick="filtrar('materia', '${m}', this)">${m}</button>`).join('');
    document.getElementById('filtroTags').innerHTML = Array.from(tSet).map(t => `<button class="filter-btn" onclick="filtrar('tag', '${t}', this)">${t}</button>`).join('');
}

window.filtrar = (tipo, valor, el) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    if(tipo === 'todas') renderizar(todasNotas);
    else renderizar(todasNotas, tipo, valor);
};

function limparForm() {
    document.getElementById('edit-id').value = "";
    document.getElementById('assunto').value = "";
    document.getElementById('materia').value = "";
    document.getElementById('tags').value = "";
    document.getElementById('conteudo').value = "";
}
