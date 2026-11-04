import shippingRateModel from "../models/shippingRate.js";
import { fetchWithCache, safeDeleteCache } from "../utils/redisWrapper.js";
import deliveryBoyModel from "../models/deliveryBoy.js";
import orderModel from "../models/order.js";

const renameAreaReferences = async (previousName, nextName) => {
  const boys = await deliveryBoyModel.findAll();
  for (const boy of boys) {
    const areas = Array.isArray(boy.assignedAreas) ? boy.assignedAreas : [];
    if (!areas.includes(previousName)) continue;
    boy.assignedAreas = areas.map((area) =>
      area === previousName ? nextName : area,
    );
    boy.changed("assignedAreas", true);
    await boy.save();
  }

  await orderModel.update(
    { assignedArea: nextName },
    { where: { assignedArea: previousName } },
  );

  try {
    await orderModel.sequelize.query(
      "UPDATE ecom_customers.addresses SET area = ? WHERE area = ?",
      { replacements: [nextName, previousName] },
    );
  } catch (error) {
    console.error("Address area rename skipped:", error.message);
  }
};

export const setShippingRate = async (req, res) => {
  try {
    const { areaName, rate, isActive, id, previousAreaName } = req.body;

    if (!areaName || rate === undefined) {
      return res
        .status(400)
        .json({ message: "Area Name and Rate are required." });
    }

    const cleanArea = areaName.trim();
    const cleanRate = Number.parseFloat(rate);

    if (Number.isNaN(cleanRate) || cleanRate < 0) {
      return res
        .status(400)
        .json({ message: "Rate must be a positive number." });
    }

    const recordId = id;
    const previousName = String(previousAreaName || "").trim();
    const existingByPrevious = !recordId && previousName
      ? await shippingRateModel.findOne({ where: { areaName: previousName } })
      : null;

    if (recordId || existingByPrevious) {
      const existing = recordId
        ? await shippingRateModel.findByPk(recordId)
        : existingByPrevious;
      if (!existing) {
        return res.status(404).json({ message: "Shipping rate not found." });
      }
      const clash = await shippingRateModel.findOne({
        where: { areaName: cleanArea },
      });
      if (clash && clash.id !== existing.id) {
        return res
          .status(409)
          .json({ message: "Another area already uses this name." });
      }
      const previousName = existing.areaName;
      existing.areaName = cleanArea;
      existing.rate = cleanRate;
      if (isActive !== undefined) existing.isActive = isActive;
      await existing.save();
      if (previousName !== cleanArea) {
        await renameAreaReferences(previousName, cleanArea);
      }
      await safeDeleteCache(["shipping_rates:all", "shipping_rates:active"]);
      return res.json({ message: "Shipping Rate Updated", data: existing });
    }

    const defaults = { rate: cleanRate };
    if (isActive !== undefined) defaults.isActive = isActive;

    const [rateRecord, created] = await shippingRateModel.findOrCreate({
      where: { areaName: cleanArea },
      defaults: defaults,
    });

    if (!created) {
      rateRecord.rate = cleanRate;
      if (isActive !== undefined) rateRecord.isActive = isActive;
      await rateRecord.save();
    }

    await safeDeleteCache(["shipping_rates:all", "shipping_rates:active"]);

    res.json({
      message: created ? "Shipping Rate Added" : "Shipping Rate Updated",
      data: rateRecord,
    });
  } catch (err) {
    console.error("Set Rate Error:", err);
    res.status(500).json({ message: "Failed to set shipping rate" });
  }
};

export const getAllShippingRates = async (req, res) => {
  try {
    const rates = await fetchWithCache(
      "shipping_rates:all",
      86400,
      async () => {
        return await shippingRateModel.findAll({ order: [["areaName", "ASC"]] });
      },
    );
    res.json(rates);
  } catch (err) {
    console.error("Fetch Rates Error:", err);
    res.status(500).json({ message: "Failed to fetch rates" });
  }
};

export const getActiveShippingRates = async (req, res) => {
  try {
    const rates = await fetchWithCache(
      "shipping_rates:active",
      86400,
      async () => {
        return await shippingRateModel.findAll({
          where: { isActive: true },
          order: [["areaName", "ASC"]],
        });
      },
    );
    res.json(rates);
  } catch (err) {
    console.error("Fetch Active Rates Error:", err);
    res.status(500).json({ message: "Failed to fetch active rates" });
  }
};

export const toggleShippingAreaStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await shippingRateModel.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Rate not found" });
    }

    record.isActive = !record.isActive;
    await record.save();

    await safeDeleteCache(["shipping_rates:all", "shipping_rates:active"]);

    res.json({
      message: `Shipping Area is now ${record.isActive ? "Active" : "Inactive"}`,
      data: record,
    });
  } catch (err) {
    console.error("Toggle Status Error:", err);
    res.status(500).json({ message: "Failed to toggle status" });
  }
};

export const deleteShippingRate = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await shippingRateModel.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Rate not found" });
    }

    const allBoys = await deliveryBoyModel.findAll({
      attributes: ["id", "name", "assignedAreas"],
    });

    const assignedBoys = allBoys.filter((boy) =>
      boy.assignedAreas?.includes(record.areaName),
    );

    if (assignedBoys.length > 0) {
      const boyNames = assignedBoys.map((b) => b.name).join(", ");
      return res.status(400).json({
        message: `Cannot delete. '${record.areaName}' is currently assigned to: ${boyNames}. Please update their areas first.`,
      });
    }

    await record.destroy();

    await safeDeleteCache(["shipping_rates:all", "shipping_rates:active"]);
    res.json({ message: "Shipping Rate deleted successfully" });
  } catch (err) {
    console.error("Delete Rate Error:", err);
    res.status(500).json({ message: "Failed to delete rate" });
  }
};

export const getShippingCharge = async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) return res.json({ rate: 0, available: false });

    const cleanArea = area.trim();

    const rateRecord = await shippingRateModel.findOne({
      where: { areaName: cleanArea, isActive: true },
    });

    if (!rateRecord) return res.json({ rate: 0, available: false });

    res.json({ rate: Number(rateRecord.rate), available: true });
  } catch (err) {
    console.error("Rate Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch rate" });
  }
};
