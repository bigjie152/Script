"use client";

import { useState, useRef } from "react";
import { Sparkles, Upload, Wand2, X, Download } from "lucide-react";
import { editImageWithGemini } from "../services/geminiService";

const ImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result as string;
      setSelectedImage(result);
      setGeneratedImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await editImageWithGemini(selectedImage, prompt);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "生成失败，请稍后再试。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={18} />
          AI 图像编辑器
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          上传参考图，描述你想要的修改，使用 Gemini 进行智能重绘。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group min-h-[160px] flex flex-col items-center justify-center overflow-hidden"
          onClick={() => !selectedImage && fileInputRef.current?.click()}
        >
          {selectedImage ? (
            <>
              <img
                src={selectedImage}
                alt="Source"
                className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:opacity-60 transition-opacity"
              />
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImage(null);
                  setGeneratedImage(null);
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full z-10"
                type="button"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                原图
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <span className="text-sm text-gray-600 font-medium">
                点击上传图片
              </span>
              <span className="text-xs text-gray-400 mt-1">支持 JPG, PNG</span>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 uppercase">
            编辑指令
          </label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：添加复古滤镜，或移除背景中的路人..."
            className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px] resize-none"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerate}
            disabled={!selectedImage || !prompt || isGenerating}
            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              !selectedImage || !prompt || isGenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
            }`}
            type="button"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                生成中...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                开始生成
              </>
            )}
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        {generatedImage && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-700 uppercase">
              生成结果
            </label>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm group">
              <img src={generatedImage} alt="Generated" className="w-full h-auto" />
              <a
                href={generatedImage}
                download="gemini-edit.png"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download size={16} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
