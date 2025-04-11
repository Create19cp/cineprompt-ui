import React, { createContext, useContext, useState } from "react";
import "../styles/toast.css";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success", // success, error, info, etc.
  });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };
  

  const value = {
    triggerToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Renderer */}
      {toast.show && (
        <div
          className="toast-container position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast text-white cp-toast cp-toast-${toast.type} show`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast({ ...toast, show: false })}
              ></button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
