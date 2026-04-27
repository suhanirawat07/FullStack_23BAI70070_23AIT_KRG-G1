import { useEffect, useRef, useState } from 'react'
import './App.css'

const SOCKET_URL = 'ws://localhost:8080/ws/messages'

function App() {
  const [connectionState, setConnectionState] = useState('Connecting')
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL)

    socket.onopen = () => {
      setConnectionState('Connected')
    }

    socket.onmessage = (event) => {
      setMessages((currentMessages) => [...currentMessages, event.data])
    }

    socket.onerror = () => {
      setConnectionState('Connection error')
    }

    socket.onclose = () => {
      setConnectionState('Disconnected')
    }

    return () => socket.close()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Spring Boot WebSocket demo</p>
          <h1>Live server messages in a React list</h1>
          <p className="lede">
            The client opens a WebSocket connection, listens for messages from
            the server, and keeps the latest events in a scrollable feed.
          </p>
        </div>

        <div className="status-card">
          <span className={`status-pill status-${connectionState.toLowerCase().replace(/\s+/g, '-')}`}>
            {connectionState}
          </span>
          <p className="status-copy">Socket endpoint: {SOCKET_URL}</p>
        </div>
      </section>

      <section className="messages-panel">
        <div className="messages-header">
          <h2>Messages</h2>
          <span>{messages.length} received</span>
        </div>

        <div className="messages-list" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty-state">Waiting for the server welcome message...</div>
          ) : (
            messages.map((message, index) => (
              <article className="message-item" key={`${message}-${index}`}>
                <span className="message-index">#{index + 1}</span>
                <p>{message}</p>
              </article>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </section>
    </main>
  )
}

export default App