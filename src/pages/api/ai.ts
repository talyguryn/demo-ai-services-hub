import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
// import fs from "fs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { messages, model } = req.body;

  if (!model) {
    return res.status(400).json({ error: "Model is required" });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages must be an array" });
  }

  console.log("[GPT] Messages:", messages);

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    console.log("[GPT] Completion:", JSON.stringify(completion, null, 2));

    // save completion to a file for debugging
    // fs.writeFileSync("completion.json", JSON.stringify(completion, null, 2));

    // @ts-ignore
    const images = completion.choices[0].message.images;
    if (Array.isArray(images)) {
      for (const image of images) {
        if (image.type === "image_url" && image.image_url?.url) {
          const imageUrl = image.image_url.url;
          // console.log("Image URL:", imageUrl);

          // Download the image and save it locally
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // image to base64
          const base64Image = buffer.toString("base64");

          return res.status(200).json({
            response: {
              image: base64Image,
            },
          });
        }
      }
    }
    return res.status(500).json({ error: "No image found in the response" });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    return res.status(500).json({ error: "Error calling OpenAI API" });
  }
}
