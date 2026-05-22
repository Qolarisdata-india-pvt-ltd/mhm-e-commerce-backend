export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("shipping_rates", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    areaName: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    rate: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  await queryInterface.dropTable("shipping_rates");
}