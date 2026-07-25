import "dotenv/config"; // Обязательно! Загружает DATABASE_URL из вашего .env файла
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import { products } from "./../db/schema.js"; // Проверьте правильность пути к вашей схеме

const CATALOG = [
  {
    slug: "aurora-headphones",
    name: "Aurora ANC Headphones",
    category: "Audio",
    description:
      "Hybrid active noise cancellation, 40mm titanium drivers, 32-hour battery (ANC on), multipoint Bluetooth 5.3, fold-flat case included. Tuned for balanced mids — ideal for travel and focused work.",
    priceCents: 24900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGxdcKl_1FIe0xImAjnEX20HPTEa5-_znJMteKKLMDuQ&s=10",
  },
  {
    slug: "nova-watch",
    name: "Nova Smart Watch Pro",
    category: "Wearables",
    description:
      'Always-on AMOLED 1.4", SpO₂ & ECG-ready sensors, sleep stages, 5 ATM swim-proof, 18-day battery in saver mode. GPS + GLONASS for outdoor workouts.',
    priceCents: 19900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDNm1QdD2gxVUBrtfwZY_1yaAP3Pwz0hV4iCBlRVD5Iw&s=10",
  },
  {
    slug: "pulse-speaker",
    name: "Pulse Go Speaker",
    category: "Audio",
    description:
      "360° sound with dual passive radiators, IP67 dust/water, 14h playtime, stereo pairing. USB-C fast charge — party-ready footprint.",
    priceCents: 8900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSs0ZmIm7EnDk5b3o4vVvXPzGEWGzNUlLB1jN-VVJZEOQ&s=10",
  },
  {
    slug: "vertex-laptop-stand",
    name: "Vertex Aluminum Stand",
    category: "Workspace",
    description:
      'Ergonomic 6-step height, silicone pads, supports up to 10 kg. Folds flat for commute. Fits 11–17" laptops.',
    priceCents: 7900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPBeun-dyOo7d-1ldZQI6oVXJwr86h-JOVOKtKbxzUOA&s",
  },
  {
    slug: "lumen-keyboard",
    name: "Lumen Mechanical Keyboard",
    category: "Workspace",
    description:
      "Hot-swappable linear switches, PBT keycaps, gasket mount, tri-mode (USB-C / BT / 2.4G). Per-key RGB with onboard profiles.",
    priceCents: 15900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHE79G7_sSPWt8ghOnj233KO6zku89fPk5xBAEBE5Qsg&s",
  },
  {
    slug: "orbit-mouse",
    name: "Orbit Ergo Mouse",
    category: "Workspace",
    description:
      "Vertical 57° grip, silent main buttons, 4000 DPI sensor, 70-day battery, USB-C. Reduces wrist pronation during long sessions.",
    priceCents: 6900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLoGkEqhundCDvTTfbjvRM8Wi7HiyGIpVkelPHKw02ag&s=10",
  },
  {
    slug: "cascade-monitor-lamp",
    name: "Cascade Monitor Light Bar",
    category: "Workspace",
    description:
      "Asymmetric optics avoid screen glare, RA>95, auto-dimming via ambient sensor. Touch controls + warm/cool CCT presets.",
    priceCents: 9900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe491xdsWy312T0hATN7u4EPIUBuvu6S1wmX4Cti0UTA&s=10",
  },
  {
    slug: "ember-kettle",
    name: "Ember Smart Kettle",
    category: "Home",
    description:
      "Variable temperature 40–100°C, keep-warm 2h, stainless interior, boil-dry protection. App scheduling (Wi‑Fi).",
    priceCents: 12900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCr04seVFlSDKv7zE_21YJchs6dcz_U-XetZ8yUGGXuA&s=10",
  },
  {
    slug: "linen-air-purifier",
    name: "Linen HEPA Air Purifier",
    category: "Home",
    description:
      "CADR 350 m³/h, H13 HEPA + carbon, whisper 24 dB sleep mode, filter life indicator. Rooms up to 40 m².",
    priceCents: 22900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTUlXgvka7Ev3iY1d5oTz21tW7XrI9H-eyDvF46JIWGA&s",
  },
  {
    slug: "summit-backpack",
    name: "Summit 28L Backpack",
    category: "Travel",
    description:
      'Weatherproof shell, lay-flat laptop compartment (16"), luggage pass-through, recycled ripstop. 980 g.',
    priceCents: 13900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT97c0kqRvuQk2XFDsS-oQbd_FXF4bpMzLcX4acQaSF9g&s=10",
  },
  {
    slug: "voyage-organizer",
    name: "Voyage Tech Organizer",
    category: "Travel",
    description:
      "Ripstop panels, elastic grids for cables & adapters, RFID pocket, slim profile for carry-on.",
    priceCents: 4500,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKqcObHK7R_7enfQcYnf1MIqQArZkTsj6MbWSIqtESAQ&s=10",
  },
  {
    slug: "apex-mirrorless",
    name: "Apex Mirrorless Body",
    category: "Cameras",
    description:
      "24 MP BSI sensor, 4K60 10-bit internal, 5-axis IBIS, dual SD. Weather-sealed magnesium chassis — body only.",
    priceCents: 149900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPYIo2SQYAHXtxVVOGJX8cA9BmIYx4kf8MF7xQnhgA0g&s=10",
  },
  {
    slug: "prime-lens-35",
    name: "Prime 35mm f/1.4",
    category: "Cameras",
    description:
      "Nano-coated elements, linear AF motor, 0.25 m close focus, 67 mm filter thread. Street & low-light staple.",
    priceCents: 79900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgF6zlYQiOT3erDKcFp2dhCldOnkBFsIyyk8j1SvhCbQ&s=10",
  },
  {
    slug: "nimbus-hub",
    name: "Nimbus USB-C Hub",
    category: "Accessories",
    description:
      "2× USB-A 10 Gbps, HDMI 2.1 4K120, SD/microSD UHS-II, 100 W PD passthrough. Aluminum unibody, braided cable.",
    priceCents: 7900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRVhOpbhuYtcEGMHJngiIoS090rH2SCnI6E9YC3Xi0qg&s",
  },
  {
    slug: "solstice-power-bank",
    name: "Solstice 20K Power Bank",
    category: "Accessories",
    description:
      "20000 mAh, 140 W PD PPS, dual USB-C + USB-A, airline-safe. OLED charge readout, soft-touch shell.",
    priceCents: 8900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbD_krCKXAOh2wWychcrnLWv0zvGrqGBElGXHdc9r7-g&s=10",
  },
  {
    slug: "echo-earbuds",
    name: "Echo True Wireless",
    category: "Audio",
    description:
      "Adaptive ANC, spatial audio, 8h buds + 28h case, wireless charging. IPX4 sweat resistance.",
    priceCents: 17900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCQcD1W6BooK9QkT9KUeNDYIDCjIw4z4NvhszqhTkmTA&s=10",
  },
  {
    slug: "meridian-desk-mat",
    name: "Meridian Desk Mat XL",
    category: "Workspace",
    description:
      "900×400 mm vegan leather surface, anti-slip base, stitched edges. Coffee & pen safe.",
    priceCents: 5900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZj4ctdJe2S7248kdvvOsZztj7rgZd3eEwA4_XdeGyjw&s=10",
  },
  {
    slug: "atlas-water-bottle",
    name: "Atlas Insulated Bottle",
    category: "Travel",
    description:
      "32 oz vacuum stainless, 24h cold / 12h hot, powder coat, leakproof chug cap + optional straw.",
    priceCents: 3900,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgt4OeVl1yzv3K-bVjjFAKKGNhytJxbjoAiwVUYizgbw&s",
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "❌ Error: Environment variable DATABASE_URL is not set in file .env",
    );
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    const rows = CATALOG.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      priceCents: p.priceCents,
      currency: "usd",
      imageUrl: p.imageUrl,
      active: true,
    }));

    console.log("⏳ Starting seeding the Neon database...");

    await db
      .insert(products)
      .values(rows)
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: sql`EXCLUDED.name`,
          category: sql`EXCLUDED.category`,
          description: sql`EXCLUDED.description`,
          priceCents: sql`EXCLUDED.price_cents`,
          currency: sql`EXCLUDED.currency`,
          imageUrl: sql`EXCLUDED.image_url`,
          active: sql`EXCLUDED.active`,
        },
      });

    console.log(
      `✅ Seeding completed successfully! ${CATALOG.length} products added/updated.`,
    );
  } catch (error) {
    console.error(
      "❌ Error while performing seeding:",
      (error as Error).message,
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
