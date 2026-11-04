import productModel from "../models/product.js";
import categoryModel from "../models/category.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";
import redis from "../config/redis.js";
import { fetchWithCache } from "../utils/redisWrapper.js";
import { z } from "zod";

const CATEGORY_CACHE_KEY = "categories:v2";
let parentColumnReady = false;

const ensureParentColumn = async () => {
  if (parentColumnReady) return;
  const [column] = await sequelize.query(
    "SHOW COLUMNS FROM `categories` LIKE 'parentId'",
  );
  if (!column.length) {
    await sequelize.query(
      "ALTER TABLE `categories` ADD COLUMN `parentId` INT NULL",
    );
  }
  parentColumnReady = true;
};

const categoryInclude = [
  { model: categoryModel, as: "parent", attributes: ["id", "name"] },
];

const catalogQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["price_low", "price_high", "newest"]).default("newest"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
});

export const getProductsBatch = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json([]);

    // FIX: Used Number.parseInt with radix 10
    const idArray = ids.split(",").map((id) => Number.parseInt(id, 10));

    if (idArray.length === 0) return res.json([]);

    const cacheKey = `products:batch:${ids}`;

    const products = await fetchWithCache(cacheKey, 60, async () => {
      return await productModel.findAll({
        where: { id: { [Op.in]: idArray } },
        attributes: [
          "id",
          "name",
          "price",
          "images",
          "availableStock",
          "vendorId",
        ],
        include: { model: categoryModel, attributes: ["name"] },
      });
    });

    res.json(products);
  } catch (err) {
    console.error("Batch fetch error:", err);
    res.status(500).json({ message: "Failed to fetch batch products" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const parseResult = catalogQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid query parameters" });
    }

    const { category, sort, search, minPrice, maxPrice, limit, page } =
      parseResult.data;

    const cacheKey = `products:search:${category || "all"}:${sort}:${search || ""}:${minPrice || 0}:${maxPrice || "max"}:${limit}:${page}`;

    const products = await fetchWithCache(cacheKey, 60, async () => {
      let whereCondition = {};

      if (search) {
        whereCondition[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        whereCondition.price = {};
        if (minPrice !== undefined) whereCondition.price[Op.gte] = minPrice;
        if (maxPrice !== undefined) whereCondition.price[Op.lte] = maxPrice;
      }

      let orderCondition = [["createdAt", "DESC"]];

      if (sort === "price_low") orderCondition = [["price", "ASC"]];
      if (sort === "price_high") orderCondition = [["price", "DESC"]];

      const offset = (page - 1) * limit;

      return await productModel.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: categoryModel,
            attributes: ["id", "name", "parentId"],
            include: categoryInclude,
            where: await categoryFilter(category),
            required: Boolean(
              category && category !== "all" && category !== "All",
            ),
          },
        ],
        order: orderCondition,
        limit,
        offset,
      });
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    const product = await fetchWithCache(cacheKey, 3600, async () => {
      return await productModel.findByPk(id, {
        include: { model: categoryModel, include: categoryInclude },
      });
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    // FIX: Handled the exception by logging it
    console.error("Fetch Single Product Error:", error.message);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

const categoryFilter = async (category) => {
  if (!category || category === "all" || category === "All") return undefined;
  await ensureParentColumn();
  const matches = await categoryModel.findAll({
    where: { name: category },
    include: [{ model: categoryModel, as: "subcategories", attributes: ["id"] }],
  });
  const ids = matches.flatMap((row) => [
    row.id,
    ...(row.subcategories || []).map((child) => child.id),
  ]);
  return { id: { [Op.in]: ids.length ? ids : [0] } };
};

export const createCategory = async (req, res) => {
  try {
    await ensureParentColumn();
    const name = String(req.body?.name || "").trim();
    const parentId = req.body?.parentId ? Number(req.body.parentId) : null;
    if (name.length < 2) {
      return res.status(400).json({ message: "Enter a category name." });
    }
    if (parentId) {
      const parent = await categoryModel.findByPk(parentId);
      if (!parent || parent.parentId) {
        return res.status(400).json({
          message: "Choose a top-level category for this subcategory.",
        });
      }
    }
    const existing = await categoryModel.findOne({
      where: { name, parentId: parentId || null },
    });
    if (existing) {
      return res.status(409).json({ message: "This category already exists." });
    }
    const created = await categoryModel.create({ name, parentId: parentId || null });
    if (redis.status === "ready") await redis.del(CATEGORY_CACHE_KEY);
    res.status(201).json(created);
  } catch (error) {
    console.error("Create category error:", error.message);
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    await ensureParentColumn();
    const cacheKey = CATEGORY_CACHE_KEY;

    const categories = await fetchWithCache(cacheKey, 86400, async () => {
      return await categoryModel.findAll({
        include: categoryInclude,
        order: [["name", "ASC"]],
      });
    });

    // An empty list was cached before any categories existed. Do not keep serving it.
    if (!Array.isArray(categories) || categories.length === 0) {
      const fresh = await categoryModel.findAll({
        include: categoryInclude,
        order: [["name", "ASC"]],
      });
      if (fresh.length > 0) {
        try {
          const redis = (await import("../config/redis.js")).default;
          if (redis.status === "ready") {
            await redis.set(cacheKey, JSON.stringify(fresh), "EX", 86400);
          }
        } catch (cacheError) {
          console.error("Category cache refresh failed:", cacheError.message);
        }
      }
      return res.json(fresh);
    }

    res.json(categories);
  } catch (err) {
    // FIX: Handled the exception by logging it
    console.error("Fetch Categories Error:", err.message);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};
