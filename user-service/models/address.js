import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const address = sequelize.define(
  "Address",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    addressLine1: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    area: { type: DataTypes.STRING, allowNull: false },
    recipientName: { type: DataTypes.STRING, allowNull: true },
    recipientPhone: { type: DataTypes.STRING, allowNull: true },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { tableName: "addresses" },
);

export default address;
