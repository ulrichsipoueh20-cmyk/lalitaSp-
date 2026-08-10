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

    console.log("Utilisateur connecté :", currentUser.email);

    return currentUser;
}


// ===============================
// AFFICHER UN MESSAGE
// ===============================

function displayMessage(message) {

    const div = document.createElement("div");

    div.classList.add("message");

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

    div.textContent =
    message.message +
    "\n" +
    new Date(message.created_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
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
// DÉMARRAGE
// ===============================

async function startChat() {

    await getCurrentUser();

    await loadMessages();

}

startChat();
