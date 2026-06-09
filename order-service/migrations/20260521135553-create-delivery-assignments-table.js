module.exports.up = async function (queryInterface, Sequelize) {
  await queryInterface.createTable("DeliveryAssignments", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    deliveryBoyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "DeliveryBoys",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: Sequelize.ENUM(
        "ASSIGNED",
        "PICKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "REASSIGNED"
      ),
      defaultValue: "ASSIGNED",
    },

    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    cashDeposited: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    depositedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

module.exports.down = async function (queryInterface) {
  await queryInterface.dropTable("DeliveryAssignments");
}