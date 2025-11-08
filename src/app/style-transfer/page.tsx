"use client";

import { useEffect, useState } from "react";
import OpenAI from "openai";
import axios from "axios";
import ImageSelector from "../components/ImageSelector";
import {
  ChevronDown,
  ChevronUp,
  DownloadIcon,
  WandSparkles,
} from "lucide-react";
import { showNotification } from "../components/Notification";

const styles = [
  {
    name: "Ghibli",
    description:
      "Studio Ghibli-style illustration. Draw the person as a character from a Studio Ghibli film with soft colors and whimsical features.",
  },
  {
    name: "Simpsons",
    description:
      "Simpsons character style. Draw the person as a character from The Simpsons with yellow skin and exaggerated features. ",
  },
  {
    name: "Disney",
    description:
      "Disney animated character style. Draw the person as a classic Disney character with exaggerated features. Use bright colors and smooth shading. Make it look magical and whimsical. ",
  },
  {
    name: "Moomin",
    description:
      "Moomin character sketch style. Draw Moomintroll or other characters from the Moominvalley but make them look like the person in the photo.",
  },
  {
    name: "LEGO",
    description:
      "LEGO minifigure style. Draw the person as a minifigure with blocky features and bright colors. Use plastic-like texture and photorealistic lighting.",
  },
];

export default function FaceSwapper() {
  const [prompt, setPrompt] = useState(``);

  const [showSettings, setShowSettings] = useState(false);
  const [image1Preview, setImage1Preview] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    styles[0].name
  );

  useEffect(() => {
    setPrompt(
      `Make an image of the cartoon character. Use ${styles
        .filter((style) => style.name === selectedStyle)
        .map(
          (style) => style.description
        )}\n\nCartoon character should look like the person provided in photo. Use facial features, hair and clothing same as on the image with person. Incorporate elements from the photo into the character design.\n\nReturn only the new image as a response.`
    );
  }, [selectedStyle]);

  const composeMessages = () => {
    if (!image1Preview) {
      return [];
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `You are a professional graphic designer and artist.`,
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
    quality: number = 0.8
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));

        // scaled dimensions
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // draw scaled image properly
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const newBase64 = canvas.toDataURL("image/jpeg", quality);

          // optional: for debugging
          // setOutputImage(newBase64);

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
        model: "openai/gpt-5-image-mini",
        messages,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setIsGenerating(false);

      let errorMessage = "Failed to generate image.";
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      showNotification("Error", errorMessage, "error");
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

    // setOutputImage(`data:image/png;base64,${image}`);
    addFrameToImage(`data:image/png;base64,${image}`);
  };

  
  const addFrameToImage = (base64Image: string) => {
    const frame = new Image();

    frame.src = "/style-transfer/frame-01.png";
    frame.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const baseImage = new Image();
      baseImage.src = base64Image;
      baseImage.onload = () => {
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        ctx.drawImage(baseImage, 0, 0);
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

        const newBase64 = canvas.toDataURL("image/png");
        setOutputImage(newBase64);
      };
    };
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:items-center justify-center p-4 pb-40 ${
        isGenerating ? "cursor-wait" : ""
      }`}
    >
      <h1 className="text-5xl font-bold mb-2 text-white ">StyleTransfer</h1>
      <div className="text-violet-400 mb-10">
        Upload your photo, choose a style, and let AI do the rest!
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Style
              </label>
              {/* show list of buttons to be clicked */}
              <div className="grid grid-cols-2 gap-4">
                {styles.map((style) => (
                  <button
                    key={style.name}
                    type="button"
                    onClick={() => setSelectedStyle(style.name)}
                    className={`p-4 border rounded-lg text-left hover:shadow-lg transition ${
                      selectedStyle === style.name
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    } hover:cursor-pointer`}
                  >
                    <h3 className="text-lg font-semibold mb-1">{style.name}</h3>
                    <p className="text-sm text-gray-600">{style.description}</p>
                  </button>
                ))}
              </div>
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
                    disabled={!prompt || !image1Preview}
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
