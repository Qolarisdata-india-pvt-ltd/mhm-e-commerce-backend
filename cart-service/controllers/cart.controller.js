import cartItemModel from "../models/cartItem.js";
import axios from "axios";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const axiosConfig = { timeout: 4000 };

const productHeaders = () =>
  INTERNAL_API_KEY ? { "x-internal-token": INTERNAL_API_KEY } : {};

const parseProductId = (value) => {
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }
  return productId;
};

const fetchProductById = async (productId) => {
  if (!PRODUCT_SERVICE_URL) {
    throw new Error("PRODUCT_SERVICE_URL is not configured");
  }

  const response = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`, {
    ...axiosConfig,
    headers: productHeaders(),
  });
  return response.data;
};

const fetchProductsBatch = async (productIds) => {
  if (!PRODUCT_SERVICE_URL) {
    throw new Error("PRODUCT_SERVICE_URL is not configured");
  }

  const { data: products } = await axios.get(`${PRODUCT_SERVICE_URL}/batch`, {
    params: { ids: productIds.join(",") },
    headers: productHeaders(),
    timeout: 8000,
  });

  const productsMap = {};
  products.forEach((product) => {
    productsMap[product.id] = product;
  });
  return productsMap;
};

const mapCartItems = (cartItems, productsMap) => {
  let total = 0;
  const items = [];

  for (const item of cartItems) {
    const product = productsMap[item.productId];
    if (!product) continue;

    const subtotal = product.price * item.quantity;
    total += subtotal;

    items.push({
      id: item.id,
      cartItemId: item.id,
      quantity: item.quantity,
      userId: item.userId,
      productId: item.productId,
      price: product.price,
      Product: {
        id: product.id,
        name: product.name,
        imageUrl:
          product.images && product.images.length > 0 ? product.images[0] : null,
        price: product.price,
        category: product.Category?.name ?? product.category?.name ?? null,
        availableStock: product.availableStock ?? product.stock ?? 0,
        vendorId: product.vendorId,
      },
    });
  }

  return { items, total };
};

const buildCartResponse = async (userId) => {
  const cartItems = await cartItemModel.findAll({ where: { userId } });
  if (cartItems.length === 0) {
    return { items: [], total: 0 };
  }

  const productIds = [...new Set(cartItems.map((item) => item.productId))];
  const productsMap = await fetchProductsBatch(productIds);
  return mapCartItems(cartItems, productsMap);
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const productId = parseProductId(req.body?.productId);
    const quantity = Number(req.body?.quantity ?? 1);

    if (!productId) {
      return res.status(400).json({ message: "Valid productId is required" });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    let product;
    try {
      product = await fetchProductById(productId);
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.response?.status >= 500) {
        return res.status(503).json({
          message: "Product service is currently unavailable. Try again later.",
        });
      }
      return res.status(404).json({ message: "Product not found" });
    }

    const currentStock = product.availableStock ?? product.stock ?? 0;
    if (currentStock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const existing = await cartItemModel.findOne({
      where: { userId, productId },
    });

    if (existing) {
      if (existing.quantity + quantity > currentStock) {
        return res.status(400).json({
          message: "Cannot add more than available stock",
        });
      }
      existing.quantity += quantity;
      await existing.save();
    } else {
      await cartItemModel.create({ userId, productId, quantity });
    }

    const cart = await buildCartResponse(userId);
    res.status(201).json({
      message: "Item added to cart",
      ...cart,
    });
  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const quantity = Number(req.body?.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    const item = await cartItemModel.findByPk(id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (Number(item.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized cart access" });
    }

    let product;
    try {
      product = await fetchProductById(item.productId);
    } catch (error) {
      console.error("Unable to verify stock at this time:", error.message);
      return res.status(503).json({ message: "Unable to verify stock at this time." });
    }

    const currentStock = product.availableStock ?? product.stock ?? 0;
    if (quantity > currentStock) {
      return res.status(400).json({ message: "Requested quantity exceeds stock" });
    }

    item.quantity = quantity;
    await item.save();

    const cart = await buildCartResponse(req.user.id);
    res.json(cart);
  } catch (err) {
    console.error("Update quantity error:", err.message);
    res.status(500).json({ message: "Failed to update quantity" });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    if (userId !== Number(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized cart access" });
    }

    const cart = await buildCartResponse(userId);
    res.json(cart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await cartItemModel.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (Number(item.userId) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized cart access" });
    }

    await item.destroy();

    const cart = await buildCartResponse(req.user.id);
    res.json({
      message: "Item removed from cart",
      ...cart,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await cartItemModel.destroy({ where: { userId } });
    res.json({ message: "Cart cleared successfully", items: [], total: 0 });
  } catch (err) {
    console.error("Clear cart error:", err.message);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};
