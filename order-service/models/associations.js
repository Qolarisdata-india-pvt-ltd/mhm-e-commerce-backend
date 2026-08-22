import deliveryBoy from "./deliveryBoy.js";
import deliveryAssignment from "./deliveryAssignment.js";
import order from "./order.js";
import orderItem from "./orderItem.js";

const defineAssociations = () => {
  deliveryBoy.hasMany(deliveryAssignment, { foreignKey: "deliveryBoyId" });
  deliveryAssignment.belongsTo(deliveryBoy, { foreignKey: "deliveryBoyId" });

  order.hasOne(deliveryAssignment, { foreignKey: "orderId" });
  deliveryAssignment.belongsTo(order, { foreignKey: "orderId" });

  order.hasMany(orderItem, { foreignKey: "orderId" });
  orderItem.belongsTo(order, { foreignKey: "orderId" });
};

export default defineAssociations;
