import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ProjectProvider } from "./context/ProjectContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";
import { ScriptSaveProvider } from "./context/ScriptSaveContext";
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ProjectProvider>
      <ToastProvider>
        <ConfirmProvider>
          <ScriptSaveProvider>
            <App />
          </ScriptSaveProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ProjectProvider>
  </React.StrictMode>
);
