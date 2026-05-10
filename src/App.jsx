import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://anon-chat-1-kgt2.onrender.com");

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Поиск собеседника...");

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    socket.on("matched", () => {
      setStatus("Собеседник найден 💬");
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("partner-left", () => {
      setStatus("Собеседник вышел ❌");
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("message", {
      text: input,
      name: name
    });

    setMessages((prev) => [
      ...prev,
      { text: input, name: name, me: true }
    ]);

    setInput("");
  };

  // 🔴 LOGIN SCREEN
  if (!joined) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        <h2>Enter Username</h2>

        <input
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={() => {
            if (!name.trim()) return;

            // 🔐 HIER ADMIN KEY EINTRAGEN (nur für dich!)
            socket.emit("set-name", {
              name: name,
              token: "BYZ"
            });

            setJoined(true);
          }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Анонимный чат</h2>

      <p>{status}</p>

      <div
        style={{
          height: 300,
          overflow: "auto",
          border: "1px solid #ccc",
          padding: 10
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.me ? "right" : "left" }}>
            <b style={{ color: m.isAdmin ? "red" : "black" }}>
              {m.name || (m.me ? "Я" : "Он")}
            </b>
            : {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />

      <button onClick={sendMessage}>Отправить</button>
    </div>
  );
}