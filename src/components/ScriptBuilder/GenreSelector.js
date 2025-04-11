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
  // Add more genres here
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
    />
  );
}
