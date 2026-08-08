
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");


// Afficher un message
async function displayMessage(message) {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const div = document.createElement("div");

    div.classList.add("message");

    // Vérifier si le message vient de l'utilisateur connecté
    if (user && message.user_email === user.email) {
        div.classList.add("me");
    } else {
        div.classList.add("other");
    }

    div.textContent = message.message;

    messagesContainer.appendChild(div);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// Charger les messages existants
async function loadMessages() {

    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Erreur chargement :", error);
        return;
    }

    messagesContainer.innerHTML = "";

    data.forEach(message => {
        displayMessage(message);
    });
}


// Envoyer un message
async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) return;

    const { data: { user }, error: authError } =
        await supabaseClient.auth.getUser();

    if (authError || !user) {
        console.error("Utilisateur non connecté");
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .insert({
            user_email: user.email,
            message: text
        });

    if (error) {
        console.error("Erreur envoi :", error);
        return;
    }

    messageInput.value = "";
}


// Bouton envoyer
sendBtn.addEventListener("click", sendMessage);


// Touche Entrée
messageInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();
    }
});


// REALTIME
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

            console.log("Nouveau message :", payload.new);

            displayMessage(payload.new);
        }
    )
    .subscribe();


// Déconnexion
logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    window.location.href = "index.html";
});


// Charger les messages au démarrage
loadMessages();
