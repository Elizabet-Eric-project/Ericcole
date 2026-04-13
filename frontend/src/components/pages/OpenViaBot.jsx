import React from 'react';

export default function OpenViaBot({ botUsername }) {
  const botLink = botUsername ? `https://t.me/${botUsername}` : 'https://t.me';

  return (
    <div className="open-via-bot-page">
      <div className="open-via-bot-card">
        <div className="open-via-bot-badge">Telegram Web App</div>
        <h1 className="open-via-bot-title">Открывайте приложение через нашего бота</h1>
        <p className="open-via-bot-text">
          Для безопасной авторизации и корректной работы приложение нужно запускать только внутри Telegram.
        </p>
        <a className="open-via-bot-button" href={botLink} target="_blank" rel="noreferrer">
          Открыть бота
        </a>
        {botUsername ? <div className="open-via-bot-note">@{botUsername}</div> : null}
      </div>
    </div>
  );
}
