import React from "react";
import SidebarNav from "./Sidebar/SidebarNav";
import MainbarNav from "./Mainbar/MainbarNav";
import ScriptPage from "../pages/ScriptPage"; 

export default function CinePromptUI() {
  return (
    <section class="p-4">
      <div className="container-fluid px-0">
        <div className="row g-4">
          
          <div className="col-auto">
            <SidebarNav />
          </div>

          <div className="col">
            <MainbarNav />
            <ScriptPage />
          </div>

        </div>
      </div>
    </section>
  );
}
