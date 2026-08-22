/* =========================================================
   SHAHEEN AI
   APP ENGINE
   app.js
========================================================= */


/* =========================================================
   01 — DOM
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* Main elements */

const sidebar = $("#sidebar");

const openSidebarButton = $("#openSidebar");

const closeSidebarButton = $("#closeSidebar");

const newChatButton = $("#newChatButton");

const clearChatButton = $("#clearChat");

const chatHistory = $("#chatHistory");

const hero = $("#hero");

const chatContainer = $("#chatContainer");

const messages = $("#messages");

const messageInput = $("#messageInput");

const sendButton = $("#sendButton");

const thinkingIndicator = $("#thinkingIndicator");

const settingsButton = $("#settingsButton");

const settingsModal = $("#settingsModal");

const closeSettingsButton = $("#closeSettings");

const modalBackdrop = $(".modal-backdrop");

const languageSelect = $("#languageSelect");

const saveChats = $("#saveChats");

const toast = $("#toast");

const toastMessage = $("#toastMessage");


/* =========================================================
   02 — APP STATE
========================================================= */

const state = {

    currentChatId: null,

    chats: [],

    isGenerating: false,

    saveChats: true,

    language: "ar"

};


/* =========================================================
   03 — STORAGE
========================================================= */

const STORAGE_KEY = "shaheen_ai_chats_v1";

const SETTINGS_KEY = "shaheen_ai_settings_v1";


function loadStorage() {

    try {

        const savedChats =
            localStorage.getItem(STORAGE_KEY);

        const savedSettings =
            localStorage.getItem(SETTINGS_KEY);


        if (savedChats) {

            state.chats =
                JSON.parse(savedChats);

        }


        if (savedSettings) {

            const settings =
                JSON.parse(savedSettings);

            state.saveChats =
                settings.saveChats !== false;

            state.language =
                settings.language || "ar";

        }

    } catch (error) {

        console.warn(
            "Shaheen storage error:",
            error
        );

        state.chats = [];

    }

}


function saveStorage() {

    if (!state.saveChats) {

        return;

    }


    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state.chats)
        );

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({

                saveChats: state.saveChats,

                language: state.language

            })
        );

    } catch (error) {

        console.warn(
            "Could not save Shaheen data:",
            error
        );

    }

}


/* =========================================================
   04 — UTILITIES
========================================================= */

function createId() {

    return (

        Date.now().toString(36) +

        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


function formatTime(date = new Date()) {

    return date.toLocaleTimeString(
        state.language === "ar"
            ? "ar-SA"
            : "en-US",
        {

            hour: "2-digit",

            minute: "2-digit"

        }
    );

}


function showToast(message) {

    toastMessage.textContent =
        message;

    toast.classList.add("show");


    clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);

}


/* =========================================================
   05 — CHAT MANAGEMENT
========================================================= */

function createChat() {

    const chat = {

        id: createId(),

        title: "محادثة جديدة",

        createdAt: Date.now(),

        updatedAt: Date.now(),

        messages: []

    };


    state.chats.unshift(chat);

    state.currentChatId =
        chat.id;


    saveStorage();

    renderChatHistory();

    renderMessages();

    showHero();

    return chat;

}


function getCurrentChat() {

    return state.chats.find(
        chat =>
            chat.id === state.currentChatId
    );

}


function deleteCurrentChat() {

    if (!state.currentChatId) {

        return;

    }


    state.chats =
        state.chats.filter(
            chat =>
                chat.id !== state.currentChatId
        );


    state.currentChatId =
        null;


    saveStorage();

    renderChatHistory();

    messages.innerHTML = "";

    showHero();


    showToast(
        "تم حذف المحادثة"
    );

}


/* =========================================================
   06 — CHAT HISTORY
========================================================= */

function renderChatHistory() {

    chatHistory.innerHTML = "";


    if (!state.chats.length) {

        const empty =
            document.createElement("div");

        empty.style.cssText = `

            color:#505a6b;
            font-size:9px;
            text-align:center;
            padding:25px 10px;

        `;

        empty.textContent =
            "لا توجد محادثات بعد";

        chatHistory.appendChild(
            empty
        );

        return;

    }


    state.chats.forEach(chat => {

        const item =
            document.createElement("button");

        item.className =
            "chat-item";


        if (
            chat.id ===
            state.currentChatId
        ) {

            item.classList.add(
                "active"
            );

        }


        const icon =
            document.createElement("span");

        icon.className =
            "chat-item-icon";

        icon.textContent =
            "✦";


        const title =
            document.createElement("span");

        title.className =
            "chat-item-title";

        title.textContent =
            chat.title ||
            "محادثة جديدة";


        item.appendChild(icon);

        item.appendChild(title);


        item.addEventListener(
            "click",
            () => {

                openChat(chat.id);

            }
        );


        chatHistory.appendChild(item);

    });

}


function openChat(chatId) {

    const chat =
        state.chats.find(
            item =>
                item.id === chatId
        );


    if (!chat) {

        return;

    }


    state.currentChatId =
        chatId;


    renderChatHistory();

    renderMessages();

    hideHero();


    if (
        window.innerWidth <= 700
    ) {

        closeSidebar();

    }

}


/* =========================================================
   07 — HERO
========================================================= */

function showHero() {

    hero.style.display =
        "flex";

    chatContainer.style.display =
        "none";

}


function hideHero() {

    hero.style.display =
        "none";

    chatContainer.style.display =
        "flex";

}


/* =========================================================
   08 — RENDER MESSAGES
========================================================= */

function renderMessages() {

    messages.innerHTML = "";


    const chat =
        getCurrentChat();


    if (!chat || !chat.messages.length) {

        return;

    }


    chat.messages.forEach(
        message => {

            addMessageToDOM(
                message.role,
                message.content,
                message.time,
                false
            );

        }
    );


    scrollMessages();

}


function addMessageToDOM(
    role,
    content,
    time = formatTime(),
    animate = true
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        `message ${role}`;


    if (!animate) {

        wrapper.style.animation =
            "none";

    }


    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";


    if (role === "ai") {

        avatar.textContent =
            "✦";

    } else {

        avatar.textContent =
            "أنت";

    }


    const contentWrapper =
        document.createElement("div");

    contentWrapper.className =
        "message-content";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";


    /*
       textContent prevents raw HTML
       from being executed.
    */

    bubble.textContent =
        content;


    const meta =
        document.createElement("div");

    meta.className =
        "message-meta";

    meta.textContent =
        time;


    contentWrapper.appendChild(
        bubble
    );

    contentWrapper.appendChild(
        meta
    );


    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        contentWrapper
    );


    messages.appendChild(
        wrapper
    );


    return bubble;

}


/* =========================================================
   09 — ADD MESSAGE
========================================================= */

function addMessage(
    role,
    content
) {

    let chat =
        getCurrentChat();


    if (!chat) {

        chat =
            createChat();

    }


    const message = {

        id: createId(),

        role,

        content,

        time:
            formatTime(),

        createdAt:
            Date.now()

    };


    chat.messages.push(
        message
    );


    chat.updatedAt =
        Date.now();


    /*
       Automatically create a title
       from the first user message.
    */

    if (
        role === "user" &&
        chat.messages.filter(
            m =>
                m.role === "user"
        ).length === 1
    ) {

        chat.title =
            createChatTitle(
                content
            );

    }


    saveStorage();

    renderChatHistory();

    hideHero();

    addMessageToDOM(
        role,
        content,
        message.time
    );

    scrollMessages();


    return message;

}


function createChatTitle(text) {

    const clean =
        text
            .replace(/\s+/g, " ")
            .trim();


    if (!clean) {

        return "محادثة جديدة";

    }


    if (clean.length <= 32) {

        return clean;

    }


    return (
        clean.substring(0, 32) +
        "..."
    );

}


/* =========================================================
   10 — SCROLL
========================================================= */

function scrollMessages() {

    requestAnimationFrame(() => {

        messages.scrollTo({

            top:
                messages.scrollHeight,

            behavior:
                "smooth"

        });

    });

}


/* =========================================================
   11 — THINKING
========================================================= */

function showThinking() {

    thinkingIndicator.classList.remove(
        "hidden"
    );

    scrollMessages();

}


function hideThinking() {

    thinkingIndicator.classList.add(
        "hidden"
    );

}


/* =========================================================
   12 — INPUT
========================================================= */

function autoResizeTextarea() {

    messageInput.style.height =
        "auto";


    const maxHeight =
        window.innerWidth <= 700
            ? 120
            : 150;


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            maxHeight
        ) + "px";

}


messageInput.addEventListener(
    "input",
    autoResizeTextarea
);


/* =========================================================
   13 — SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (state.isGenerating) {

        return;

    }


    const text =
        messageInput.value.trim();


    if (!text) {

        showToast(
            "اكتب رسالتك أولاً"
        );

        return;

    }


    /*
       Create chat if necessary.
    */

    if (!state.currentChatId) {

        createChat();

    }


    messageInput.value = "";

    autoResizeTextarea();


    addMessage(
        "user",
        text
    );


    setGenerating(true);

    showThinking();


    try {

        /*
          IMPORTANT:

          لا يوجد API key هنا.

          في المرحلة التالية سنربط
          هذا المكان بخادم آمن يتصل
          بـ Gemini.
        */

        const response =
            await askShaheen(text);


        hideThinking();

        addMessage(
            "ai",
            response
        );

    } catch (error) {

        console.error(
            "Shaheen error:",
            error
        );


        hideThinking();

        addMessage(
            "ai",
            "حدث خطأ أثناء الاتصال بـ Shaheen AI. تأكد من إعداد اتصال Gemini ثم حاول مرة أخرى."
        );

        showToast(
            "تعذر الاتصال بالخادم"
        );

    } finally {

        setGenerating(false);

    }

}


/* =========================================================
   14 — AI CONNECTION PLACEHOLDER
========================================================= */

async function askShaheen(userMessage) {

    const chat = getCurrentChat();

    /*
       نرسل آخر رسائل المحادثة حتى يفهم
       Shaheen سياق الكلام السابق.
    */

    const conversation = chat
        ? chat.messages.map(message => ({

            role: message.role,

            content: message.content

        }))
        : [];


    const response = await fetch(
        "/api/chat",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                message: userMessage,

                conversation: conversation

            })

        }
    );


    /*
       حاول قراءة JSON حتى في حالة الخطأ.
    */

    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "Invalid server response"
        );

    }


    /*
       إذا كان السيرفر رجع خطأ.
    */

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Gemini request failed"
        );

    }


    /*
       الرد النهائي من Shaheen.
    */

    return (
        data.reply ||
        "لم يصل رد من Shaheen AI."
    );

}


/* =========================================================
   15 — SLEEP
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================================
   16 — GENERATING STATE
========================================================= */

function setGenerating(value) {

    state.isGenerating =
        value;


    sendButton.classList.toggle(
        "loading",
        value
    );


    messageInput.disabled =
        value;


    if (value) {

        messageInput.placeholder =
            "Shaheen يفكر...";

    } else {

        messageInput.placeholder =
            "اسأل Shaheen أي شيء...";

        messageInput.disabled =
            false;

        messageInput.focus();

    }

}


/* =========================================================
   17 — QUICK ACTIONS
========================================================= */

$$(".quick-card").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const prompt =
                    button.dataset.prompt;


                if (!prompt) {

                    return;

                }


                messageInput.value =
                    prompt;


                autoResizeTextarea();

                messageInput.focus();

            }
        );

    }
);


/* =========================================================
   18 — ENTER TO SEND
========================================================= */

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================================================
   19 — SEND BUTTON
========================================================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* =========================================================
   20 — NEW CHAT
========================================================= */

newChatButton.addEventListener(
    "click",
    () => {

        createChat();

        messageInput.focus();


        if (
            window.innerWidth <= 700
        ) {

            closeSidebar();

        }

    }
);


/* =========================================================
   21 — CLEAR CHAT
========================================================= */

clearChatButton.addEventListener(
    "click",
    () => {

        const chat =
            getCurrentChat();


        if (
            !chat ||
            !chat.messages.length
        ) {

            showToast(
                "المحادثة فارغة"
            );

            return;

        }


        chat.messages = [];

        chat.title =
            "محادثة جديدة";

        chat.updatedAt =
            Date.now();


        saveStorage();

        renderChatHistory();

        messages.innerHTML = "";

        showHero();


        showToast(
            "تم مسح المحادثة"
        );

    }
);


/* =========================================================
   22 — SIDEBAR
========================================================= */

function openSidebar() {

    sidebar.classList.add(
        "open"
    );

}


function closeSidebar() {

    sidebar.classList.remove(
        "open"
    );

}


openSidebarButton?.addEventListener(
    "click",
    openSidebar
);


closeSidebarButton?.addEventListener(
    "click",
    closeSidebar
);


/* =========================================================
   23 — SETTINGS
========================================================= */

function openSettings() {

    settingsModal.classList.remove(
        "hidden"
    );

}


function closeSettings() {

    settingsModal.classList.add(
        "hidden"
    );

}


settingsButton.addEventListener(
    "click",
    openSettings
);


closeSettingsButton.addEventListener(
    "click",
    closeSettings
);


modalBackdrop.addEventListener(
    "click",
    closeSettings
);


/* ESC closes modal */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeSettings();

            closeSidebar();

        }

    }
);


/* =========================================================
   24 — LANGUAGE
========================================================= */

languageSelect.value =
    state.language;


languageSelect.addEventListener(
    "change",
    () => {

        state.language =
            languageSelect.value;


        saveStorage();


        showToast(
            state.language === "ar"
                ? "تم اختيار العربية"
                : "English selected"
        );

    }
);


/* =========================================================
   25 — SAVE CHATS
========================================================= */

saveChats.checked =
    state.saveChats;


saveChats.addEventListener(
    "change",
    () => {

        state.saveChats =
            saveChats.checked;


        saveStorage();


        showToast(

            state.saveChats

                ? "تم تفعيل حفظ المحادثات"

                : "تم تعطيل حفظ المحادثات"

        );

    }
);


/* =========================================================
   26 — ATTACH BUTTON
========================================================= */

$("#attachButton").addEventListener(
    "click",
    () => {

        showToast(
            "رفع الملفات سيكون متاحًا قريبًا"
        );

    }
);


/* =========================================================
   27 — INITIALIZATION
========================================================= */

function init() {

    loadStorage();


    /*
       Restore settings UI
    */

    languageSelect.value =
        state.language;

    saveChats.checked =
        state.saveChats;


    /*
       If there are existing chats,
       open the newest one.
    */

    if (state.chats.length) {

        state.currentChatId =
            state.chats[0].id;

        renderChatHistory();

        renderMessages();

        hideHero();

    } else {

        renderChatHistory();

        showHero();

    }


    /*
       Initial textarea state
    */

    autoResizeTextarea();


    console.log(
        "%c SHAHEEN AI ",
        "background:#55e8ff;color:#041017;font-weight:bold;padding:6px 10px;border-radius:6px"
    );


    console.log(
        "Shaheen AI interface initialized."
    );

}


/* =========================================================
   28 — START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


/* =========================================================
   END — SHAHEEN AI APP
========================================================= */