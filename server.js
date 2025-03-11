// index.tsx (Bun v1.2 runtime)
import { Hono } from "hono@4";
import { cors } from "hono/cors";
import puppeteer from "puppeteer";

const app = new Hono();

// Enable CORS for all routes
app.use("/*", cors());

// API endpoint: fetches page content from Growtopia and returns selected fields
app.get("/api/source", async (c) => {
  try {
    // Launch Puppeteer in headless mode
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to the target page and wait until network is idle
    await page.goto("https://growtopiagame.com/detail", { waitUntil: "networkidle0" });
    
    // Retrieve the page’s body text (assuming the page returns a JSON string)
    const content = await page.evaluate(() => document.body.innerText);
    await browser.close();
    
    // Parse the JSON content
    const jsonData = JSON.parse(content);
    
    // Extract the current player count and the full_size image string
    const onlineUser = jsonData.online_user;
    const fullSize = jsonData.world_day_images?.full_size || "";
    
    // Extract the image name from a string like "worlds/historytimeline.png"
    let imageName = "";
    const match = fullSize.match(/worlds\/(.*)\.png/);
    if (match && match[1]) {
      imageName = match[1];
    }
    
    // Return a JSON object with only the online_user and image_name fields
    return c.json({ online_user: onlineUser, image_name: imageName });
  } catch (error) {
    return c.json({ error: "Failed to fetch source code" }, 500);
  }
});

// Start the server on the specified port
Bun.serve({
  port: import.meta.env.PORT ?? 3000,
  fetch: app.fetch,
});
