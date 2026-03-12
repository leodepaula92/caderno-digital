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

// CONFIG QUILL
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Escreva aqui...',
    modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'color': [] }], ['link', 'blockquote'], [{ 'list': 'ordered'}, { 'list': 'bullet' }]] }
});

// LOGIN / CADASTRO
const btnAuth = document.getElementById('btn-auth');
const btnSwitch = document.getElementById('btn-switch');
let isLogin = true;

btnSwitch.onclick = (e) => {
    e.preventDefault(); isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? "Login" : "Cadastro";
    btnAuth.innerText = isLogin ? "Entrar" : "Cadastrar";
};

btnAuth.onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    if(isLogin) signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Erro no acesso."));
    else createUserWithEmailAndPassword(auth, email, pass).catch(() => alert("Erro ao cadastrar."));
};

// RECUPERAR SENHA
document.getElementById('btn-recuperar').onclick = (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    if(!email) return alert("Digite o e-mail primeiro.");
    sendPasswordResetEmail(auth, email).then(() => alert("E-mail enviado!")).catch(() => alert("Erro ao enviar."));
};

document.getElementById('btn-sair').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        userLogado = user;
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        document.getElementById('user-display').innerText = user.email;
        onValue(ref(db, `usuarios/${user.uid}/notas`), (snap) => {
            todasNotas = snap.val() || {};
            renderizar(todasNotas);
            atualizarFiltros(todasNotas);
        });
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
});

function renderizar(notas, tipoF = null, valorF = null) {
    const lista = document.getElementById('listaNotas');
    lista.innerHTML = "";
    Object.keys(notas).reverse().forEach(id => {
        const n = notas[id];
        const arrayMats = n.materia ? n.materia.split(',').map(s => s.trim()) : [];
        if(tipoF === 'materia' && !arrayMats.includes(valorF)) return;
        
        lista.innerHTML += `
            <div class="note-item" onclick="verNota('${id}')" style="border-left-color: ${n.cor || '#3498db'}">
                <small style="color:${n.cor}">${arrayMats[0] || ''}</small>
                <h3>${n.assunto}</h3>
                <div style="margin-top:auto"><small style="color:gray">${n.data || ''}</small></div>
            </div>`;
    });
}

window.verNota = (id) => {
    const n = todasNotas[id];
    document.getElementById('leituraTitulo').innerText = n.assunto;
    document.getElementById('leituraConteudo').innerHTML = n.conteudo;
    document.getElementById('leituraData').innerText = n.data;
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
    document.getElementById('corCard').value = n.cor || "#3498db";
    quill.root.innerHTML = n.conteudo;
    document.getElementById('modalForm').style.display = 'flex';
};

document.getElementById('btnSalvar').onclick = () => {
    const id = document.getElementById('edit-id').value;
    const dados = {
        assunto: document.getElementById('assunto').value,
        materia: document.getElementById('materia').value,
        tags: document.getElementById('tags').value,
        cor: document.getElementById('corCard').value,
        conteudo: quill.root.innerHTML,
        data: new Date().toLocaleDateString('pt-BR')
    };
    if(id) update(ref(db, `usuarios/${userLogado.uid}/notas/${id}`), dados);
    else push(ref(db, `usuarios/${userLogado.uid}/notas`), dados);
    fecharModalCadastro();
};

window.apagar = (id) => { if(confirm("Apagar?")) remove(ref(db, `usuarios/${userLogado.uid}/notas/${id}`)); fecharModalLeitura(); };
window.abrirModalCadastro = () => { document.getElementById('modalForm').style.display = 'flex'; limparForm(); };
window.fecharModalCadastro = () => document.getElementById('modalForm').style.display = 'none';
window.fecharModalLeitura = () => document.getElementById('modalLeitura').style.display = 'none';
function limparForm() { document.getElementById('edit-id').value = ""; document.getElementById('assunto').value = ""; quill.root.innerHTML = ""; }

function atualizarFiltros(notas) {
    const mSet = new Set();
    Object.values(notas).forEach(n => { if(n.materia) n.materia.split(',').forEach(m => mSet.add(m.trim())); });
    document.getElementById('filtroMaterias').innerHTML = Array.from(mSet).map(m => `<button class="filter-btn" onclick="filtrar('materia', '${m}', this)">${m}</button>`).join('');
}

window.filtrar = (tipo, valor, el) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    tipo === 'todas' ? renderizar(todasNotas) : renderizar(todasNotas, tipo, valor);
};
