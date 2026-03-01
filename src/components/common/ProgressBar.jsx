import { Progress } from "@/components/ui/progress";

/**
 * Accessible progress bar with optional label.
 * Backed by shadcn Progress primitive.
 * @param {number} [progress=0] - Progress percentage (0–100).
 * @param {string} [label=""] - Optional descriptive label shown above the bar.
 */
const ProgressBar = ({ progress = 0, label = "" }) => {
  const value = Math.min(100, Math.max(0, Number(progress)));
  return (
    <div className="w-full font-sans">
      {label && (
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      )}
      <Progress value={value} />
      <p className="text-xs text-gray-500 mt-1">{value}%</p>
    </div>
  );
};

export default ProgressBar;
