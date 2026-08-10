const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let replyToMessage = null;

function selectMessageForReply(message) {

    startReply(message);

}
// ===============================
// UTILISATEUR CONNECTÉ
// ===============================

async function getCurrentUser() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        console.error("Utilisateur non connecté :", error);
        return null;
    }

    currentUser = data.user;

    console.log("Utilisateur connecté :", currentUser.email);

    return currentUser;
}


// ===============================
// AFFICHER UN MESSAGE
// ===============================

function displayMessage(message) {

    const div = document.createElement("div");

    div.classList.add("message");

div.addEventListener("click", () => {
    selectMessageForReply(message);
});
    const messageEmail = (message.user_email || "")
        .trim()
        .toLowerCase();

    const currentEmail = (currentUser?.email || "")
        .trim()
        .toLowerCase();

    console.log("Message :", message.message);
    console.log("Email du message :", messageEmail);
    console.log("Email connecté :", currentEmail);

    // Message de la personne connectée → DROITE
    if (messageEmail === currentEmail) {

        div.classList.add("me");

    }

    // Message de l'autre personne → GAUCHE
    else {

        div.classList.add("other");

    }

  // ===============================
// CONTENU DE LA BULLE
// ===============================

if (message.reply_to_text) {

    const replyBox = document.createElement("div");
    replyBox.className = "reply-preview";

    replyBox.textContent = message.reply_to_text;

    div.appendChild(replyBox);
}

const textBox = document.createElement("div");
textBox.className = "message-text";
textBox.textContent = message.message;

div.appendChild(textBox);

const time = document.createElement("div");
time.className = "message-time";

time.textContent = new Date(
    message.created_at
).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
});

div.appendChild(time);
// Appui long sur mobile pour répondre
let pressTimer;

div.addEventListener("touchstart", function () {

    pressTimer = setTimeout(function () {

        startReply(message);

    }, 600);

});

div.addEventListener("touchend", function () {

    clearTimeout(pressTimer);

});

div.addEventListener("touchmove", function () {

    clearTimeout(pressTimer);

});
    messagesContainer.appendChild(div);

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}


// ===============================
// CHARGER LES MESSAGES
// ===============================

async function loadMessages() {

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {

        console.error(
            "Erreur chargement des messages :",
            error
        );

        return;
    }

    messagesContainer.innerHTML = "";

    data.forEach(message => {

        displayMessage(message);

    });
}


// ===============================
// ENVOYER UN MESSAGE
// ===============================
async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) return;

    if (!currentUser) {
        await getCurrentUser();
    }

    if (!currentUser) {
        console.error("Utilisateur non connecté");
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .insert({
            user_email: currentUser.email,
            message: text,
            reply_to_text: replyToMessage
    ? replyToMessage.message
    : null
        });

    if (error) {
        console.error(
            "Erreur envoi du message :",
            error
        );
        return;
    }

    messageInput.value = "";

replyToMessage = null;

const replyBox =
    document.getElementById("replyBox");

if (replyBox) {
    replyBox.style.display = "none";
}

messageInput.placeholder =
    "Écris-moi quelque chose... ❤️";

messageInput.focus();
}


// ===============================
// BOUTON ENVOYER
// ===============================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// ===============================
// TOUCHE ENTRÉE
// ===============================

messageInput.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {

            e.preventDefault();

            sendMessage();

        }

    }
);


// ===============================
// REALTIME
// ===============================

supabaseClient
    .channel("messages-realtime")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "messages"
        },
        (payload) => {

            console.log(
                "Nouveau message :",
                payload.new
            );

            displayMessage(payload.new);

        }
    )
    .subscribe();


// ===============================
// DÉCONNEXION
// ===============================

logoutBtn.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        window.location.href =
            "index.html";

    }
);

// ===============================
// RÉPONDRE À UN MESSAGE
// ===============================

function startReply(message) {

    replyToMessage = message;

    let replyBox = document.getElementById("replyBox");

    if (!replyBox) {

        replyBox = document.createElement("div");

        replyBox.id = "replyBox";

        replyBox.innerHTML = `
            <div class="reply-preview">
                <strong id="replyUser"></strong>
                <div id="replyText"></div>
            </div>

            <button id="cancelReply" type="button">
                ×
            </button>
        `;

        const messageBox =
            document.querySelector(".message-box");

        messageBox.parentNode.insertBefore(
            replyBox,
            messageBox
        );

        document
            .getElementById("cancelReply")
            .addEventListener("click", cancelReply);
    }

    document.getElementById("replyUser").textContent =
        message.user_email === "lalita@gmail.com"
            ? "LALITA"
            : "SIPOUEH";

    document.getElementById("replyText").textContent =
        message.message;

    replyBox.style.display = "flex";

    messageInput.focus();
}


// ===============================
// ANNULER LA RÉPONSE
// ===============================

function cancelReply() {

    replyToMessage = null;

    const replyBox =
        document.getElementById("replyBox");

    if (replyBox) {
        replyBox.style.display = "none";
    }

    messageInput.focus();
}

// ===============================
// DÉMARRAGE
// ===============================

async function startChat() {

    await getCurrentUser();

    await loadMessages();

}

startChat();
