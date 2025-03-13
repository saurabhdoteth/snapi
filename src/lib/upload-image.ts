interface ImgBBResponse {
  data: {
    url: string;
    display_url: string;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export async function uploadToImgBB(base64Image: string): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("ImgBB API key is not configured");
  }

  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64Data);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const result: ImgBBResponse = await response.json();

  if (!result.success) {
    throw new Error("Failed to upload image");
  }

  return result.data.url;
}
