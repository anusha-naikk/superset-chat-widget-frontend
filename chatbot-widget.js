(() => {
  const backendUrl = "https://superset-chatbot-api.onrender.com"; // Update this with your actual backend URL
  const loginApi = "http://localhost:8088/api/v1/security/login"; // Superset API endpoint

  let isChatOpen = false;
  let isLoggedIn = false;
  let username = "";
  let password = "";

  const style = document.createElement("style");
  style.textContent = `
    #chatbot-login, #chatbot-launcher, #chatbot-container {
      font-family: sans-serif;
    }
    #chatbot-login {
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
    }
    #chatbot-login input {
      display: block;
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
    }
    #chatbot-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(173, 216, 230, 0.7), rgba(138, 43, 226, 0.6));
      border: 2px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
    }
    #chatbot-container {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 320px;
      height: 460px;
      border-radius: 40px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      padding: 16px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
    }
    #chatbot-messages {
      flex: 1;
      overflow-y: auto;
      font-size: 14px;
      margin-bottom: 8px;
    }
    #chatbot-input {
      flex: 1;
      padding: 10px;
      border-radius: 20px;
      border: 1px solid #ccc;
    }
    #chatbot-send {
      width: 40px;
      height: 40px;
      margin-left: 8px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("div");
  launcher.id = "chatbot-launcher";
  launcher.innerHTML = "💬";
  launcher.onclick = () => {
    if (!isLoggedIn) return showLoginModal();
    toggleChat();
  };
  document.body.appendChild(launcher);

  function showLoginModal() {
    const modal = document.createElement("div");
    modal.id = "chatbot-login";
    modal.innerHTML = `
      <h3>Login to Superset</h3>
      <input id="chatbot-user" placeholder="Username" />
      <input id="chatbot-pass" type="password" placeholder="Password" />
      <button id="chatbot-login-btn">Login</button>
    `;
    document.body.appendChild(modal);
    document.getElementById("chatbot-login-btn").onclick = async () => {
      username = (document.getElementById("chatbot-user").value || '').trim();
      password = (document.getElementById("chatbot-pass").value || '').trim();

      try {
        const res = await fetch(loginApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, provider: "db", refresh: true }),
        });
        const json = await res.json();
        if (res.ok && json.access_token) {
          isLoggedIn = true;
          modal.remove();
          toggleChat();
        } else {
          alert("Login failed: " + (json.message || "Invalid credentials"));
        }
      } catch (e) {
        alert("Login error. Check console.");
        console.error(e);
      }
    };
  }

  function toggleChat() {
    let container = document.getElementById("chatbot-container");
    if (container) {
      container.remove();
      isChatOpen = false;
      return;
    }
    container = document.createElement("div");
    container.id = "chatbot-container";

    const messages = document.createElement("div");
    messages.id = "chatbot-messages";

    const inputWrap = document.createElement("div");
    inputWrap.style.display = "flex";

    const input = document.createElement("input");
    input.id = "chatbot-input";
    input.placeholder = "Ask me about this dashboard...";
    input.onkeydown = e => {
      if (e.key === "Enter") sendMessage(input, messages);
    };

    const sendBtn = document.createElement("button");
    sendBtn.id = "chatbot-send";
    sendBtn.innerText = "➤";
    sendBtn.onclick = () => sendMessage(input, messages);

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);

    container.appendChild(messages);
    container.appendChild(inputWrap);
    document.body.appendChild(container);
    isChatOpen = true;
  }

  function sendMessage(input, messages) {
    const question = input.value.trim();
    if (!question) return;
    input.value = "";

    const userMsg = document.createElement("div");
    userMsg.textContent = "You: " + question;
    messages.appendChild(userMsg);

    const dashboardId = window.dashboardInfo?.id || null;

    fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        dashboard_id: dashboardId,
        superset_url: window.location.origin,
        username,
        password,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const botMsg = document.createElement("div");
        botMsg.textContent = "Assistant: " + data.response;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
      })
      .catch(err => {
        const errMsg = document.createElement("div");
        errMsg.textContent = "Error: " + err.message;
        messages.appendChild(errMsg);
      });
  }
})();
