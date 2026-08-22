import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  dbPassword,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,      
      min: 0,       
      acquire: 30000,
      idle: 10000   
    }
  }
);

export default sequelize;
