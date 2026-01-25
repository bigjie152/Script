"use client";

import { useState, useRef } from "react";
import { Upload, Wand2, Loader2, Image as ImageIcon, Download, Sparkles } from "lucide-react";
import { editImageWithGemini } from "../../services/geminiService";

const ImageGenerator: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile || !prompt) return;
    setIsGenerating(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        const mimeType = selectedFile.type;

        try {
          const resultBase64 = await editImageWithGemini(base64Data, mimeType, prompt);
          setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (err: any) {
          setError(err.message || "生成图片失败。");
        } finally {
          setIsGenerating(false);
        }
      };

      reader.onerror = () => {
        setError("读取文件失败。");
        setIsGenerating(false);
      };
    } catch (error: any) {
      setError(error.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">AI拓展功能</h2>
        <p className="text-gray-500 mt-1">
          探索由 AI 驱动的创意工具集。当前功能：智能绘图与图像编辑。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto lg:h-[600px]">
        <div className="flex flex-col gap-6">
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer relative overflow-hidden bg-gray-50 ${
              previewUrl ? "border-indigo-300" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-100"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={24} />
                </div>
                <p className="text-gray-700 font-medium">点击或拖拽上传图片</p>
                <p className="text-xs text-gray-400 mt-2">支持 JPG, PNG 格式</p>
              </div>
            )}

            {previewUrl && (
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">原图</div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">编辑指令</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：添加复古滤镜，移除背景中的人物，变成素描风格..."
                className="w-full border border-gray-200 rounded-xl p-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
              />
              <div className="absolute bottom-3 right-3 text-gray-400 pointer-events-none">
                <Wand2 size={16} />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedFile || !prompt || isGenerating}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                !selectedFile || !prompt || isGenerating
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
              }`}
              type="button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  生成
                </>
              )}
            </button>
            {error && <p className="mt-3 text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-1 flex flex-col relative shadow-inner overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
              <ImageIcon size={12} /> 生成预览
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
            ) : (
              <div className="text-center text-gray-600">
                <div className="w-20 h-20 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} className="opacity-50" />
                </div>
                <p>生成的图片将显示在这里</p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center rounded-b-xl">
              <p className="text-gray-400 text-xs truncate max-w-[70%]">指令：{prompt}</p>
              <a
                href={generatedImage}
                download="generated-asset.png"
                className="flex items-center gap-2 bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <Download size={14} /> 下载
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
