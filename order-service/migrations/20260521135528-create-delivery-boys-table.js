export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("deliveryboys", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    state: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Chhattisgarh",
    },

    city: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Raipur",
    },

    assignedAreas: {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: false,
    },

    maxOrders: {
      type: Sequelize.INTEGER,
      defaultValue: 100,
      allowNull: false,
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
  await queryInterface.dropTable("deliveryboys");
}