import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const panels = [
  {
    name: "panel1-testify",
    prompt:
      "A single comic strip panel, clean ink style with flat colors. An angry man pointing at the viewer, speech bubble says 'She NEVER does the dishes!'. Simple white background with halftone dots. Bold black outlines, pop art comic style. No text outside the speech bubble.",
  },
  {
    name: "panel2-respond",
    prompt:
      "A single comic strip panel, clean ink style with flat colors. An angry woman with crossed arms, speech bubble says 'He cooked ONCE... in 2019!'. Simple white background with halftone dots. Bold black outlines, pop art comic style. No text outside the speech bubble.",
  },
  {
    name: "panel3-jury",
    prompt:
      "A single comic strip panel, clean ink style with flat colors. A stern woman judge with glasses sitting behind a desk, looking unimpressed, speech bubble says 'I have heard enough.'. Simple white background with halftone dots. Bold black outlines, pop art comic style. Red accent color on the judge gavel. No text outside the speech bubble.",
  },
  {
    name: "panel4-votes",
    prompt:
      "A single comic strip panel, clean ink style with flat colors. A crowd of diverse people all pointing upward and voting, a scoreboard showing '72% say she is right'. Simple white background with halftone dots. Bold black outlines, pop art comic style. No text outside the scoreboard.",
  },
];

async function generate() {
  const outDir = path.join(__dirname, "../public/comic");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const panel of panels) {
    console.log(`Generating ${panel.name}...`);
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: panel.prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.error(`No image URL for ${panel.name}`);
        continue;
      }

      // Download the image
      const imgResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      const filePath = path.join(outDir, `${panel.name}.png`);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved ${filePath}`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Failed ${panel.name}:`, err.message);
    }
  }

  console.log("Done!");
}

generate();
