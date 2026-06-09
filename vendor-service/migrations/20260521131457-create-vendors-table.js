module.exports.up = async function (queryInterface, Sequelize) {
  await queryInterface.createTable("Vendors", {
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
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    businessName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    businessType: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    businessDescription: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    yearsInBusiness: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    businessAddress: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    aadharNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    panNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    gstNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    bankAccountHolderName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    bankAccountNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    bankIFSC: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    bankName: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "PENDING",
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
  await queryInterface.dropTable("Vendors");
}