import React from "react";
import Select from "react-select";

const toneOptions = [
  { value: "serious", label: "Serious" },
  { value: "lighthearted", label: "Lighthearted" },
  { value: "dark", label: "Dark" },
  { value: "satirical", label: "Satirical" },
  { value: "mysterious", label: "Mysterious" },
  { value: "uplifting", label: "Uplifting" },
  { value: "melancholic", label: "Melancholic" },
  { value: "whimsical", label: "Whimsical" },
  { value: "gritty", label: "Gritty" },
  { value: "romantic", label: "Romantic" },
  { value: "suspenseful", label: "Suspenseful" },
  { value: "comical", label: "Comical" },
  { value: "epic", label: "Epic" },
  { value: "intimate", label: "Intimate" },
  { value: "nostalgic", label: "Nostalgic" },
  { value: "surreal", label: "Surreal" }
];

export default function ToneSelector({ selectedTones, setSelectedTones }) {
  return (
    <Select
      isMulti
      options={toneOptions}
      value={selectedTones}
      onChange={setSelectedTones}
      placeholder="Select Tones"
      classNamePrefix="cp-select"
      className="cp-select-container"
      styles={{
        control: (base) => ({
          ...base,
          backgroundColor: "#1e1e1e",
          border: "1px solid #333",
          color: "#fff",
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: "#6c757d",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: "#fff",
          textTransform: "capitalize",
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "#2d3748" : "transparent",
          color: "#fff",
          textTransform: "capitalize",
        }),
      }}
    />
  );
}
