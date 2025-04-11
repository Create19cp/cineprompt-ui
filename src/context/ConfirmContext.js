import React, { createContext, useContext, useState } from "react";

const ConfirmContext = createContext();

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    message: "",
    isOpen: false,
    onConfirm: () => {},
  });

  const confirm = (message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        onConfirm: () => {
          setConfirmState({ ...confirmState, isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          setConfirmState({ ...confirmState, isOpen: false });
          resolve(false);
        },
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-dialog-centered cp-modal-fade">
            <div className="modal-content cp-bg-dark text-white cp-rounded overflow-hidden">
            
                <div className="modal-body p-4 p-lg-5 text-center">
                    <p className="mb-4 fs-5 fw-600">Delete {confirmState.message}</p>
                    <div className="d-flex gap-2 justify-content-center">
                        <button className="btn cp-btn-dark" onClick={confirmState.onCancel}>
                            Cancel
                        </button>
                        <button className="btn cp-btn-red" onClick={confirmState.onConfirm}>
                            Delete
                        </button>
                    </div>
                </div>
             
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
