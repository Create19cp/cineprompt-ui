import React from "react";

export default function SidebarNav() {
  return (
    <div id="cp-navbar" className="d-flex flex-column text-white p-4 cp-rounded cp-bg-dark" style={{ width: "340px" }}>
        
        <div className="mb-4">
            <a href="/">
                <img src="/logo.svg" alt="CinePrompt Logo" className="w-100"/>
            </a>
        </div>

        <div className="cp-divider mb-4"></div>

        <nav className="nav nav-pills flex-column gap-2">
            <a href="#" className="nav-link cp-active text-white cp-bg-darker px-3 py-2 cp-rounded-sm">
                <div className="d-flex justify-content-between gap-2 align-items-center text-center">
                    <div>
                        <span className="cp-text-green fw-bold me-1">1.</span> Script
                    </div>
                    <div className="cp-progress d-flex align-items-center justify-content-center">
                        <div className="cp-percentage">100%</div>
                    </div>
                </div>
            </a>
            <a href="#" className="nav-link text-white cp-bg-darker px-3 py-2 cp-rounded-sm">
                <div className="d-flex justify-content-between gap-2 align-items-center text-center">
                    <div>
                        <span className="cp-text-green fw-bold me-1">2.</span> Storyboard
                    </div>
                    <div className="cp-progress d-flex align-items-center justify-content-center">
                        <div className="cp-percentage">0%</div>
                    </div>
                </div>
            </a>
            <a href="#" className="nav-link text-white cp-bg-darker px-3 py-2 cp-rounded-sm">
                <div className="d-flex justify-content-between gap-2 align-items-center text-center">
                    <div>
                        <span className="cp-text-green fw-bold me-1">3.</span> Voiceover
                    </div>
                    <div className="cp-progress d-flex align-items-center justify-content-center">
                        <div className="cp-percentage">0%</div>
                    </div>
                </div>
            </a>
            <a href="#" className="nav-link text-white cp-bg-darker px-3 py-2 cp-rounded-sm">
                <div className="d-flex justify-content-between gap-2 align-items-center text-center">
                    <div>
                        <span className="cp-text-green fw-bold me-1">4.</span> Animation
                    </div>
                    <div className="cp-progress d-flex align-items-center justify-content-center">
                        <div className="cp-percentage">0%</div>
                    </div>
                </div>
            </a>
            <a href="#" className="nav-link text-white cp-bg-darker px-3 py-2 cp-rounded-sm">
                <div className="d-flex justify-content-between gap-2 align-items-center text-center">
                    <div>
                        <span className="cp-text-green fw-bold me-1">5.</span> Render
                    </div>
                    <div className="cp-progress d-flex align-items-center justify-content-center">
                        <div className="cp-percentage">0%</div>
                    </div>
                </div>
            </a>
        </nav>

    </div>
  );
}