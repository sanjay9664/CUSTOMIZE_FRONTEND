import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
import App from './App.jsx'
import { installGlobalFetchInterceptor } from './services/fetchInterceptor.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import './global.css'

// Install global fetch interceptor to handle token expiry (< 15 min), proactive refresh, and 401 retries
installGlobalFetchInterceptor();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}><App /></Provider>
  </React.StrictMode>,
)

