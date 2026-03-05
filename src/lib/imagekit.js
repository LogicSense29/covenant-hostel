import ImageKit from "imagekit";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

if (!publicKey || !privateKey || !urlEndpoint) {
  console.error("❌ ImageKit Configuration Error: Missing required environment variables.");
  if (!publicKey) console.error("   - Missing: NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY");
  if (!privateKey) console.error("   - Missing: IMAGEKIT_PRIVATE_KEY");
  if (!urlEndpoint) console.error("   - Missing: NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT");
} else {
  console.log("✅ ImageKit initialized successfully.");
}

export const imagekit = new ImageKit({
  publicKey: publicKey || "MISSING",
  privateKey: privateKey || "",
  urlEndpoint: urlEndpoint || ""
});
