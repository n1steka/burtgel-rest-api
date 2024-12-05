import bcrypt from "bcrypt";

export const encryptPassword = (password) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};
