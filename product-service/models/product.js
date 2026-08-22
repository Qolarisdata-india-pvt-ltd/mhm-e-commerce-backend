import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import category from "./category.js";

const product = sequelize.define(
  "Product",
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
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const raw = this.getDataValue("images");
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return raw.startsWith("http") ? [raw] : [];
          }
        }
        return [];
      },
    },
    totalStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    warehouseStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    availableStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Products",
    hooks: {
      beforeCreate: (item) => {
        item.availableStock = item.totalStock - (item.reservedStock || 0);
      },
      beforeUpdate: (item) => {
        if (item.changed("totalStock") || item.changed("reservedStock")) {
          item.availableStock = item.totalStock - item.reservedStock;
        }
      },
      beforeBulkCreate: (items) => {
        items.forEach((item) => {
          item.availableStock = item.totalStock - (item.reservedStock || 0);
        });
      },
    },
  },
);

category.hasMany(product);
product.belongsTo(category);

export default product;
