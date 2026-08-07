const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;


// Vérifier que l'utilisateur est connecté
async function checkUser() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = data.user;

    loadMessages();
}


// Charger les messages
async function loadMessages() {

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Erreur :", error);
        return;
    }

    messagesContainer.innerHTML = "";

    data.forEach(message => {

        const div = document.createElement("div");

        div.classList.add("message");

        if (message.user_email === currentUser.email) {
            div.classList.add("me");
        } else {
            div.classList.add("other");
        }

        div.textContent = message.message;

        messagesContainer.appendChild(div);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// Envoyer un message
sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendMessage();
    }

});


async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .insert([
            {
                user_email: currentUser.email,
                message: text
            }
        ]);

    if (error) {
        console.error("Erreur d'envoi :", error);
        return;
    }

    messageInput.value = "";

    loadMessages();
}


// Déconnexion
logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    window.location.href = "index.html";

});


// Démarrer le chat
checkUser();