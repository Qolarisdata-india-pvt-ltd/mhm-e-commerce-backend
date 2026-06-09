module.exports.up = async function (queryInterface, Sequelize) {
  await queryInterface.createTable("Addresses", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,

      references: {
        model: "Users",
        key: "id",
      },

      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    addressLine1: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    state: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    city: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    area: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    isDefault: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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
  await queryInterface.dropTable("Addresses");
}