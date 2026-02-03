"use client";

import { Sparkles } from "lucide-react";

type AiTriggerButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
  label?: string;
  className?: string;
};

const AiTriggerButton: React.FC<AiTriggerButtonProps> = ({
  onClick,
  disabled = false,
  disabledReason,
  label = "AI 生成/续写",
  className = ""
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabledReason || label}
      className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <Sparkles size={14} />
      {label}
    </button>
  );
};

export default AiTriggerButton;
