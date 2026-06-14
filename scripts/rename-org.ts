import { db } from "../src/db/client.ts";
import { organizations, members } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

// 1. Rename org
const [org] = await db
  .update(organizations)
  .set({ name: "START BERLIN" })
  .where(eq(organizations.slug, "demo"))
  .returning({ id: organizations.id, name: organizations.name });
console.log("Org renamed:", org);

// 2. Rename existing 8 members (by telegramId from seed)
const renames: [number, string][] = [
  [100001, "Lion Abboud-Herbert"],
  [100002, "Cedrick Manzi"],
  [100003, "Álvaro Torres"],
  [100004, "Leonardo Bressan"],
  [100005, "Leonie Sophie Bender"],
  [100006, "Nikolaos Magklis"],
  [100007, "Alisa Adamska"],
  [100008, "Julia Krysztofowicz"],
];

for (const [telegramId, displayName] of renames) {
  await db.update(members).set({ displayName }).where(eq(members.telegramId, telegramId));
  console.log(`  Updated ${telegramId} → ${displayName}`);
}

// 3. Add remaining members from the full list
const newMembers = [
  "Alberto Bueno",
  "Alice Doudou Zhai",
  "Anna Brinkkötter",
  "Anna Reschke",
  "Arne Zalikowski",
  "Benjamin Kapell",
  "Bo Ehrich",
  "Daria Jochmann",
  "Jannik Schaefer",
  "Jonathan Kubala",
  "Kari-Pele Streithoff",
  "Leander Neubronner",
  "Lilly Vannahme",
  "Linhchi Bui",
  "Marta Kielpinski",
  "Mohamed Salama",
  "Paul Steinau",
  "Ramin von Maydell",
  "René Thirase",
  "Rhema Tamunoiyowuna",
  "Robin Lahser",
  "Sarah Rahabi",
  "Selina Kümmeringer",
  "Seoyoung Park",
  "Tobias Burger",
  "Viktor Gandl",
];

let fakeId = 200001;
for (const displayName of newMembers) {
  await db.insert(members).values({
    orgId: org.id,
    telegramId: fakeId++,
    displayName,
    role: "member",
  });
  console.log(`  Added ${displayName}`);
}

console.log("Done.");
process.exit(0);
