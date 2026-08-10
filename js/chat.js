const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const mediaInput = document.getElementById("mediaInput");
const mediaBtn = document.getElementById("mediaBtn");
const voiceBtn = document.getElementById("voiceBtn");
let currentUser = null;
let replyToMessage = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// ===============================
// UTILISATEUR CONNECTÉ
// ===============================
async function getCurrentUser() {
    const { data, error } =
        await supabaseClient.auth.getUser();
    if (error || !data.user) {
        console.error(
            "Utilisateur non connecté :",
            error
        );
        return null;
    }
    currentUser = data.user;
    console.log(
        "Utilisateur connecté :",
        currentUser.email
    );
    return currentUser;
}
// ===============================
// RÉPONDRE À UN MESSAGE
// ===============================
function selectMessageForReply(message) {
    startReply(message);
}
// ===============================
// CRÉER UNE URL POUR UN MÉDIA PRIVÉ
// ===============================
async function getMediaUrl(filePath) {
    const { data, error } =
        await supabaseClient
        .storage
        .from("chat-media")
        .createSignedUrl(
            filePath,
            3600
        );
    if (error) {
        console.error(
            "Erreur URL média :",
            error
        );
        return null;
    }
    return data.signedUrl;
}
// ===============================
// AFFICHER UN MESSAGE
// ===============================
async function displayMessage(message) {
    const div =
        document.createElement("div");
    div.classList.add("message");
    // ===============================
    // CLIC POUR RÉPONDRE
    // ===============================
    div.addEventListener(
        "click",
        () => {
            selectMessageForReply(message);
        }
    );
    // ===============================
    // IDENTIFIER L'UTILISATEUR
    // ===============================
    const messageEmail =
        (message.user_email || "")
        .trim()
        .toLowerCase();
    const currentEmail =
        (currentUser?.email || "")
        .trim()
        .toLowerCase();
    if (messageEmail === currentEmail) {
        div.classList.add("me");
    } else {
        div.classList.add("other");
    }
    // ===============================
    // CITATION
    // ===============================
    if (message.reply_to_text) {
        const replyBox =
            document.createElement("div");
        replyBox.className =
            "reply-preview";
        replyBox.textContent =
            message.reply_to_text;
        div.appendChild(
            replyBox
        );
    }
    // ===============================
    // MÉDIA
    // ===============================
    if (message.media_url) {
        const mediaUrl =
            await getMediaUrl(
                message.media_url
            );
        if (mediaUrl) {
            const mediaType =
                message.media_type || "";
            // ===============================
            // IMAGE
            // ===============================
            if (
                mediaType.startsWith(
                    "image/"
                )
            ) {
                const image =
                    document.createElement(
                        "img"
                    );
                image.src =
                    mediaUrl;
                image.className =
                    "chat-media-image";
                image.alt =
                    "Image envoyée";
                image.loading =
                    "lazy";
                div.appendChild(
                    image
                );
            }
            // ===============================
            // VIDÉO
            // ===============================
            else if (
                mediaType.startsWith(
                    "video/"
                )
            ) {
                const video =
                    document.createElement(
                        "video"
                    );
                video.src =
                    mediaUrl;
                video.className =
                    "chat-media-video";
                video.controls =
                    true;
                video.playsInline =
                    true;
                div.appendChild(
                    video
                );
            }
            // ===============================
            // AUDIO
            // ===============================
            else if (
                mediaType.startsWith(
                    "audio/"
                )
            ) {
                const audio =
                    document.createElement(
                        "audio"
                    );
                audio.src =
                    mediaUrl;
                audio.controls =
                    true;
                audio.className =
                    "chat-media-audio";
                div.appendChild(
                    audio
                );
            }
            // ===============================
            // AUTRE FICHIER
            // ===============================
            else {
                const file =
                    document.createElement(
                        "a"
                    );
                file.href =
                    mediaUrl;
                file.target =
                    "_blank";
                file.rel =
                    "noopener noreferrer";
                file.className =
                    "chat-file";
                file.textContent =
                    "📎 Ouvrir le fichier";
                div.appendChild(
                    file
                );
            }
        }
    }
    // ===============================
    // TEXTE
    // ===============================
    if (message.message) {
        const textBox =
            document.createElement(
                "div"
            );
        textBox.className =
            "message-text";
        textBox.textContent =
            message.message;
        div.appendChild(
            textBox
        );
    }
    // ===============================
    // HEURE
    // ===============================
    const time =
        document.createElement(
            "div"
        );
    time.className =
        "message-time";
    time.textContent =
        new Date(
            message.created_at
        ).toLocaleTimeString(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    div.appendChild(
        time
    );
    // ===============================
    // APPUI LONG MOBILE
    // ===============================
    let pressTimer;
    div.addEventListener(
        "touchstart",
        function () {
            pressTimer =
                setTimeout(
                    function () {
                        startReply(
                            message
                        );
                    },
                    600
                );
        }
    );
    div.addEventListener(
        "touchend",
        function () {
            clearTimeout(
                pressTimer
            );
        }
    );
    div.addEventListener(
        "touchmove",
        function () {
            clearTimeout(
                pressTimer
            );
        }
    );
    // ===============================
    // AJOUT AU CHAT
    // ===============================
    messagesContainer.appendChild(
        div
    );
    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}
// ===============================
// CHARGER LES MESSAGES
// ===============================
async function loadMessages() {
    const { data, error } =
        await supabaseClient
        .from("messages")
        .select("*")
        .order(
            "created_at",
            {
                ascending: true
            }
        );
    if (error) {
        console.error(
            "Erreur chargement des messages :",
            error
        );
        return;
    }
    messagesContainer.innerHTML = "";
    for (const message of data) {
        await displayMessage(
            message
        );
    }
}
// ===============================
// ENVOYER UN MESSAGE TEXTE
// ===============================
async function sendMessage() {
    const text =
        messageInput.value.trim();
    if (!text) return;
    if (!currentUser) {
        await getCurrentUser();
    }
    if (!currentUser) {
        console.error(
            "Utilisateur non connecté"
        );
        return;
    }
    const { error } =
        await supabaseClient
        .from("messages")
        .insert({
            user_email:
                currentUser.email,
            message:
                text,
            reply_to_text:
                replyToMessage
                    ? replyToMessage.message
                    : null,
            media_url:
                null,
            media_type:
                null
        });
    if (error) {
        console.error(
            "Erreur envoi du message :",
            error
        );
        return;
    }
    messageInput.value = "";
    clearReply();
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
// BOUTON MÉDIA
// ===============================
if (mediaBtn && mediaInput) {
    mediaBtn.addEventListener(
        "click",
        () => {
            mediaInput.click();
        }
    );
}
// ===============================
// SÉLECTION ET ENVOI DU MÉDIA
// ===============================
if (mediaInput) {
    mediaInput.addEventListener(
        "change",
        async () => {
            const file =
                mediaInput.files[0];
            if (!file) return;
            if (!currentUser) {
                await getCurrentUser();
            }
            if (!currentUser) {
                console.error(
                    "Utilisateur non connecté"
                );
                return;
            }
            console.log(
                "Fichier sélectionné :",
                file.name
            );
            // ===============================
            // NOM UNIQUE
            // ===============================
            const fileName =
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .substring(2) +
                "_" +
                file.name;
            const filePath =
                currentUser.id +
                "/" +
                fileName;
            // ===============================
            // UPLOAD STORAGE
            // ===============================
            const {
                error: uploadError
            } =
                await supabaseClient
                .storage
                .from("chat-media")
                .upload(
                    filePath,
                    file
                );
            if (uploadError) {
                console.error(
                    "Erreur upload média :",
                    uploadError
                );
                alert(
                    "Impossible d'envoyer le fichier."
                );
                mediaInput.value = "";
                return;
            }
            console.log(
                "Média envoyé dans Storage :",
                filePath
            );
            // ===============================
            // ENREGISTRER LE MESSAGE
            // ===============================
            const {
                error
            } =
                await supabaseClient
                .from("messages")
                .insert({
                    user_email:
                        currentUser.email,
                    message:
                        "",
                    reply_to_text:
                        replyToMessage
                            ? replyToMessage.message
                            : null,
                    media_url:
                        filePath,
                    media_type:
                        file.type
                });
            if (error) {
                console.error(
                    "Erreur enregistrement média :",
                    error
                );
                alert(
                    "Le fichier a été envoyé mais le message n'a pas pu être enregistré."
                );
                mediaInput.value = "";
                return;
            }
            console.log(
                "Média enregistré dans messages."
            );
            // ===============================
            // NETTOYAGE
            // ===============================
            mediaInput.value = "";
            clearReply();
            messageInput.focus();
        }
    );
}
// ===============================
// REALTIME
// ===============================
supabaseClient
    .channel(
        "messages-realtime"
    )
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "messages"
        },
        async (payload) => {
            console.log(
                "Nouveau message :",
                payload.new
            );
            await displayMessage(
                payload.new
            );
        }
    )
    .subscribe();
// ===============================
// DÉCONNEXION
// ===============================
logoutBtn.addEventListener(
    "click",
    async () => {
        await supabaseClient
            .auth
            .signOut();
        window.location.href =
            "index.html";
    }
);
// ===============================
// RÉPONDRE À UN MESSAGE
// ===============================
function startReply(message) {
    replyToMessage =
        message;
    let replyBox =
        document.getElementById(
            "replyBox"
        );
    if (!replyBox) {
        replyBox =
            document.createElement(
                "div"
            );
        replyBox.id =
            "replyBox";
        replyBox.innerHTML = `
            <div class="reply-preview">
                <strong id="replyUser">
                </strong>
                <div id="replyText">
                </div>
            </div>
            <button
                id="cancelReply"
                type="button">
                ×
            </button>
        `;
        const messageBox =
            document.querySelector(
                ".message-box"
            );
        messageBox.parentNode.insertBefore(
            replyBox,
            messageBox
        );
        document
            .getElementById(
                "cancelReply"
            )
            .addEventListener(
                "click",
                cancelReply
            );
    }
    document
        .getElementById(
            "replyUser"
        )
        .textContent =
            message.user_email
                .trim()
                .toLowerCase() ===
                "lalita@gmail.com"
                    ? "LALITA"
                    : "SIPOUEH";
    document
        .getElementById(
            "replyText"
        )
        .textContent =
            message.message ||
            "📎 Média";
    replyBox.style.display =
        "flex";
    messageInput.focus();
}
// ===============================
// ANNULER LA RÉPONSE
// ===============================
function cancelReply() {
    replyToMessage =
        null;
    const replyBox =
        document.getElementById(
            "replyBox"
        );
    if (replyBox) {
        replyBox.style.display =
            "none";
    }
    messageInput.placeholder =
        "Écris-moi quelque chose... ❤️";
    messageInput.focus();
}
// ===============================
// NETTOYER LA RÉPONSE
// ===============================
function clearReply() {
    replyToMessage =
        null;
    const replyBox =
        document.getElementById(
            "replyBox"
        );
    if (replyBox) {
        replyBox.style.display =
            "none";
    }
    messageInput.placeholder =
        "Écris-moi quelque chose... ❤️";
}
// ===============================
// MESSAGE VOCAL
// ===============================

voiceBtn.addEventListener("click", async () => {

    // ARRÊTER L'ENREGISTREMENT
    if (isRecording) {

        mediaRecorder.stop();

        isRecording = false;

        voiceBtn.textContent = "🎤";

        return;
    }

    // UTILISATEUR
    if (!currentUser) {
        await getCurrentUser();
    }

    if (!currentUser) {
        alert("Utilisateur non connecté.");
        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        audioChunks = [];

        mediaRecorder =
            new MediaRecorder(stream);

        mediaRecorder.addEventListener(
            "dataavailable",
            event => {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }

            }
        );

        mediaRecorder.addEventListener(
            "stop",
            async () => {

                stream
                    .getTracks()
                    .forEach(track => track.stop());

                const audioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type: "audio/webm"
                        }
                    );

                await sendVoiceMessage(
                    audioBlob
                );
            }
        );

        mediaRecorder.start();

        isRecording = true;

        voiceBtn.textContent = "⏹️";

        console.log(
            "Enregistrement vocal démarré"
        );

    } catch (error) {

        console.error(
            "Erreur microphone :",
            error
        );

        alert(
            "Impossible d'utiliser le microphone."
        );
    }
});


// ===============================
// ENVOYER LE VOCAL
// ===============================

async function sendVoiceMessage(audioBlob) {

    const fileName =
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2) +
        ".webm";

    const filePath =
        currentUser.id +
        "/" +
        fileName;


    // ===============================
    // UPLOAD STORAGE
    // ===============================

    const { error: uploadError } =
        await supabaseClient
        .storage
        .from("chat-media")
        .upload(
            filePath,
            audioBlob,
            {
                contentType: "audio/webm"
            }
        );

    if (uploadError) {

        console.error(
            "Erreur upload vocal :",
            uploadError
        );

        alert(
            "Impossible d'envoyer le message vocal."
        );

        return;
    }


    // ===============================
    // URL DU FICHIER
    // ===============================

    const { data } =
        supabaseClient
        .storage
        .from("chat-media")
        .getPublicUrl(filePath);

    const mediaUrl =
        data.publicUrl;


    // ===============================
    // ENREGISTRER LE MESSAGE
    // ===============================

    const { error } =
        await supabaseClient
        .from("messages")
        .insert({

            user_email:
                currentUser.email,

            message:
                "",

            reply_to_text:
                replyToMessage
                    ? replyToMessage.message
                    : null,

            media_url:
                mediaUrl,

            media_type:
                "audio/webm"
        });


    if (error) {

        console.error(
            "Erreur création message vocal :",
            error
        );

        alert(
            "Le vocal a été envoyé mais n'a pas pu être enregistré."
        );

        return;
    }


    // ===============================
    // NETTOYAGE
    // ===============================

    clearReply();

    console.log(
        "Message vocal envoyé"
    );
}
// ===============================
// DÉMARRAGE
// ===============================
async function startChat() {
    await getCurrentUser();
    await loadMessages();
}
startChat();
