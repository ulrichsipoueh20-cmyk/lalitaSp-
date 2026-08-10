const photoInput = document.getElementById("photoInput");
const photoBtn = document.getElementById("photoBtn");
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
// URL MÉDIA PRIVÉ
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
    div.dataset.messageId =
        message.id;
    // ===============================
    // CLIC POUR RÉPONDRE
    // ===============================
    div.addEventListener(
        "click",
        () => {
            selectMessageForReply(
                message
            );
        }
    );
    // ===============================
    // IDENTIFIER UTILISATEUR
    // ===============================
    const messageEmail =
        (message.user_email || "")
        .trim()
        .toLowerCase();
    const currentEmail =
        (currentUser?.email || "")
        .trim()
        .toLowerCase();
    if (
        messageEmail === currentEmail
    ) {
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
                const fileBox =
                    document.createElement(
                        "div"
                    );
                fileBox.className =
                    "chat-file-box";
                const fileName =
                    message.media_url
                    .split("/")
                    .pop();
                let icon = "📎";
                if (
                    mediaType.includes("pdf")
                ) {
                    icon = "📕";
                } else if (
                    mediaType.includes("word") ||
                    mediaType.includes("document")
                ) {
                    icon = "📝";
                } else if (
                    mediaType.includes("excel") ||
                    mediaType.includes("spreadsheet")
                ) {
                    icon = "📊";
                } else if (
                    mediaType.includes("powerpoint") ||
                    mediaType.includes("presentation")
                ) {
                    icon = "📽️";
                } else if (
                    mediaType.includes("zip") ||
                    mediaType.includes("rar")
                ) {
                    icon = "📦";
                } else if (
                    mediaType.includes("text")
                ) {
                    icon = "📃";
                }
                const info =
                    document.createElement(
                        "div"
                    );
                info.className =
                    "chat-file-info";
                const name =
                    document.createElement(
                        "div"
                    );
                name.className =
                    "chat-file-name";
                name.textContent =
                    fileName;
                const open =
                    document.createElement(
                        "a"
                    );
                open.href =
                    mediaUrl;
                open.target =
                    "_blank";
                open.rel =
                    "noopener noreferrer";
                open.className =
                    "chat-file-open";
                open.textContent =
                    "⬇️ Ouvrir le fichier";
                info.appendChild(
                    name
                );
                info.appendChild(
                    open
                );
                fileBox.innerHTML =
                    `<div class="chat-file-icon">${icon}</div>`;
                fileBox.appendChild(
                    info
                );
                div.appendChild(
                    fileBox
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
    // HEURE + ACCUSÉ
    // ===============================
    const bottomRow =
        document.createElement(
            "div"
        );
    bottomRow.className =
        "message-bottom";
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
    bottomRow.appendChild(
        time
    );
    // ===============================
    // ACCUSÉ DE RÉCEPTION
    // ===============================
    if (
        messageEmail === currentEmail
    ) {
        const status =
            document.createElement(
                "span"
            );
        status.className =
            "message-status";
        status.textContent =
            "✓✓";
        bottomRow.appendChild(
            status
        );
    }
    div.appendChild(
        bottomRow
    );
    // ===============================
    // BOUTON SUPPRIMER
    // ===============================
    if (
        messageEmail === currentEmail
    ) {
        const deleteBtn =
            document.createElement(
                "button"
            );
        deleteBtn.className =
            "delete-message-btn";
        deleteBtn.textContent =
            "🗑️";
        deleteBtn.title =
            "Supprimer";
        deleteBtn.addEventListener(
            "click",
            async (event) => {
                event.stopPropagation();
                await deleteMessage(
                    message
                );
            }
        );
        div.appendChild(
            deleteBtn
        );
    }
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
    messagesContainer.innerHTML =
        "";
    for (
        const message of data
    ) {
        await displayMessage(
            message
        );
    }
}
// ===============================
// ENVOYER MESSAGE TEXTE
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
    messageInput.value =
        "";
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
        if (
            e.key === "Enter"
        ) {
            e.preventDefault();
            sendMessage();
        }
    }
);
// ===============================
// BOUTON MÉDIA
// ===============================
if (
    mediaBtn &&
    mediaInput
) {
    mediaBtn.addEventListener(
        "click",
        () => {
            mediaInput.click();
        }
    );
}
// ===============================
// BOUTON PHOTO / VIDÉO
// ===============================
if (
    photoBtn &&
    photoInput
) {
    photoBtn.addEventListener(
        "click",
        () => {
            photoInput.click();
        }
    );
}
// ===============================
// SÉLECTION PHOTO / VIDÉO
// ===============================
if (photoInput) {
    photoInput.addEventListener(
        "change",
        async () => {
            const file =
                photoInput.files[0];
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
                "Photo/Vidéo sélectionnée :",
                file.name
            );
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
                    "Erreur upload photo/vidéo :",
                    uploadError
                );
                alert(
                    "Impossible d'envoyer la photo ou la vidéo."
                );
                photoInput.value =
                    "";
                return;
            }
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
                    "Erreur enregistrement photo/vidéo :",
                    error
                );
                alert(
                    "Le fichier a été envoyé mais le message n'a pas pu être enregistré."
                );
                photoInput.value =
                    "";
                return;
            }
            photoInput.value =
                "";
            clearReply();
            messageInput.focus();
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
                mediaInput.value =
                    "";
                return;
            }
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
                mediaInput.value =
                    "";
                return;
            }
            mediaInput.value =
                "";
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
                <strong id="replyUser"></strong>
                <div id="replyText"></div>
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
// ANNULER RÉPONSE
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
// NETTOYER RÉPONSE
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
if (voiceBtn) {
    voiceBtn.addEventListener(
        "click",
        async () => {
            if (isRecording) {
                mediaRecorder.stop();
                isRecording =
                    false;
                voiceBtn.textContent =
                    "🎤";
                return;
            }
            if (!currentUser) {
                await getCurrentUser();
            }
            if (!currentUser) {
                alert(
                    "Utilisateur non connecté."
                );
                return;
            }
            try {
                const stream =
                    await navigator
                    .mediaDevices
                    .getUserMedia({
                        audio: true
                    });
                audioChunks = [];
                let mimeType =
                    "";
                if (
                    MediaRecorder
                    .isTypeSupported(
                        "audio/mp4"
                    )
                ) {
                    mimeType =
                        "audio/mp4";
                } else if (
                    MediaRecorder
                    .isTypeSupported(
                        "audio/webm;codecs=opus"
                    )
                ) {
                    mimeType =
                        "audio/webm";
                } else if (
                    MediaRecorder
                    .isTypeSupported(
                        "audio/webm"
                    )
                ) {
                    mimeType =
                        "audio/webm";
                }
                if (mimeType) {
                    mediaRecorder =
                        new MediaRecorder(
                            stream,
                            {
                                mimeType:
                                    mimeType
                            }
                        );
                } else {
                    mediaRecorder =
                        new MediaRecorder(
                            stream
                        );
                }
                mediaRecorder.addEventListener(
                    "dataavailable",
                    event => {
                        if (
                            event.data.size > 0
                        ) {
                            audioChunks.push(
                                event.data
                            );
                        }
                    }
                );
                mediaRecorder.addEventListener(
                    "stop",
                    async () => {
                        stream
                            .getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );
                        const finalMimeType =
                            mediaRecorder.mimeType ||
                            mimeType ||
                            "audio/webm";
                        const audioBlob =
                            new Blob(
                                audioChunks,
                                {
                                    type:
                                        finalMimeType
                                }
                            );
                        await sendVoiceMessage(
                            audioBlob,
                            finalMimeType
                        );
                    }
                );
                mediaRecorder.start();
                isRecording =
                    true;
                voiceBtn.textContent =
                    "⏹️";
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
        }
    );
}
// ===============================
// ENVOYER VOCAL
// ===============================
async function sendVoiceMessage(
    audioBlob,
    mimeType
) {
    if (!currentUser) {
        await getCurrentUser();
    }
    if (!currentUser) {
        return;
    }
    let extension =
        "webm";
    if (
        mimeType.includes("mp4")
    ) {
        extension =
            "mp4";
    } else if (
        mimeType.includes("ogg")
    ) {
        extension =
            "ogg";
    }
    const fileName =
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2) +
        "." +
        extension;
    const filePath =
        currentUser.id +
        "/" +
        fileName;
    const {
        error: uploadError
    } =
        await supabaseClient
        .storage
        .from("chat-media")
        .upload(
            filePath,
            audioBlob,
            {
                contentType:
                    mimeType
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
                filePath,
            media_type:
                mimeType
        });
    if (error) {
        console.error(
            "Erreur création message vocal :",
            error
        );
        alert(
            "Le vocal a été envoyé mais le message n'a pas pu être enregistré."
        );
        return;
    }
    clearReply();
    console.log(
        "Message vocal envoyé avec succès."
    );
}
// ===============================
// SUPPRIMER UN MESSAGE
// ===============================
async function deleteMessage(message) {
    if (
        !confirm(
            "Supprimer ce message ?"
        )
    ) {
        return;
    }
    // ===============================
    // SUPPRIMER FICHIER STORAGE
    // ===============================
    if (message.media_url) {
        const {
            error: storageError
        } =
            await supabaseClient
            .storage
            .from("chat-media")
            .remove([
                message.media_url
            ]);
        if (storageError) {
            console.error(
                "Erreur suppression fichier :",
                storageError
            );
        }
    }
    // ===============================
    // SUPPRIMER MESSAGE
    // ===============================
    const { error } =
        await supabaseClient
        .from("messages")
        .delete()
        .eq(
            "id",
            message.id
        );
    if (error) {
        console.error(
            "Erreur suppression message :",
            error
        );
        alert(
            "Impossible de supprimer le message."
        );
        return;
    }
    // ===============================
    // SUPPRIMER LA BULLE
    // SANS RECHARGER LA PAGE
    // ===============================
    const messageElement =
        messagesContainer.querySelector(
            `[data-message-id="${message.id}"]`
        );
    if (messageElement) {
        messageElement.remove();
    }
    console.log(
        "Message supprimé sans recharger la page."
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
