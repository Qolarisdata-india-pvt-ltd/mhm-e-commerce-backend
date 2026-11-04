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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  { tableName: "categories" },
);

category.belongsTo(category, { as: "parent", foreignKey: "parentId" });
category.hasMany(category, { as: "subcategories", foreignKey: "parentId" });

export default category;
