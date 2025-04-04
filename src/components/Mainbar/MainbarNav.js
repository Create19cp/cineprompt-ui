import React from "react";

export default function MainbarNav() {
  return (
    <div id="cp-mainnav" className="p-3 cp-rounded cp-bg-dark col-12">
        <div className="row g-4">
            
            <div className="col-lg-4">
              <div className="cp-bg-darker cp-text-grey px-3 py-2 cp-rounded-sm d-flex justify-content-between">
                  <p className="mb-0">The Mini Matrix</p>
                  <i className="bi bi-caret-down-fill cp-text-green"></i>
              </div>
            </div>
            
            <div className="col text-end">
              <a href="#0" className="btn cp-btn-dark"><i className="i bi-floppy cp-text-green me-2"></i> Save</a>
            </div>

        </div>
    </div> 
    
  );
}