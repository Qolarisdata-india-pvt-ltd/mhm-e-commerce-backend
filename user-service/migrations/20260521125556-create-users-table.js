module.exports.up = async function (queryInterface, Sequelize) {
  await queryInterface.createTable("Users", {
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

    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    profilePic: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    role: {
      type: Sequelize.ENUM("user"),
      allowNull: false,
      defaultValue: "user",
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
  await queryInterface.dropTable("Users");
}