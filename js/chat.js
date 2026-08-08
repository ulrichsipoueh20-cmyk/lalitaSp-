const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;


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

    return currentUser;
}


// ===============================
// AFFICHER UN MESSAGE
// ===============================

function displayMessage(message) {

    const div = document.createElement("div");

    div.classList.add("message");

    // Si le message appartient à l'utilisateur connecté
    if (
        currentUser &&
        message.user_email &&
        message.user_email.toLowerCase() === currentUser.email.toLowerCase()
    ) {

        div.classList.add("me");

    } else {

        div.classList.add("other");

    }

    div.textContent = message.message;

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
            message: text
        });

    if (error) {

        console.error(
            "Erreur envoi du message :",
            error
        );

        return;
    }

    messageInput.value = "";

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
// ENTRÉE CLAVIER
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
// MESSAGES EN TEMPS RÉEL
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
// DÉMARRAGE DU CHAT
// ===============================

async function startChat() {

    await getCurrentUser();

    await loadMessages();

}

startChat();
