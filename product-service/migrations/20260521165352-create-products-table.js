export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Products", {
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

    price: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    images: {
      type: Sequelize.JSON,
      defaultValue: [],
    },

    totalStock: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    reservedStock: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    warehouseStock: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    availableStock: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    vendorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    CategoryId: {
      type: Sequelize.INTEGER,

      references: {
        model: "Categories",
        key: "id",
      },

      onDelete: "SET NULL",
      onUpdate: "CASCADE",
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
  await queryInterface.dropTable("Products");
}