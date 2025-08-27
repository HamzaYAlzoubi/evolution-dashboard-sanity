import sharp from "sharp";
import fs from "fs/promises";

async function generateIcons() {
  // ملف الـ SVG الأساسي (يفضل النسخة الفاتحة كـ base)
  const svgFile = "public/icons/icon.svg";
  const svgContent = await fs.readFile(svgFile, "utf-8");

  // أحجام PWA (فاتحة)
  const sizes = [192, 512];
  for (const size of sizes) {
    sharp(svgFile)
      .resize(size, size)
      .png()
      .toFile(`./public/icons/icon-${size}.png`)
      .then(() => console.log(`✅ Created icon-${size}.png`));
  }

  // نسخة maskable (فاتحة)
  sharp(svgFile)
    .resize(512, 512)
    .png()
    .toFile("./public/icons/icon-maskable.png")
    .then(() => console.log("✅ Created icon-maskable.png"));

  // نسخة light (favicon فاتحة)
  sharp(svgFile)
    .resize(256, 256)
    .png()
    .toFile("./public/icons/icon-light.png")
    .then(() => console.log("✅ Created icon-light.png"));

  // نسخة dark (favicon غامقة)
  // هنا نغير ألوان SVG مباشرة لإنشاء نسخة بخلفية شفافة وأيقونة بيضاء
  const darkSvgContent = svgContent
    .replace('fill="#FFFFFF"', 'fill="transparent"') // خلفية شفافة
    .replace(/fill="#000000"/g, 'fill="#FFFFFF"')       // أيقونة بيضاء
    .replace(/stroke="#000000"/g, 'stroke="#FFFFFF"');   // خط أبيض

  sharp(Buffer.from(darkSvgContent))
    .resize(256, 256)
    .png()
    .toFile("./public/icons/icon-dark.png")
    .then(() => console.log("✅ Created icon-dark.png"));
}

generateIcons();
