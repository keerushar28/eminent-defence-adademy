"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { IOrder, OrderStatus, OrderFilters } from "../types/inventory-types";
import { requireInventoryAccess } from "../lib/auth-utils";

// Validation Schemas (internal use only)
const orderItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
});

const orderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  expectedDelivery: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

// Helper function to generate unique order number
async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  
  // Get count of orders this month
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);
  
  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(4, "0");
  return `ORD-${year}${month}-${sequence}`;
}

// Order CRUD Actions
export async function getOrders(filters?: OrderFilters): Promise<IOrder[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const where: Prisma.OrderWhereInput = {
      isDeleted: false,
    };

    if (filters) {
      if (filters.vendorId) {
        where.vendorId = filters.vendorId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.orderDate = {};
        if (filters.dateFrom) {
          where.orderDate.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.orderDate.lte = filters.dateTo;
        }
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        vendor: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { orderDate: "desc" },
    });

    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        item: item.item ? {
          ...item.item,
          unitPrice: item.item.unitPrice ? Number(item.item.unitPrice) : null,
        } : undefined,
      })),
    })) as IOrder[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

export async function getOrderById(id: string): Promise<IOrder | null> {
  try {
    // Check access control
    await requireInventoryAccess();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        item: item.item ? {
          ...item.item,
          unitPrice: item.item.unitPrice ? Number(item.item.unitPrice) : null,
        } : undefined,
      })),
    } as IOrder;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw new Error("Failed to fetch order");
  }
}

export async function createOrder(formData: FormData, createdBy?: string) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = createdBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating order`);

    const itemsString = formData.get("items") as string;
    const items = JSON.parse(itemsString);

    const data = {
      vendorId: formData.get("vendorId") as string,
      expectedDelivery: formData.get("expectedDelivery") 
        ? new Date(formData.get("expectedDelivery") as string) 
        : undefined,
      notes: formData.get("notes") as string | undefined,
      items,
    };

    // Validate data
    const validatedData = orderSchema.parse(data);

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order with items and update inventory in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          vendorId: validatedData.vendorId,
          orderDate: new Date(),
          expectedDelivery: validatedData.expectedDelivery || null,
          status: "RECEIVED",
          totalAmount,
          notes: validatedData.notes || null,
          createdBy: performingUserId,
          receivedBy: performingUserId,
          receivedAt: new Date(),
          items: {
            create: validatedData.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              receivedQty: item.quantity,
            })),
          },
        },
        include: {
          vendor: true,
          items: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Update inventory for each item
      for (const item of validatedData.items) {
        // Update item stock
        const updatedItem = await tx.inventoryItem.update({
          where: { id: item.itemId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });

        // Create stock transaction
        await tx.stockTransaction.create({
          data: {
            itemId: item.itemId,
            transactionType: "STOCK_IN",
            quantity: item.quantity,
            balanceAfter: updatedItem.currentStock,
            reason: `Order received: ${orderNumber}`,
            referenceId: newOrder.id,
            referenceType: "ORDER",
            performedBy: performingUserId,
            notes: `Received ${item.quantity} units from order ${orderNumber}`,
          },
        });
      }

      return newOrder;
    });

    revalidatePath("/admin/inventory/orders");
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");
    return { success: true, data: order };
  } catch (error) {
    console.error("Error creating order:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid vendor or item selected",
        };
      }
      if (error.code === "P2002") {
        return {
          success: false,
          error: "Order number already exists",
        };
      }
    }

    return { success: false, error: "Failed to create order" };
  }
}

// Order Receiving Action
const receiveOrderItemSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  receivedQuantity: z.number().min(0, "Received quantity must be 0 or greater"),
});

const receiveOrderSchema = z.object({
  items: z.array(receiveOrderItemSchema).min(1, "At least one item is required"),
});

export async function receiveOrder(
  orderId: string,
  formData: FormData,
  receivedBy?: string
) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = receivedBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) receiving order ${orderId}`);

    const itemsString = formData.get("items") as string;
    const items = JSON.parse(itemsString);

    const data = {
      items,
    };

    // Validate data
    const validatedData = receiveOrderSchema.parse(data);

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the order with items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "RECEIVED" || order.status === "CANCELLED") {
        throw new Error(`Cannot receive order with status: ${order.status}`);
      }

      // Process each item
      const stockTransactions = [];
      let allItemsFullyReceived = true;
      let anyItemReceived = false;

      for (const receiveItem of validatedData.items) {
        const orderItem = order.items.find((oi) => oi.id === receiveItem.orderItemId);

        if (!orderItem) {
          throw new Error(`Order item not found: ${receiveItem.orderItemId}`);
        }

        if (receiveItem.receivedQuantity <= 0) {
          // Skip items with 0 received quantity
          if (orderItem.receivedQty < orderItem.quantity) {
            allItemsFullyReceived = false;
          }
          continue;
        }

        anyItemReceived = true;

        // Validate received quantity doesn't exceed ordered quantity
        const totalReceived = orderItem.receivedQty + receiveItem.receivedQuantity;
        if (totalReceived > orderItem.quantity) {
          throw new Error(
            `Received quantity exceeds ordered quantity for item: ${orderItem.item.name}`
          );
        }

        // Update order item received quantity
        await tx.orderItem.update({
          where: { id: receiveItem.orderItemId },
          data: {
            receivedQty: totalReceived,
          },
        });

        // Update item stock
        const updatedItem = await tx.inventoryItem.update({
          where: { id: orderItem.itemId },
          data: {
            currentStock: {
              increment: receiveItem.receivedQuantity,
            },
          },
        });

        // Create stock transaction
        const transaction = await tx.stockTransaction.create({
          data: {
            itemId: orderItem.itemId,
            transactionType: "STOCK_IN",
            quantity: receiveItem.receivedQuantity,
            balanceAfter: updatedItem.currentStock,
            reason: `Order received: ${order.orderNumber}`,
            referenceId: orderId,
            referenceType: "ORDER",
            performedBy: performingUserId,
            notes: `Received ${receiveItem.receivedQuantity} units from order ${order.orderNumber}`,
          },
        });

        stockTransactions.push(transaction);

        // Check if this item is fully received
        if (totalReceived < orderItem.quantity) {
          allItemsFullyReceived = false;
        }
      }

      if (!anyItemReceived) {
        throw new Error("No items were received");
      }

      // Determine new order status
      let newStatus: OrderStatus = "PARTIALLY_RECEIVED";
      if (allItemsFullyReceived) {
        newStatus = "RECEIVED";
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          receivedBy: newStatus === "RECEIVED" ? performingUserId : order.receivedBy,
          receivedAt: newStatus === "RECEIVED" ? new Date() : order.receivedAt,
        },
        include: {
          vendor: true,
          items: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      return {
        order: updatedOrder,
        transactions: stockTransactions,
      };
    });

    revalidatePath("/admin/inventory/orders");
    revalidatePath(`/admin/inventory/orders/${orderId}`);
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");

    return {
      success: true,
      data: result.order,
      message: `Order ${result.order.status === "RECEIVED" ? "fully" : "partially"} received`,
    };
  } catch (error) {
    console.error("Error receiving order:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Order or item not found",
        };
      }
    }

    return { success: false, error: "Failed to receive order" };
  }
}

// Update Order Action
const updateOrderItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be 0 or greater"),
});

const updateOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required").optional(),
  expectedDelivery: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(updateOrderItemSchema).optional(),
});

export async function updateOrder(orderId: string, formData: FormData) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) updating order ${orderId}`);

    // Fetch existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

    if (existingOrder.isDeleted) {
      return { success: false, error: "Cannot edit a deleted order" };
    }

    // Only PENDING and PARTIALLY_RECEIVED orders can be edited
    if (existingOrder.status !== "PENDING" && existingOrder.status !== "PARTIALLY_RECEIVED") {
      return {
        success: false,
        error: `Cannot edit order with status: ${existingOrder.status.replace(/_/g, " ").toLowerCase()}`,
      };
    }

    const itemsString = formData.get("items") as string;
    const items = itemsString ? JSON.parse(itemsString) : undefined;

    const vendorId = formData.get("vendorId") as string;
    const expectedDelivery = formData.get("expectedDelivery") as string;
    const notes = formData.get("notes") as string;

    // Validate
    const validatedData = updateOrderSchema.parse({
      vendorId: vendorId || undefined,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      notes: notes !== null ? notes || undefined : undefined,
      items,
    });

    // Determine what changed
    const vendorChanged = validatedData.vendorId && validatedData.vendorId !== existingOrder.vendorId;
    const notesChanged = validatedData.notes !== undefined && validatedData.notes !== existingOrder.notes;
    const deliveryChanged = validatedData.expectedDelivery !== undefined &&
      validatedData.expectedDelivery?.getTime() !== existingOrder.expectedDelivery?.getTime();

    // For PENDING orders, check if items changed
    const itemsChanged = existingOrder.status === "PENDING" && validatedData.items;

    let itemsDiff: {
      added: { itemId: string; quantity: number; unitPrice: number }[];
      removed: { id: string; itemId: string; quantity: number; unitPrice: number }[];
      kept: { itemId: string; quantity: number; unitPrice: number }[];
    } | null = null;

    if (itemsChanged && validatedData.items) {
      const oldItems = existingOrder.items;
      const newItems = validatedData.items;

      const oldItemMap = new Map(oldItems.map((i) => [i.itemId, i]));
      const newItemMap = new Map(newItems.map((i) => [i.itemId, i]));

      const added = newItems.filter((i) => !oldItemMap.has(i.itemId));
      const removed = oldItems
        .filter((i) => !newItemMap.has(i.itemId))
        .map((i) => ({ id: i.id, itemId: i.itemId, quantity: i.quantity, unitPrice: Number(i.unitPrice) }));
      const kept = newItems.filter((i) => {
        const old = oldItemMap.get(i.itemId);
        return old && (old.quantity !== i.quantity || Number(old.unitPrice) !== i.unitPrice);
      });

      itemsDiff = { added, removed, kept };

      // If nothing changed in items, treat as no change
      if (added.length === 0 && removed.length === 0 && kept.length === 0) {
        itemsDiff = null;
      }
    }

    // If nothing changed at all
    if (!vendorChanged && !notesChanged && !deliveryChanged && !itemsDiff) {
      return { success: true, data: existingOrder, message: "No changes detected" };
    }

    // Calculate new total if items changed
    let newTotal = Number(existingOrder.totalAmount);
    if (itemsDiff && validatedData.items) {
      newTotal = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
    }

    // Perform update in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order metadata
      const orderUpdate: Prisma.OrderUpdateInput = {};
      if (vendorChanged) orderUpdate.vendor = { connect: { id: validatedData.vendorId! } };
      if (deliveryChanged) orderUpdate.expectedDelivery = validatedData.expectedDelivery;
      if (notesChanged) orderUpdate.notes = validatedData.notes;
      if (itemsDiff) orderUpdate.totalAmount = newTotal;

      const order = await tx.order.update({
        where: { id: orderId },
        data: orderUpdate,
      });

      // Handle item changes for PENDING orders
      if (itemsDiff && validatedData.items) {
        // Remove deleted items
        for (const oldItem of itemsDiff!.removed) {
          await tx.orderItem.delete({
            where: { id: oldItem.id },
          });
        }

        // Update changed items
        for (const changedItem of itemsDiff!.kept) {
          const existingItem = existingOrder.items.find(
            (i) => i.itemId === changedItem.itemId
          );
          if (existingItem) {
            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: changedItem.quantity,
                unitPrice: changedItem.unitPrice,
              },
            });
          }
        }

        // Add new items
        for (const newItem of itemsDiff!.added) {
          await tx.orderItem.create({
            data: {
              orderId: orderId,
              itemId: newItem.itemId,
              quantity: newItem.quantity,
              unitPrice: newItem.unitPrice,
              receivedQty: 0,
            },
          });
        }

        // Handle stock adjustments for removed items
        for (const removedItem of itemsDiff!.removed) {
          const updatedItem = await tx.inventoryItem.update({
            where: { id: removedItem.itemId },
            data: {
              currentStock: {
                decrement: removedItem.quantity,
              },
            },
          });

          await tx.stockTransaction.create({
            data: {
              itemId: removedItem.itemId,
              transactionType: "ADJUSTMENT",
              quantity: -removedItem.quantity,
              balanceAfter: updatedItem.currentStock,
              reason: `Order ${order.orderNumber} item removed`,
              referenceId: orderId,
              referenceType: "ORDER",
              performedBy: user.id,
              notes: `Removed ${removedItem.quantity} units from order ${order.orderNumber}`,
            },
          });
        }

        // Handle stock adjustments for added items
        for (const addedItem of itemsDiff!.added) {
          const updatedItem = await tx.inventoryItem.update({
            where: { id: addedItem.itemId },
            data: {
              currentStock: {
                increment: addedItem.quantity,
              },
            },
          });

          await tx.stockTransaction.create({
            data: {
              itemId: addedItem.itemId,
              transactionType: "STOCK_IN",
              quantity: addedItem.quantity,
              balanceAfter: updatedItem.currentStock,
              reason: `Order ${order.orderNumber} item added`,
              referenceId: orderId,
              referenceType: "ORDER",
              performedBy: user.id,
              notes: `Added ${addedItem.quantity} units to order ${order.orderNumber}`,
            },
          });
        }

        // Handle stock adjustments for changed items (quantity difference)
        for (const changedItem of itemsDiff!.kept) {
          const existingItem = existingOrder.items.find(
            (i) => i.itemId === changedItem.itemId
          );
          if (existingItem) {
            const qtyDiff = changedItem.quantity - existingItem.quantity;
            if (qtyDiff !== 0) {
              const updatedItem = await tx.inventoryItem.update({
                where: { id: changedItem.itemId },
                data: {
                  currentStock: {
                    increment: qtyDiff,
                  },
                },
              });

              await tx.stockTransaction.create({
                data: {
                  itemId: changedItem.itemId,
                  transactionType: qtyDiff > 0 ? "STOCK_IN" : "ADJUSTMENT",
                  quantity: qtyDiff,
                  balanceAfter: updatedItem.currentStock,
                  reason: `Order ${order.orderNumber} quantity adjusted`,
                  referenceId: orderId,
                  referenceType: "ORDER",
                  performedBy: user.id,
                  notes: `Adjusted ${Math.abs(qtyDiff)} units ${qtyDiff > 0 ? "added to" : "removed from"} order ${order.orderNumber}`,
                },
              });
            }
          }
        }
      }

      return order;
    });

    revalidatePath("/admin/inventory/orders");
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");

    return { success: true, data: updatedOrder, message: "Order updated successfully" };
  } catch (error) {
    console.error("Error updating order:", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Order or related record not found" };
      }
      if (error.code === "P2003") {
        return { success: false, error: "Invalid vendor or item selected" };
      }
    }

    return { success: false, error: "Failed to update order" };
  }
}

// Soft Delete Order Action
export async function deleteOrder(orderId: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) soft-deleting order ${orderId}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, isDeleted: true, status: true, orderNumber: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.isDeleted) {
      return { success: false, error: "Order is already in trash" };
    }

    // Only PENDING orders can be soft-deleted
    if (order.status !== "PENDING") {
      return {
        success: false,
        error: "Only pending orders can be deleted. Received or partially received orders cannot be removed.",
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    revalidatePath("/admin/inventory/orders");
    return { success: true, message: "Order moved to trash" };
  } catch (error) {
    console.error("Error deleting order:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Order not found" };
      }
    }

    return { success: false, error: "Failed to delete order" };
  }
}

// Restore Order Action
export async function restoreOrder(orderId: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) restoring order ${orderId}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, isDeleted: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.isDeleted) {
      return { success: false, error: "Order is not in trash" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    revalidatePath("/admin/inventory/orders");
    return { success: true, message: "Order restored successfully" };
  } catch (error) {
    console.error("Error restoring order:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Order not found" };
      }
    }

    return { success: false, error: "Failed to restore order" };
  }
}

// Get Deleted Orders Action
export async function getDeletedOrders(): Promise<IOrder[]> {
  try {
    await requireInventoryAccess();

    const orders = await prisma.order.findMany({
      where: { isDeleted: true },
      include: {
        vendor: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        item: item.item
          ? {
              ...item.item,
              unitPrice: item.item.unitPrice ? Number(item.item.unitPrice) : null,
            }
          : undefined,
      })),
    })) as IOrder[];
  } catch (error) {
    console.error("Error fetching deleted orders:", error);
    throw new Error("Failed to fetch deleted orders");
  }
}

// Permanent Delete Order Action (hard delete)
export async function permanentDeleteOrder(orderId: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) permanently deleting order ${orderId}`);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, isDeleted: true, orderNumber: true, status: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.isDeleted) {
      return { success: false, error: "Order must be moved to trash before permanent deletion" };
    }

    // Hard delete - OrderItem has onDelete: Cascade so items are deleted automatically
    await prisma.order.delete({
      where: { id: orderId },
    });

    revalidatePath("/admin/inventory/orders");
    return { success: true, message: "Order permanently deleted" };
  } catch (error) {
    console.error("Error permanently deleting order:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Order not found" };
      }
    }

    return { success: false, error: "Failed to permanently delete order" };
  }
}
