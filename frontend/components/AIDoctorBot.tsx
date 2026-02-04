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
      headerText: 'AI-Doctor Assistant',
      buttonText: '💬',
      placeholder: 'Describe your symptoms...',
      position: 'bottom-right',
      theme: 'medical',
    };

    const script = document.createElement('script');
    script.src = 'https://chat-bot-hizj.onrender.com/widget/widget.js';
    script.async = true;
    script.id = 'doctorbot-script';
    script.onload = () => {
      // Ensure widget is clickable and visible above app content
      const style = document.createElement('style');
      style.textContent = `
        #chatbot-widget { z-index: 2147483647 !important; position: fixed !important; pointer-events: auto !important; }
        #chat-button { cursor: pointer; z-index: 2147483647 !important; pointer-events: auto !important; }
        #chat-window { z-index: 2147483647 !important; position: fixed !important; pointer-events: auto !important; }
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
