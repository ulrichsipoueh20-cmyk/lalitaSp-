const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Charger les messages existants
async function loadMessages() {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    messagesContainer.innerHTML = "";

    data.forEach(message => {
        displayMessage(message);
    });
}

// Afficher un message
function displayMessage(message) {
    const div = document.createElement("div");

    div.textContent = message.content;

    messagesContainer.appendChild(div);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Envoyer un message
sendBtn.addEventListener("click", async () => {
    const content = messageInput.value.trim();

    if (!content) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
        .from("messages")
        .insert([
            {
                user_id: user.id,
                content: content
            }
        ]);

    if (error) {
        console.error(error);
        return;
    }

    messageInput.value = "";
});

// Envoyer avec la touche Entrée
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendBtn.click();
    }
});

// 🔴 RECEVOIR LES NOUVEAUX MESSAGES EN TEMPS RÉEL
supabase
    .channel("messages-realtime")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "messages"
        },
        (payload) => {
            displayMessage(payload.new);
        }
    )
    .subscribe();

// Déconnexion
logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
});

// Charger les messages au démarrage
loadMessages();
