 'use client';
 
 import { useEffect } from 'react';
 
 declare global {
   interface Window {
     ChatbotConfig?: {
       apiBaseUrl?: string;
       headerText?: string;
       buttonText?: string;
       placeholder?: string;
       position?: string;
       theme?: string;
     };
   }
 }
 
 export default function AIDoctorBot() {
  useEffect(() => {
    if (window.ChatbotConfig && (window as any).__doctorbotLoaded) return;
    (window as any).__doctorbotLoaded = true;
    window.ChatbotConfig = {
      apiBaseUrl: 'https://chat-bot-hizj.onrender.com',
      headerText: 'FITGUIDE',
      buttonText: '',
      placeholder: 'Confused where to start?',
      position: 'bottom-right',
      theme: 'fitness',
    };

    const script = document.createElement('script');
    script.src = 'https://chat-bot-hizj.onrender.com/widget/widget.js';
    script.async = true;
    script.id = 'doctorbot-script';
    script.onload = () => {
      // Ensure widget is clickable AND restyled to match the editorial brand.
      const style = document.createElement('style');
      style.textContent = `
        /* Base layering — always on top */
        #chatbot-widget,
        #chat-button,
        #chat-window {
          z-index: 2147483647 !important;
          position: fixed !important;
          pointer-events: auto !important;
          border-radius: 0 !important;
        }

        /* CHAT BUTTON — square lime tile with FitGuide icon */
        #chat-button {
          background: #cbf22b !important;
          color: #171e00 !important;
          width: 64px !important;
          height: 64px !important;
          right: 24px !important;
          bottom: 24px !important;
          border: 2px solid #171e00 !important;
          border-radius: 0 !important;
          font-family: 'Bebas Neue', sans-serif !important;
          font-size: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: none !important;
          transition: transform 0.15s ease, background 0.15s ease !important;
        }
        #chat-button::after {
          content: 'FIT';
          font-family: 'Bebas Neue', sans-serif !important;
          font-size: 22px !important;
          letter-spacing: 0.08em !important;
          font-weight: 700;
          color: #171e00;
          line-height: 1;
        }
        #chat-button:hover {
          background: #ffffff !important;
          transform: translateY(-2px);
        }
        #chat-button > * {
          display: none !important;
        }
        #chat-button::after {
          display: inline !important;
        }

        /* CHAT WINDOW — dark, editorial */
        #chat-window {
          background: #121409 !important;
          color: #e3e4d0 !important;
          right: 24px !important;
          bottom: 100px !important;
          border: 1px solid #454934 !important;
          border-radius: 0 !important;
          font-family: 'Geist', sans-serif !important;
          width: 360px !important;
          max-height: 600px !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6) !important;
        }
        #chat-window * {
          font-family: 'Geist', sans-serif !important;
          border-radius: 0 !important;
        }

        /* Header bar inside chat window */
        #chat-window > div:first-child,
        #chat-window header,
        #chat-header {
          background: #1e2115 !important;
          color: #cbf22b !important;
          border-bottom: 1px solid #454934 !important;
          border-radius: 0 !important;
          font-family: 'Bebas Neue', sans-serif !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase;
        }

        /* Close button */
        #close-chat,
        #chat-close {
          color: #c9c6c0 !important;
          background: transparent !important;
          border: none !important;
          font-family: 'Geist', sans-serif !important;
          font-size: 12px !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase;
        }
        #close-chat:hover { color: #cbf22b !important; }

        /* Messages area */
        #chat-messages,
        #chat-window [class*="message"] {
          background: #121409 !important;
        }

        /* Input field */
        #chat-window input,
        #chat-window textarea {
          background: #0d0f05 !important;
          color: #e3e4d0 !important;
          border: 1px solid #454934 !important;
          border-radius: 0 !important;
          font-family: 'Geist', sans-serif !important;
          font-size: 14px !important;
        }
        #chat-window input:focus,
        #chat-window textarea:focus {
          border-color: #cbf22b !important;
          outline: none !important;
        }
        #chat-window input::placeholder,
        #chat-window textarea::placeholder {
          color: #8f937a !important;
          text-transform: uppercase;
          font-size: 11px !important;
          letter-spacing: 0.08em !important;
        }

        /* Send button and other CTAs inside the widget */
        #chat-window button {
          background: #cbf22b !important;
          color: #171e00 !important;
          border: none !important;
          border-radius: 0 !important;
          font-family: 'Geist', sans-serif !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          letter-spacing: 0.08em !important;
          font-size: 12px !important;
        }
        #chat-window button:hover {
          background: #ffffff !important;
        }

        /* Bot bubble */
        #chat-window [class*="bot"],
        #chat-window [data-role="assistant"] {
          background: #1e2115 !important;
          color: #e3e4d0 !important;
          border-left: 2px solid #cbf22b !important;
          border-radius: 0 !important;
        }

        /* User bubble */
        #chat-window [class*="user"],
        #chat-window [data-role="user"] {
          background: #292b1e !important;
          color: #e3e4d0 !important;
          border-radius: 0 !important;
        }
      `;
      document.head.appendChild(style);
      const attachHandlers = () => {
        const btn = document.getElementById('chat-button') as HTMLElement | null;
        const win = document.getElementById('chat-window') as HTMLElement | null;
        const close = document.getElementById('close-chat') as HTMLElement | null;
        if (!btn || !win) return false;
        btn.onclick = () => {
          const visible = win.style.display === 'flex';
          if (visible) {
            win.style.display = 'none';
            btn.style.display = 'flex';
          } else {
            win.style.display = 'flex';
            btn.style.display = 'none';
          }
        };
        if (close) {
          close.onclick = () => {
            win.style.display = 'none';
            const b = document.getElementById('chat-button') as HTMLElement | null;
            if (b) b.style.display = 'flex';
          };
        }
        return true;
      };
      if (!attachHandlers()) {
        const observer = new MutationObserver(() => {
          if (attachHandlers()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    };
    script.onerror = () => {
      // Graceful degrade: do nothing, widget may be temporarily unavailable
    };
    if (!document.getElementById('doctorbot-script')) {
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
