function formatAIResponse(response) {
   response = convertMarkdownToHtml(response);
   response = handleCodeBlocks(response);
   return response;
}

function convertMarkdownToHtml(markdown) {
   markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
   markdown = markdown.replace(/__(.*?)__/g, '<strong>$1</strong>');
   markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
   markdown = markdown.replace(/_(.*?)_/g, '<em>$1</em>');
   markdown = markdown.replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
   markdown = markdown.replace(/\n\n+/g, "<p>$&</p>");
   markdown = markdown.replace(/\n/g, "<br>");
   return markdown;
}

function handleCodeBlocks(response) {
   response = response.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, function(match, language, code) {
      return `<div class="code-container"><pre><code class="language-${language}">${sanitizeHTML(code)}</code></pre></div>`;
   });

   response = response.replace(/`(.*?)`/g, function(match, code) {
      return `<code class="inline-code">${sanitizeHTML(code)}</code>`;
   });
   
   return response;
}

function sanitizeHTML(message) {
   return message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const chatBody = document.getElementById("chatBody");
const aiInput = document.getElementById("aiInput");
const sendMsg = document.getElementById("sendMsg");
const modelSelector = document.getElementById("modelSelector");
const modelSelected = modelSelector.querySelector(".selector-selected");
const modelOptions = modelSelector.querySelector(".selector-options");

let modelSourceValue = localStorage.getItem("selectedModel") || "claude3.5";

if (modelSourceValue === "claude3.7") {
   modelSelected.textContent = "Claude 3.7";
} else {
   modelSelected.textContent = "Claude 3.5";
}

modelSelected.addEventListener("click", function (e) {
   e.stopPropagation();
   modelOptions.classList.toggle("show");
   modelSelected.classList.toggle("active");
});

const modelOptionDivs = modelOptions.getElementsByTagName("div");
for (let i = 0; i < modelOptionDivs.length; i++) {
   modelOptionDivs[i].addEventListener("click", function (e) {
       e.stopPropagation();
       modelSourceValue = this.getAttribute("data-value");
       modelSelected.textContent = this.textContent;
       localStorage.setItem("selectedModel", modelSourceValue);
       modelOptions.classList.remove("show");
       modelSelected.classList.remove("active");
   });
}

document.addEventListener("click", function () {
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
   respondingIndicator.innerHTML = `<i class="fas fa-robot"></i>
    <span class="message-text">Responding 
      <span class="responding-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </span>`;
   chatBody.appendChild(respondingIndicator);
   chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth"
   });

   const modelParam = "claude-3-5-sonnet-20241022";

   const payload = {
      model: modelParam,
      messages: messageHistory,
      stream: false,
   };

   fetch("/v1/ai/completions", {
         method: "POST",
         headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify(payload),
      })
      .then((response) => response.json())
      .then((data) => {
         chatBody.removeChild(respondingIndicator);
         const aiResponse = data.content || "No response from AI.";
         const formattedResponse = formatAIResponse(aiResponse);
         typeWriterEffect(formattedResponse, "ai");
         sendMsg.disabled = false;
         aiInput.disabled = false;

         messageHistory.push({ role: "assistant", content: aiResponse });
      })
      .catch((err) => {
         console.error("Error communicating with AI:", err);
         chatBody.removeChild(respondingIndicator);
         appendMessage("Error communicating with AI.", "ai");
      });
});

aiInput.addEventListener("keypress", function (e) {
   if (e.key === "Enter") {
      sendMsg.click();
   }
});

function appendMessage(message, type) {
   const msgDiv = document.createElement("div");
   msgDiv.classList.add("message", type === "user" ? "user-message" : "ai-message");
   const iconHtml = type === "user" ? `<i class="fas fa-user"></i>` : `<i class="fas fa-robot"></i>`;
   msgDiv.innerHTML = iconHtml + `<span class="message-text">${message}</span>`;
   chatBody.appendChild(msgDiv);
   chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth"
   });
} 

window.addEventListener("DOMContentLoaded", () => {
   typeWriterEffect("Welcome! I'm here to assist you. Feel free to ask me anything.", "ai");
});

function typeWriterEffect(message, type, callback) {
   const msgDiv = document.createElement("div");
   msgDiv.classList.add("message", type === "user" ? "user-message" : "ai-message");
   const iconHtml = type === "user" ? `<i class="fas fa-user"></i>` : `<i class="fas fa-robot"></i>`;
   msgDiv.innerHTML = iconHtml + `<span class="message-text"></span>`;
   chatBody.appendChild(msgDiv);
   chatBody.scrollTo({
      top: chatBody.scrollHeight,
      behavior: "smooth"
   });

   let i = 0;
   const speed = 5;
   const messageText = msgDiv.querySelector(".message-text");

   function type() {
      if (i < message.length) {
         const char = message.charAt(i);
         
         if (char === "<") {
            let tag = "";
            while (message.charAt(i) !== ">") {
               tag += message.charAt(i);
               i++;
            }
            tag += ">";
            messageText.innerHTML += tag; 
         } else {
            messageText.innerHTML += char;
         }
         
         i++;
         setTimeout(type, speed);
      } else {
         if (callback) callback();
      }
   }

   type();
}

aiInput.addEventListener("keypress", function (e) {
   if (e.key === "Enter") {
      sendMsg.click();
   }
});
