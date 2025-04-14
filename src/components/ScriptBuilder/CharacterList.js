import React from "react";

export default function CharacterList({ characters, setCharacters, onSave }) {
  const handleDelete = (id) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
    onSave();
  };

  return (
    <div className="p-3">
      {characters.map(character => (
        <div 
          key={character.id} 
          className="d-flex align-items-center justify-content-between mb-2 p-2 cp-bg-dark cp-rounded"
        >
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-circle" 
              style={{ 
                width: "10px", 
                height: "10px", 
                backgroundColor: character.color 
              }} 
            />
            <span className="fw-600">{character.name}</span>
          </div>
          <button 
            className="btn btn-sm cp-btn-dark cp-green"
            onClick={() => handleDelete(character.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ))}
    </div>
  );
} 