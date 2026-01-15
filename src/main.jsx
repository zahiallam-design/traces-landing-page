import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FeedbackForm from './components/FeedbackForm'
import './index.css'

const isFeedbackPage = typeof window !== 'undefined'
  && /^\/feedback\/?$/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')).render(
  isFeedbackPage ? <FeedbackForm /> : <App />
)

