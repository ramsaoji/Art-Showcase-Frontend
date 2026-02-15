import React from "react";

const ProgressBar = ({ progress = 0, label = "" }) => {
  const value = Math.min(100, Math.max(0, Number(progress)));
  return (
    <div className="w-full font-sans">
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{value}%</p>
    </div>
  );
};

export default ProgressBar;
