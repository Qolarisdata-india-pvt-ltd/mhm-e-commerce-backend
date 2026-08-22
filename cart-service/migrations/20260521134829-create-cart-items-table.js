export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("cartitems", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
  await queryInterface.dropTable("cartitems");
}