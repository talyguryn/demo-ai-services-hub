"use client";

import { useState } from "react";
import OpenAI from "openai";
import axios from "axios";
import ImageSelector from "../components/ImageSelector";
import {
  ChevronDown,
  ChevronUp,
  DownloadIcon,
  WandSparkles,
} from "lucide-react";
import { Poster } from "../utils/PosterImage";
import { showNotification } from "../components/Notification";

export default function FaceSwapper() {
  const [prompt, setPrompt] = useState(
    `Make a new one soviet poster keeping artistic style from the second image and using person from the first photo. Person from the first photo must be placed into the poster from the second image.

The person must be instantly recognizable as the same individual, preserving facial features, hairstyle, skin tone, and clothing.

Draw person using poster styles for character to fit it into the style.`
  );

  const [showSettings, setShowSettings] = useState(false);
  const [image1Preview, setImage1Preview] = useState<string | null>(null);
  const [image2Preview, setImage2Preview] = useState<string | null>(Poster);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // function to compose messages to ai
  const composeMessages = () => {
    // convert images to base64
    if (!image1Preview || !image2Preview) {
      return [];
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `You are a professional graphic designer and photo editor skilled in advanced image manipulation techniques.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: { url: image1Preview },
          },
          {
            type: "image_url",
            image_url: { url: image2Preview },
          },
        ],
      },
    ];

    console.log("Composed messages:", messages);

    return messages;
  };

  const downloadGeneratedImage = () => {
    if (!outputImage) return;

    const link = document.createElement("a");
    link.href = outputImage;
    link.download = "generated_poster.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  interface CompressBase64ImageOptions {
    quality?: number;
  }

  async function compressBase64Image(
    base64: string,
    quality: CompressBase64ImageOptions["quality"] = 0.8
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const newBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(newBase64);
        }
      };
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const messages = composeMessages();

    setIsGenerating(true);

    let gptResponse;

    try {
      gptResponse = await axios.post("/api/ai", {
        model: "google/gemini-2.5-flash-image-preview",
        messages,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      setIsGenerating(false);
      showNotification(
        "Error",
        error?.response?.data?.error || "Failed to generate image.",
        "error"
      );
      return;
    }

    setIsGenerating(false);

    // @ts-ignore
    const image = gptResponse.data.response.image;

    // if image starts with data:image/png;base64, then no need to add it again
    if (image.startsWith("data:image/png;base64,")) {
      setOutputImage(image);
      return;
    }

    setOutputImage(`data:image/png;base64,${image}`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:items-center justify-center p-4 pb-40 ${
        isGenerating ? "cursor-wait" : ""
      }`}
    >
      <h1 className="text-5xl font-bold mb-2 text-white ">FacePoster</h1>
      <div className="text-violet-400 mb-10">
        Upload your photo, choose a poster, and let AI do the rest!
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl flex-col md:flex gap-2">
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="image1"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                User photo
              </label>

              <ImageSelector
                onImageSelect={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const compressedImage = compressBase64Image(
                      e.target?.result as string,
                      0.8
                    ).then((compressed) => {
                      setImage1Preview(compressed);
                    });
                  };
                  reader.readAsDataURL(file);
                }}
                text="Select your photo"
                selectedImageUrl={image1Preview || ""}
              />
            </div>
            <div>
              <label
                htmlFor="image2"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Poster image
              </label>

              <ImageSelector
                onImageSelect={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const compressedImage = compressBase64Image(
                      e.target?.result as string,
                      0.8
                    ).then((compressed) => {
                      setImage2Preview(compressed);
                    });
                  };
                  reader.readAsDataURL(file);
                }}
                text="Select a poster image"
                selectedImageUrl={image2Preview || ""}
              />
            </div>
            <div>
              <span
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-gray-400 hover:text-gray-500 mb-2 cursor-pointer flex items-center gap-1"
              >
                {showSettings ? "Hide" : "Show"} Additional Settings{" "}
                {showSettings ? (
                  <ChevronUp strokeWidth={1.5} size={"1.4em"} />
                ) : (
                  <ChevronDown strokeWidth={1.5} size={"1.4em"} />
                )}
              </span>

              {showSettings && (
                <>
                  <div>
                    <label
                      htmlFor="prompt"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Prompt
                    </label>
                    <textarea
                      id="prompt"
                      name="prompt"
                      rows={10}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Enter your prompt here..."
                    />
                  </div>
                </>
              )}

              <div className="mt-4">
                {!isGenerating && (
                  <button
                    type="submit"
                    className="w-full bg-red-400 text-white p-2 rounded-md hover:bg-red-500 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!prompt || !image1Preview || !image2Preview}
                  >
                    <>
                      <WandSparkles strokeWidth={1.5} size={"1.2em"} /> Generate
                      Poster
                    </>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
        <div className="flex-2">
          {outputImage && (
            <div className="">
              <img
                src={outputImage}
                alt="Output Image"
                className="w-full rounded-md"
              />
              {outputText && (
                <>
                  <h2 className="text-xl font-bold mt-4 mb-2">Output Text</h2>
                  <p className="text-gray-700">{outputText}</p>
                </>
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                {/* download button */}
                <div
                  className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 w-full cursor-pointer"
                  onClick={downloadGeneratedImage}
                >
                  <DownloadIcon strokeWidth={1.5} size={"1.2em"} /> Download
                  Image
                </div>
              </div>
            </div>
          )}
          {!outputImage && isGenerating && (
            <div className="w-full  aspect-[3/4] rounded-md border border-gray-200 bg-gray-100 relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-gray-400"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                  />
                </svg>
                <span className="text-sm">Generating poster...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <a href="/" className="mt-10 text-violet-500 hover:text-violet-300">
        AI Services Hub
      </a>
    </div>
  );
}
