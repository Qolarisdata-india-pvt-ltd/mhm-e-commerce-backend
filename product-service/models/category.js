import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { tableName: "categories" },
);

export default category;
