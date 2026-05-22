export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("orders", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },

    orderDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    shippingCharge: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },

    address: {
      type: Sequelize.JSON,
      allowNull: false,
    },

    assignedArea: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    status: {
      type: Sequelize.ENUM(
        "PROCESSING",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "PARTIALLY_CANCELLED",
        "RETURN_REQUESTED"
      ),
      defaultValue: "PROCESSING",
    },

    razorpayPaymentId: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    paymentMethod: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    payment: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    codPaymentMode: {
      type: Sequelize.ENUM("CASH", "QR"),
      allowNull: true,
    },

    utrNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
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
  await queryInterface.dropTable("orders");
}