import { PrismaClient } from "@prisma/client";

export class BaseModel {
  table = "";
  prisma = new PrismaClient();

  async findFirst(options) {
    return await this.prisma[this.table].findFirst(options);
  }

  async create(data) {
    return await this.prisma[this.table].create({ data });
  }
  async update(id, data) {
    return await this.prisma[this.table].update({
      where: { id },
      data,
    });
  }
  async get(id) {
    return await this.prisma[this.table].findUnique({ where: { id } });
  }
  async findEmail(email) {
    return await this.prisma[this.table].findUnique({ where: { email } });
  }

  async findUnique(options) {
    return await this.prisma[this.table].findUnique(options);
  }

  async findMany(options) {
    return await this.prisma[this.table].findMany(options);
  }

  async delete(id) {
    return await this.prisma[this.table].delete({ where: { id } });
  }

  async list({
    page = 1,
    pageSize = 10,
    where = {},
    orderBy = { createdat: "desc" },
    include = {},
  } = {}) {
    try {
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);
      const records = await this.prisma[this.table].findMany({
        where,
        orderBy,
        include,
        take,
        skip,
      });
      const total = await this.prisma[this.table].count({ where });
      return {
        total,
        page: Number(page),
        pageSize: take,
        records,
      };
    } catch (error) {
      console.error(`Error in list:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      return await this.prisma[this.table].update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Error in update:`, error);
      throw error;
    }
  }
}
