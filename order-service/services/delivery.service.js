import deliveryBoyModel from "../models/deliveryBoy.js";
import deliveryAssignmentModel from "../models/deliveryAssignment.js";
import { Op } from "sequelize";

export const autoAssignDeliveryBoy = async (
  orderId,
  area,
  transaction,
  reason = null,
) => {
  try {
    const existingAssignment = await deliveryAssignmentModel.findOne({
      where: { orderId, status: { [Op.ne]: "FAILED" }, reason: reason },
      transaction,
    });

    if (existingAssignment) {
      const boy = await deliveryBoyModel.findByPk(existingAssignment.deliveryBoyId, {
        transaction,
      });
      return { success: true, boy, message: "Already Assigned" };
    }

    const allBoys = await deliveryBoyModel.findAll({
      where: { active: true },
      transaction,
    });

    const validBoys = allBoys.filter((boy) =>
      boy.assignedAreas?.includes(area),
    );

    if (validBoys.length === 0) {
      return {
        success: false,
        message: `No delivery boy found for area: ${area}`,
      };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let bestBoy = null;
    let minLoad = Infinity;

    for (const boy of validBoys) {
      const load = await deliveryAssignmentModel.count({
        where: {
          deliveryBoyId: boy.id,
          createdAt: { [Op.gte]: startOfDay },
          status: { [Op.notIn]: ["FAILED", "REASSIGNED"] },
        },
        distinct: true,
        col: "orderId",
        transaction,
      });

      if (load < boy.maxOrders && load < minLoad) {
        minLoad = load;
        bestBoy = boy;
      }
    }

    if (!bestBoy) return { success: false, message: `All boys fully booked` };

    await deliveryAssignmentModel.create(
      {
        orderId,
        deliveryBoyId: bestBoy.id,
        status: "ASSIGNED",
        reason: reason,
      },
      { transaction },
    );

    return { success: true, boy: bestBoy, message: "Assigned Successfully" };
  } catch (err) {
    console.error("Auto-assign delivery boy error:", err);
    return { success: false, message: "Internal Error" };
  }
};
