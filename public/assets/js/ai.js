function formatAIResponse(response) {
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(code, { language: lang }).value}</code></pre>`;
      }
      const autoDetected = hljs.highlightAuto(code);
      return `<pre class="hljs"><code class="language-${autoDetected.language}">${autoDetected.value}</code></pre>`;
    }
  });

  const renderer = new marked.Renderer();
  renderer.blockquote = function(quote) {
    return quote;
  };

  let formattedResponse = marked.parse(response, { renderer });
  formattedResponse = formattedResponse.replace(/<p>\s*<\/p>/g, "").replace(/<br\s*\/?>$/, "");
  return formattedResponse;
}

function sanitizeHTML(message) {
  return message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cleanupMessage(message) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = message;

  const childElements = tempDiv.querySelectorAll("*");

  childElements.forEach(el => {
    el.style.margin = "0";
    el.style.padding = "0";
    el.style.lineHeight = "normal";
  });

  const cleanedMessage = tempDiv.innerHTML.trim();

  return cleanedMessage;
}

const chatBody = document.getElementById("chatBody");
const aiInput = document.getElementById("aiInput");
const sendMsg = document.getElementById("sendMsg");
const modelSelector = document.getElementById("modelSelector");
const modelSelected = modelSelector.querySelector(".selector-selected");
const modelOptions = modelSelector.querySelector(".selector-options");
let modelSourceValue = localStorage.getItem("selectedModel") || "llama-3.1-8b-instant";
const modelDisplayNames = {
  "llama-3.1-8b-instant": "Llama 3.1 8B Instant",
  "llama3-8b-8192": "Llama3 8B 8192",
  "deepseek-r1-distill-llama-70b": "Deepseek R1 Distill Llama 70B",
  "gemma2-9b-it": "Gemma2 9B IT",
  "mixtral-8x7b-32768": "Mixtral 8x7B 32768"
};
modelSelected.textContent = modelDisplayNames[modelSourceValue];

modelSelected.addEventListener("click", function(e) {
  e.stopPropagation();
  modelOptions.classList.toggle("show");
  modelSelected.classList.toggle("active");
});

const modelOptionDivs = modelOptions.getElementsByTagName("div");
for (let i = 0; i < modelOptionDivs.length; i++) {
  modelOptionDivs[i].addEventListener("click", function(e) {
    e.stopPropagation();
    modelSourceValue = this.getAttribute("data-value");
    modelSelected.textContent = modelDisplayNames[modelSourceValue];
    localStorage.setItem("selectedModel", modelSourceValue);
    modelOptions.classList.remove("show");
    modelSelected.classList.remove("active");
  });
}

document.addEventListener("click", function() {
  modelOptions.classList.remove("show");
  modelSelected.classList.remove("active");
});

let messageHistory = [];

sendMsg.addEventListener("click", () => {
  const message = aiInput.value.trim();
  if (!message.replace(/\s/g, "").length) return;
  appendMessage(message, "user");
  aiInput.value = "";
  sendMsg.disabled = true;
  aiInput.disabled = true;
  messageHistory.push({ role: "user", content: message });
  const respondingIndicator = document.createElement("div");
  respondingIndicator.classList.add("message", "ai-message");
  respondingIndicator.innerHTML = '<i class="fas fa-robot"></i><span class="message-text">Responding <span class="responding-dots"><span>.</span><span>.</span><span>.</span></span></span>';
  chatBody.appendChild(respondingIndicator);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  const payload = {
    model: modelSourceValue,
    messages: [{
      role: "system",
      content: "You are a friendly assistant who provides smart, fast, and brief answers. Think critically before responding and always be helpful."
    }, ...messageHistory],
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false
  };
  fetch("/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(response => response.json())
    .then(data => {
      chatBody.removeChild(respondingIndicator);
      const aiResponse = data.choices && data.choices[0] ? data.choices[0].message.content : "No response from AI.";
      const formattedResponse = formatAIResponse(aiResponse);
      const cleanedResponse = cleanupMessage(formattedResponse);
      typeWriterEffect(cleanedResponse, "ai");
      messageHistory.push({ role: "assistant", content: aiResponse });
    })
    .catch(err => {
      console.error("Error communicating with AI:", err);
      chatBody.removeChild(respondingIndicator);
      appendMessage("Error communicating with AI.", "ai");
      sendMsg.disabled = false;
      aiInput.disabled = false;
    });
});

aiInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMsg.click();
});

function appendMessage(message, type) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", type === "user" ? "user-message" : "ai-message");
  const iconHtml = type === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
  if (type === "user") {
    msgDiv.innerHTML = iconHtml + '<span class="message-text">' + message + "</span>";
    chatBody.appendChild(msgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  } else {
    typeWriterEffect(message, type);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  typeWriterEffect("Welcome! I'm here to assist you. Feel free to ask me anything.", "ai");
});

function typeWriterEffect(message, msgType, callback) {
  const msgDiv = document.createElement("div");
  let classes = ["message", msgType === "user" ? "user-message" : "ai-message"];
  if (modelSourceValue === "deepseek-r1-distill-llama-70b" && msgType === "ai") {
    classes.push("deep-reasoning");
  }
  msgDiv.className = classes.join(" ");
  const iconHtml = msgType === "user" ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
  msgDiv.innerHTML = iconHtml + '<span class="message-text"></span>';
  chatBody.appendChild(msgDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  const messageText = msgDiv.querySelector(".message-text");
  let plainText = message;
  let isHTML = false;
  if (/<[a-z][\s\S]*>/i.test(message)) {
    isHTML = true;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = message;
    plainText = tempDiv.innerText || tempDiv.textContent;
  }
  let i = 0;
  const speed = 5;
  let timeoutId;
  let completed = false;
  function finishTyping() {
    if (!completed) {
      completed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (isHTML) {
        messageText.innerHTML = message;
        msgDiv.querySelectorAll("p, pre, code").forEach(el => {
          el.style.margin = "0";
          el.style.padding = "0";
          el.style.lineHeight = "normal";
        });
        msgDiv.querySelectorAll("pre code").forEach(block => hljs.highlightElement(block));
      } else {
        messageText.textContent = message;
      }
      setTimeout(() => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      }, 100);
      
      if (callback) callback();
      if (msgType === "ai") {
        sendMsg.disabled = false;
        aiInput.disabled = false;
      }
    }
  }
  msgDiv.addEventListener("click", finishTyping);
  const maxTime = plainText.length * speed + 500;
  const forceTimeout = setTimeout(finishTyping, maxTime);
  function typeCharacter() {
    if (i < plainText.length) {
      messageText.textContent = plainText.substring(0, i + 1);
      i++;
      chatBody.scrollTop = chatBody.scrollHeight;
      timeoutId = setTimeout(typeCharacter, speed);
    } else {
      finishTyping();
      clearTimeout(forceTimeout);
    }
  }
  typeCharacter();
}