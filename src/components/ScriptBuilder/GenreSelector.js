import React from "react";
import Select from "react-select";

const genreOptions = [
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "comedy", label: "Comedy" },
  { value: "drama", label: "Drama" },
  { value: "fantasy", label: "Fantasy" },
  { value: "thriller", label: "Thriller" },
  { value: "documentary", label: "Documentary" },
  { value: "romance", label: "Romance" },
  { value: "action", label: "Action" },
  { value: "horror", label: "Horror" },
  { value: "mystery", label: "Mystery" },
  { value: "adventure", label: "Adventure" },
  { value: "animation", label: "Animation" },
  { value: "crime", label: "Crime" },
  { value: "family", label: "Family" },
  { value: "musical", label: "Musical" },
  { value: "war", label: "War" },
  { value: "western", label: "Western" }
];

export default function GenreSelector({ selectedGenres, setSelectedGenres }) {
  return (
    <Select
      isMulti
      options={genreOptions}
      value={selectedGenres}
      onChange={setSelectedGenres}
      placeholder="Select Genres"
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
