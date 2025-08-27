import sharp from "sharp";

// ملف الـ SVG الأساسي (يفضل النسخة الفاتحة كـ base)
const svgFile = "public/icons/icon.svg";

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
// هنا نعمل عكس ألوان (invert) من نسخة الفاتحة
sharp(svgFile)
  .resize(256, 256)
  .png()
  .negate() // يقلب الألوان
  .toFile("./public/icons/icon-dark.png")
  .then(() => console.log("✅ Created icon-dark.png"));
