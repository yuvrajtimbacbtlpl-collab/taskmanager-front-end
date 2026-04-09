// src/components/Loader.jsx
// Exact same as original

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
}
