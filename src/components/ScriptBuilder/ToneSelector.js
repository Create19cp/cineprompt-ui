import React from "react";
import Select from "react-select";

const toneOptions = [
  { value: "serious", label: "Serious" },
  { value: "lighthearted", label: "Lighthearted" },
  { value: "dark", label: "Dark" },
  { value: "satirical", label: "Satirical" },
  { value: "mysterious", label: "Mysterious" },
  { value: "uplifting", label: "Uplifting" },
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
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "#2d3748" : "transparent",
          color: "#fff",
        }),
      }}
    />
  );
}
