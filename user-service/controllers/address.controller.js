import { DataTypes, Op } from "sequelize";
import addressModel from "../models/address.js";
import { z } from "zod";

const saveInProgress = new Set();

const addressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  isDefault: z.boolean().optional().default(false),
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  recipientName: z.string().trim().optional(),
  recipientPhone: z.string().trim().optional(),
});

let recipientColumnsReady = false;
let addressIdentityReady = false;

async function ensureAddressIdentity() {
  if (addressIdentityReady) return;
  const queryInterface = addressModel.sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("addresses");
  const idColumn = table.id;
  if (idColumn?.primaryKey && idColumn?.autoIncrement) {
    addressIdentityReady = true;
    return;
  }
  await addressModel.sequelize.query(
    "ALTER TABLE `addresses` MODIFY `id` INT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (`id`)",
  );
  addressIdentityReady = true;
}

async function ensureRecipientColumns() {
  if (recipientColumnsReady) return;
  const queryInterface = addressModel.sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("addresses");
  if (!table.recipientName) {
    await queryInterface.addColumn("addresses", "recipientName", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
  if (!table.recipientPhone) {
    await queryInterface.addColumn("addresses", "recipientPhone", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
  recipientColumnsReady = true;
}

function recipientFrom(data) {
  const recipientName = (data.recipientName || data.fullName || "").trim() || null;
  const recipientPhone = (data.recipientPhone || data.phone || "").trim() || null;
  if (recipientPhone && !/^[6-9]\d{9}$/.test(recipientPhone)) {
    return {
      error: "Enter a valid 10-digit mobile number starting with 6-9",
    };
  }
  return { recipientName, recipientPhone };
}

export const addAddress = async (req, res) => {
  const userId = req.user?.id;
  let ownsLock = false;
  try {
    const parseResult = addressSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parseResult.error.issues || parseResult.error.errors || [],
      });
    }

    if (saveInProgress.has(userId)) {
      return res.status(409).json({
        message: "This address is already being saved. Please wait.",
      });
    }
    saveInProgress.add(userId);
    ownsLock = true;

    const { addressLine1, state, city, area, isDefault } = parseResult.data;
    const recipient = recipientFrom(parseResult.data);
    if (recipient.error) {
      return res.status(400).json({ message: recipient.error });
    }

    await ensureRecipientColumns();
    await ensureAddressIdentity();

    const duplicate = await addressModel.findOne({
      where: {
        userId,
        addressLine1,
        area,
        recipientPhone: recipient.recipientPhone,
        createdAt: { [Op.gte]: new Date(Date.now() - 15000) },
      },
    });
    if (duplicate) {
      return res.status(200).json({
        message: "Address saved successfully",
        address: duplicate,
      });
    }

    const addressCount = await addressModel.count({ where: { userId } });
    const shouldBeDefault = addressCount === 0 ? true : isDefault;

    if (shouldBeDefault) {
      await addressModel.update({ isDefault: false }, { where: { userId } });
    }

    const newAddress = await addressModel.create({
      userId,
      addressLine1,
      state,
      city,
      area,
      recipientName: recipient.recipientName,
      recipientPhone: recipient.recipientPhone,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ message: "Address saved successfully", address: newAddress });
  } catch (error) {
    res.status(500).json({ message: "Failed to save address", error: error.message });
  } finally {
    if (ownsLock) saveInProgress.delete(userId);
  }
};


export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    await ensureAddressIdentity();

    const addresses = await addressModel.findAll({
      where: { userId },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

  
    res.json(addresses);
  } catch (error) {
    console.error("Get Addresses Error:", error); 
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await addressModel.destroy({
      where: { id, userId: req.user.id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Address not found" });
    }

  

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};


export const adminAddAddress = async (req, res) => {
  try {
    const parseResult = addressSchema.extend({
      userId: z.coerce.number().int().positive("Valid User ID is required")
    }).safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ message: "Validation failed", errors: parseResult.error.errors });
    }

    const { userId, addressLine1, state, city, area, isDefault } = parseResult.data;
    const recipient = recipientFrom(parseResult.data);
    if (recipient.error) {
      return res.status(400).json({ message: recipient.error });
    }

    await ensureRecipientColumns();
    await ensureAddressIdentity();

    const addressCount = await addressModel.count({ where: { userId } });
    const shouldBeDefault = addressCount === 0 ? true : isDefault;

    if (shouldBeDefault) {
      await addressModel.update({ isDefault: false }, { where: { userId } });
    }

    const newAddress = await addressModel.create({
      userId,
      addressLine1,
      state,
      city,
      area,
      recipientName: recipient.recipientName,
      recipientPhone: recipient.recipientPhone,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({ message: "Address added to user profile", address: newAddress });
  } catch (error) {
    console.error("Admin Add Address Error:", error);
    res.status(500).json({ message: "Failed to save address", error: error.message });
  }
};
