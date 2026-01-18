import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './pages/Dashboard'
import WindowSize from './pages/WindowSize'
import Header from './pages/Header'

function App() {

  return (
    <>
      <Header title= "DashBoard" />
      <Dashboard/>
      <WindowSize/>
    </>
  )
}

export default App
