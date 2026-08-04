import { PrismaClient, Gender, BloodGroup } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- Helpers ----------
const maleNames = [
  "Sanjay",
  "Ramesh",
  "Suresh",
  "Dipesh",
  "Prakash",
  "Bikash",
  "Sudarshan",
  "Rabin",
  "Kamal",
  "Pritam",
];
const femaleNames = [
  "Anita",
  "Sita",
  "Rashmi",
  "Sunita",
  "Asmita",
  "Binita",
  "Kusum",
  "Mina",
  "Karishma",
  "Elina",
];
const surnames = [
  "Kumar",
  "Sharma",
  "Thapa",
  "Magar",
  "KC",
  "Rai",
  "Limbu",
  "Gurung",
  "Basnet",
  "Poudel",
];
const parentNames = [
  "Raj",
  "Suman",
  "Hari",
  "Manoj",
  "Kamal",
  "Gopal",
  "Maya",
  "Rita",
  "Sarita",
  "Dilip",
];
const cities = [
  "Kathmandu",
  "Pokhara",
  "Lalitpur",
  "Biratnagar",
  "Chitwan",
  "Dang",
  "Jhapa",
  "Nuwakot",
  "Butwal",
];

function randomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return "98" + Math.floor(10000000 + Math.random() * 90000000).toString();
}

function randomDOB() {
  const year = Math.floor(Math.random() * (2011 - 2005 + 1)) + 2005; // Students aged ~14–20
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;

  return new Date(year, month, day);
}

function randomEmail(name: string, index: number) {
  return `${name.toLowerCase()}.${index}@example.com`;
}

function randomBloodGroup(): BloodGroup {
  const groups: BloodGroup[] = [
    BloodGroup.A_POSITIVE,
    BloodGroup.B_POSITIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.O_NEGATIVE,
    BloodGroup.AB_POSITIVE,
  ];
  return groups[Math.floor(Math.random() * groups.length)];
}

// ---------------------------------------

async function main() {
  console.log("🌱 Seeding 100 students...");

  const students = [];

  for (let i = 1; i <= 100; i++) {
    const isMale = Math.random() > 0.5;

    const firstName = isMale ? randomItem(maleNames) : randomItem(femaleNames);
    const lastName = randomItem(surnames);
    const fullname = `${firstName} ${lastName}`;

    const parent = `${randomItem(parentNames)} ${lastName}`;

    students.push({
      fullname,
      gender: isMale ? Gender.MALE : Gender.FEMALE,
      dob: randomDOB(),
      parentName: parent,
      dress: Math.random() > 0.5,
      books: Math.random() > 0.3,
      hostel: Math.random() > 0.7,
      citizenship_number: Math.floor(
        1000000000 + Math.random() * 9000000000
      ).toString(),
      blood_group: randomBloodGroup(),
      permanent_address: randomItem(cities),
      temporary_address: randomItem(cities),
      contact_number_student: randomPhone(),
      contact_number_parent: randomPhone(),
      height: (140 + Math.floor(Math.random() * 40)).toString(), // 140–180 cm
      heightUnit: "cm",
      weight: (40 + Math.floor(Math.random() * 40)).toString(), // 40–80 kg
      weightUnit: "kg",
      qualifications: ["SEE Passed"],
      email: randomEmail(firstName, i),
      images: ["default.jpg"],
    });
  }

  for (const student of students) {
    await prisma.student.create({ data: student });
  }

  console.log("🎉 100 Students seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
