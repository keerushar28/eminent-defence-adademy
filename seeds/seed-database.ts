import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Nikhil", "Rahul", "Vikram", "Sanjay", "Amit",
  "Priya", "Anjali", "Neha", "Pooja", "Divya", "Shreya", "Ananya", "Isha", "Kavya", "Nisha",
];

const lastNames = [
  "Sharma", "Patel", "Singh", "Kumar", "Verma", "Gupta", "Reddy", "Nair", "Iyer", "Desai",
  "Rao", "Bhat", "Joshi", "Mishra", "Pandey", "Tripathi", "Saxena", "Malhotra", "Chopra", "Bansal",
];

const streets = [
  "Main Street", "Oak Avenue", "Elm Road", "Pine Lane", "Maple Drive", "Cedar Court", "Birch Boulevard",
  "Willow Way", "Ash Alley", "Spruce Street",
];

const cities = [
  "Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Biratnagar", "Janakpur", "Dharan", "Nepalgunj",
  "Birgunj", "Hetauda",
];

const bloodGroups = ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"] as const;

function getRandomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
}

function generatePhoneNumber(): string {
  return `98${getRandomInt(10000000, 99999999)}`;
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await prisma.categoryPayment.deleteMany();
    await prisma.studentCategory.deleteMany();
    await prisma.hostelPayment.deleteMany();
    await prisma.hostelAllocation.deleteMany();
    await prisma.studentIssuance.deleteMany();
    await prisma.stockTransaction.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.vendorPayment.deleteMany();
    await prisma.vendorItem.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.hostelBed.deleteMany();
    await prisma.hostelRoom.deleteMany();
    await prisma.inventoryBill.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.inventoryCategory.deleteMany();
    await prisma.subCategorySelection.deleteMany();
    await prisma.subCategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.student.deleteMany();

    // Seed Categories and SubCategories
    console.log("📚 Seeding categories...");
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Uniform",
          description: "School uniforms and dress codes",
        },
      }),
      prisma.category.create({
        data: {
          name: "Books & Stationery",
          description: "Educational materials and supplies",
        },
      }),
      prisma.category.create({
        data: {
          name: "Sports Equipment",
          description: "Sports and physical education equipment",
        },
      }),
      prisma.category.create({
        data: {
          name: "Technology",
          description: "Computers and tech devices",
        },
      }),
      prisma.category.create({
        data: {
          name: "Miscellaneous",
          description: "Other miscellaneous items",
        },
      }),
    ]);

    // Create subcategories for each category
    const subCategories = [];
    for (const category of categories) {
      for (let i = 1; i <= 4; i++) {
        const subCat = await prisma.subCategory.create({
          data: {
            name: `${category.name} - Type ${i}`,
            fee: getRandomInt(500, 5000),
            categoryId: category.id,
          },
        });
        subCategories.push(subCat);
      }
    }
    console.log(`✅ Created ${categories.length} categories and ${subCategories.length} subcategories`);

    // Seed Students
    console.log("👥 Seeding students...");
    const students = [];
    for (let i = 0; i < 100; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const student = await prisma.student.create({
        data: {
          fullname: `${firstName} ${lastName}`,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          dob: getRandomDate(new Date("2005-01-01"), new Date("2010-12-31")),
          parentName: `${getRandomElement(firstNames)} ${lastName}`,
          dress: Math.random() > 0.3,
          books: Math.random() > 0.2,
          hostel: Math.random() > 0.4,
          citizenship_number: `${getRandomInt(10000000, 99999999)}`,
          blood_group: getRandomElement(bloodGroups),
          permanent_address: `${getRandomInt(1, 100)} ${getRandomElement(streets)}, ${getRandomElement(cities)}`,
          temporary_address: `${getRandomInt(1, 100)} ${getRandomElement(streets)}, ${getRandomElement(cities)}`,
          contact_number_student: generatePhoneNumber(),
          contact_number_parent: generatePhoneNumber(),
          height: `${getRandomInt(150, 190)}`,
          heightUnit: "cm",
          weight: `${getRandomInt(40, 80)}`,
          weightUnit: "kg",
          qualifications: ["Class 10", "Class 11"],
          email: generateEmail(firstName, lastName, i),
          images: [],
          isSelected: Math.random() > 0.3,
          selectedAt: Math.random() > 0.3 ? new Date() : null,
        },
      });
      students.push(student);
    }
    console.log(`✅ Created ${students.length} students`);

    // Seed StudentCategories and SubCategorySelections
    console.log("🏷️  Seeding student categories and selections...");
    let categoryAssignments = 0;
    let selections = 0;
    for (const student of students) {
      const numCategories = getRandomInt(1, 3);
      const selectedSubCats = new Set<string>();

      for (let i = 0; i < numCategories; i++) {
        const subCat = getRandomElement(subCategories);
        if (!selectedSubCats.has(subCat.id)) {
          selectedSubCats.add(subCat.id);

          await prisma.studentCategory.create({
            data: {
              studentId: student.id,
              subCategoryId: subCat.id,
              discountAmount: getRandomInt(0, 500),
              finalFee: Number(subCat.fee) - getRandomInt(0, 500),
              totalPaid: getRandomInt(0, Number(subCat.fee)),
              durationMonths: getRandomInt(1, 12),
              isActive: Math.random() > 0.2,
            },
          });
          categoryAssignments++;

          // Create SubCategorySelection
          if (student.isSelected) {
            await prisma.subCategorySelection.create({
              data: {
                studentId: student.id,
                subCategoryId: subCat.id,
              },
            });
            selections++;
          }
        }
      }
    }
    console.log(`✅ Created ${categoryAssignments} student category assignments and ${selections} selections`);

    // Seed Vendors
    console.log("🏢 Seeding vendors...");
    const vendors = [];
    for (let i = 0; i < 20; i++) {
      const vendor = await prisma.vendor.create({
        data: {
          name: `Vendor ${i + 1}`,
          contactPerson: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
          email: `vendor${i + 1}@example.com`,
          phone: generatePhoneNumber(),
          address: `${getRandomInt(1, 100)} ${getRandomElement(streets)}, ${getRandomElement(cities)}`,
          isActive: Math.random() > 0.1,
        },
      });
      vendors.push(vendor);
    }
    console.log(`✅ Created ${vendors.length} vendors`);

    // Seed Inventory Categories
    console.log("📦 Seeding inventory categories...");
    const inventoryCategories = await Promise.all([
      prisma.inventoryCategory.create({
        data: {
          name: "Uniforms",
          description: "School uniforms and apparel",
          isBilling: false,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Books",
          description: "Textbooks and reference materials",
          isBilling: false,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Stationery",
          description: "Writing and office supplies",
          isBilling: false,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Sports Equipment",
          description: "Sports and athletic equipment",
          isBilling: false,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Electricity",
          description: "Electricity bills",
          isBilling: true,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Water",
          description: "Water bills",
          isBilling: true,
        },
      }),
      prisma.inventoryCategory.create({
        data: {
          name: "Internet",
          description: "Internet and connectivity",
          isBilling: true,
        },
      }),
    ]);
    console.log(`✅ Created ${inventoryCategories.length} inventory categories`);

    // Seed Inventory Items
    console.log("📋 Seeding inventory items...");
    const inventoryItems = [];
    const itemNames = [
      "Shirt", "Pants", "Shoes", "Notebook", "Pen", "Pencil", "Eraser", "Ruler",
      "Football", "Basketball", "Badminton Racket", "Cricket Bat", "Desk", "Chair",
    ];

    for (let i = 0; i < 100; i++) {
      const category = getRandomElement(inventoryCategories);
      const item = await prisma.inventoryItem.create({
        data: {
          name: `${getRandomElement(itemNames)} ${i + 1}`,
          description: `Item description for ${i + 1}`,
          categoryId: category.id,
          sku: `SKU-${i + 1}`,
          unit: getRandomElement(["piece", "kg", "liter", "box"]),
          currentStock: getRandomInt(0, 500),
          minStockThreshold: getRandomInt(5, 50),
          unitPrice: getRandomInt(100, 5000),
          isActive: Math.random() > 0.1,
        },
      });
      inventoryItems.push(item);
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    // Seed VendorItems
    console.log("🔗 Linking vendors to items...");
    let vendorItemCount = 0;
    for (const item of inventoryItems) {
      const numVendors = getRandomInt(1, 3);
      const selectedVendors = new Set<string>();

      for (let i = 0; i < numVendors; i++) {
        const vendor = getRandomElement(vendors);
        if (!selectedVendors.has(vendor.id)) {
          selectedVendors.add(vendor.id);
          await prisma.vendorItem.create({
            data: {
              vendorId: vendor.id,
              itemId: item.id,
            },
          });
          vendorItemCount++;
        }
      }
    }
    console.log(`✅ Created ${vendorItemCount} vendor-item links`);

    // Seed Orders
    console.log("📦 Seeding orders...");
    const orders = [];
    const orderStatuses = ["PENDING", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"] as const;
    for (let i = 0; i < 50; i++) {
      const vendor = getRandomElement(vendors);
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i}`,
          vendorId: vendor.id,
          orderDate: getRandomDate(new Date("2024-01-01"), new Date()),
          expectedDelivery: new Date(Date.now() + getRandomInt(1, 30) * 24 * 60 * 60 * 1000),
          status: getRandomElement(orderStatuses),
          totalAmount: getRandomInt(10000, 500000),
          notes: `Order notes for order ${i + 1}`,
          createdBy: "admin",
          receivedBy: Math.random() > 0.3 ? "staff" : null,
          receivedAt: Math.random() > 0.3 ? new Date() : null,
        },
      });
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders`);

    // Seed OrderItems
    console.log("📝 Seeding order items...");
    let orderItemCount = 0;
    for (const order of orders) {
      const numItems = getRandomInt(1, 5);
      for (let i = 0; i < numItems; i++) {
        const item = getRandomElement(inventoryItems);
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            itemId: item.id,
            quantity: getRandomInt(1, 100),
            unitPrice: getRandomInt(100, 5000),
            receivedQty: getRandomInt(0, 100),
          },
        });
        orderItemCount++;
      }
    }
    console.log(`✅ Created ${orderItemCount} order items`);

    // Seed StockTransactions
    console.log("📊 Seeding stock transactions...");
    let transactionCount = 0;
    const transactionTypes = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "RETURN"] as const;
    for (const item of inventoryItems.slice(0, 50)) {
      for (let i = 0; i < 2; i++) {
        await prisma.stockTransaction.create({
          data: {
            itemId: item.id,
            transactionType: getRandomElement(transactionTypes),
            quantity: getRandomInt(1, 50),
            balanceAfter: getRandomInt(0, 500),
            reason: "Stock adjustment",
            referenceId: `REF-${i}`,
            referenceType: getRandomElement(["ORDER", "ISSUANCE", "ADJUSTMENT"]),
            performedBy: "admin",
            notes: "Transaction notes",
          },
        });
        transactionCount++;
      }
    }
    console.log(`✅ Created ${transactionCount} stock transactions`);

    // Seed StudentIssuances
    console.log("📤 Seeding student issuances...");
    let issuanceCount = 0;
    const issuanceStatuses = ["ISSUED", "PARTIALLY_RETURNED", "RETURNED"] as const;
    for (const student of students.slice(0, 50)) {
      const numIssuances = getRandomInt(1, 3);
      for (let i = 0; i < numIssuances; i++) {
        const item = getRandomElement(inventoryItems);
        await prisma.studentIssuance.create({
          data: {
            studentId: student.id,
            itemId: item.id,
            quantity: getRandomInt(1, 10),
            issuedDate: getRandomDate(new Date("2024-01-01"), new Date()),
            returnedDate: Math.random() > 0.5 ? new Date() : null,
            returnedQty: getRandomInt(0, 10),
            status: getRandomElement(issuanceStatuses),
            issuedBy: "staff",
            notes: "Issuance notes",
          },
        });
        issuanceCount++;
      }
    }
    console.log(`✅ Created ${issuanceCount} student issuances`);

    // Seed Hostel Rooms and Beds
    console.log("🏨 Seeding hostel rooms and beds...");
    const rooms = [];
    for (let i = 1; i <= 20; i++) {
      const room = await prisma.hostelRoom.create({
        data: {
          roomNumber: `Room-${i}`,
          capacity: getRandomInt(2, 6),
          description: `Hostel room ${i}`,
          isActive: Math.random() > 0.1,
        },
      });
      rooms.push(room);
    }
    console.log(`✅ Created ${rooms.length} hostel rooms`);

    // Seed Hostel Beds
    console.log("🛏️  Seeding hostel beds...");
    let bedCount = 0;
    const bedStatuses = ["AVAILABLE", "ALLOCATED", "INACTIVE"] as const;
    for (const room of rooms) {
      for (let i = 1; i <= room.capacity; i++) {
        await prisma.hostelBed.create({
          data: {
            roomId: room.id,
            bedNumber: `Bed-${i}`,
            pricePerDay: getRandomInt(200, 500),
            status: getRandomElement(bedStatuses),
            isActive: Math.random() > 0.1,
          },
        });
        bedCount++;
      }
    }
    console.log(`✅ Created ${bedCount} hostel beds`);

    // Seed Hostel Allocations
    console.log("🔑 Seeding hostel allocations...");
    let allocationCount = 0;
    const hostelStudents = students.filter((s) => s.hostel).slice(0, 50);
    for (const student of hostelStudents) {
      const bed = getRandomElement(
        await prisma.hostelBed.findMany({ where: { isActive: true } })
      );
      const allocation = await prisma.hostelAllocation.create({
        data: {
          studentId: student.id,
          roomId: bed.roomId,
          bedId: bed.id,
          allocationDate: getRandomDate(new Date("2024-01-01"), new Date()),
          deallocationDate: Math.random() > 0.7 ? new Date() : null,
          paidUntil: new Date(Date.now() + getRandomInt(1, 180) * 24 * 60 * 60 * 1000),
          creditBalance: getRandomInt(0, 5000),
          isActive: Math.random() > 0.2,
          notes: "Allocation notes",
        },
      });
      allocationCount++;
    }
    console.log(`✅ Created ${allocationCount} hostel allocations`);

    // Seed Hostel Payments
    console.log("💰 Seeding hostel payments...");
    let hostelPaymentCount = 0;
    const paymentMethods = ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CARD"] as const;
    const allocations = await prisma.hostelAllocation.findMany();
    for (const allocation of allocations.slice(0, 80)) {
      const numPayments = getRandomInt(1, 3);
      for (let i = 0; i < numPayments; i++) {
        await prisma.hostelPayment.create({
          data: {
            allocationId: allocation.id,
            amount: getRandomInt(5000, 50000),
            paymentDate: getRandomDate(new Date("2024-01-01"), new Date()),
            daysPurchased: getRandomInt(1, 30),
            updatedPaidUntil: new Date(Date.now() + getRandomInt(1, 180) * 24 * 60 * 60 * 1000),
            paymentMethod: getRandomElement(paymentMethods),
            referenceNumber: `REF-${i}`,
            notes: "Payment notes",
            createdBy: "admin",
          },
        });
        hostelPaymentCount++;
      }
    }
    console.log(`✅ Created ${hostelPaymentCount} hostel payments`);

    // Seed Category Payments
    console.log("💳 Seeding category payments...");
    let categoryPaymentCount = 0;
    const studentCategories = await prisma.studentCategory.findMany();
    for (const studentCat of studentCategories.slice(0, 100)) {
      const numPayments = getRandomInt(1, 3);
      for (let i = 0; i < numPayments; i++) {
        await prisma.categoryPayment.create({
          data: {
            studentCategoryId: studentCat.id,
            amount: getRandomInt(1000, 10000),
            paymentDate: getRandomDate(new Date("2024-01-01"), new Date()),
            paymentMethod: getRandomElement(paymentMethods),
            referenceNumber: `REF-${i}`,
            notes: "Category payment",
            createdBy: "admin",
          },
        });
        categoryPaymentCount++;
      }
    }
    console.log(`✅ Created ${categoryPaymentCount} category payments`);

    // Seed Vendor Payments
    console.log("🏦 Seeding vendor payments...");
    let vendorPaymentCount = 0;
    for (const vendor of vendors.slice(0, 50)) {
      const numPayments = getRandomInt(1, 3);
      for (let i = 0; i < numPayments; i++) {
        await prisma.vendorPayment.create({
          data: {
            vendorId: vendor.id,
            amount: getRandomInt(10000, 500000),
            paymentDate: getRandomDate(new Date("2024-01-01"), new Date()),
            paymentMethod: getRandomElement(paymentMethods),
            referenceNumber: `REF-${i}`,
            notes: "Vendor payment",
            createdBy: "admin",
          },
        });
        vendorPaymentCount++;
      }
    }
    console.log(`✅ Created ${vendorPaymentCount} vendor payments`);

    // Seed Inventory Bills
    console.log("📄 Seeding inventory bills...");
    let billCount = 0;
    const billingCategories = inventoryCategories.filter((c) => c.isBilling);
    for (const category of billingCategories) {
      for (let i = 0; i < 20; i++) {
        const startDate = getRandomDate(new Date("2024-01-01"), new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);

        await prisma.inventoryBill.create({
          data: {
            categoryId: category.id,
            periodStartDate: startDate,
            periodEndDate: endDate,
            amount: getRandomInt(5000, 50000),
            units: getRandomInt(100, 1000),
            billDate: new Date(),
            description: `${category.name} bill`,
            createdBy: "admin",
          },
        });
        billCount++;
      }
    }
    console.log(`✅ Created ${billCount} inventory bills`);

    console.log("\n✨ Database seeding completed successfully!");
    console.log(`
    Summary:
    - Students: 100
    - Categories: 5 (with 20 subcategories)
    - Vendors: 20
    - Inventory Items: 100
    - Orders: 50
    - Hostel Rooms: 20
    - Hostel Beds: ~100
    - And many more related records...
    `);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
