import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="boot-error">
          <h1>Application error</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => {
            localStorage.removeItem('yt_ad_token');
            window.location.href = '/login';
          }}>Reset login</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  rootElement.innerHTML = `
    <div class="boot-error">
      <h1>Application failed to start</h1>
      <p>${error.message}</p>
      <button onclick="localStorage.removeItem('yt_ad_token'); location.href='/login'">Reset login</button>
    </div>
  `;
}
