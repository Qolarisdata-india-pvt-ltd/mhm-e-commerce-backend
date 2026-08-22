export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("orderitems", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    orderId: {
      type: Sequelize.INTEGER,
      references: {
        model: "orders",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    productId: Sequelize.INTEGER,

    vendorId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    quantity: Sequelize.INTEGER,

    price: Sequelize.FLOAT,

    status: {
      type: Sequelize.ENUM(
        "PENDING",
        "PACKED",
        "DELIVERED",
        "OUT_FOR_DELIVERY",
        "CANCELLED",
        "RETURNED"
      ),
      defaultValue: "PENDING",
    },

    refundStatus: {
      type: Sequelize.ENUM(
        "NONE",
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "PICKUP_SCHEDULED",
        "CANCELLED",
        "RETURNED",
        "CREDITED",
        "COMPLETED"
      ),
      defaultValue: "NONE",
    },

    returnReason: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    refundMethod: {
      type: Sequelize.ENUM(
        "ORIGINAL_SOURCE",
        "BANK_TRANSFER",
        "WAREHOUSE_COLLECT"
      ),
      allowNull: true,
    },

    bankDetails: {
      type: Sequelize.JSON,
      allowNull: true,
    },

    returnDropMethod: {
      type: Sequelize.ENUM(
        "DELIVERY_BOY",
        "WAREHOUSE_DROP"
      ),
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

export async function down(queryInterface) {
  await queryInterface.dropTable("orderitems");
}