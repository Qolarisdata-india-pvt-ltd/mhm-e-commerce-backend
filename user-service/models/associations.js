import user from "./user.js";
import address from "./address.js";

const defineAssociations = () => {
  user.hasMany(address, {
    foreignKey: "userId",
    as: "addresses",
    onDelete: "CASCADE",
  });

  address.belongsTo(user, {
    foreignKey: "userId",
  });
};

export default defineAssociations;
